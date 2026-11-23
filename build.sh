#!/bin/bash
set -e

SDK_DIR=/opt/sdk
OUTPUT_DIR=/build/output
TARGET="${TARGET:-armsr}"
SUBTARGET="${SUBTARGET:-armv8}"
mkdir -p "${OUTPUT_DIR}"

echo "=== Copying Corosync & Supporting Packages into OpenWrt SDK ==="
cp -r /build/package/* "${SDK_DIR}/package/"

cd "${SDK_DIR}"

echo "=== Configuring OpenWrt Targets & Packages ==="
cat << EOF > .config
CONFIG_TARGET_${TARGET}=y
CONFIG_TARGET_${TARGET}_${SUBTARGET}=y
CONFIG_PACKAGE_libnspr=m
CONFIG_PACKAGE_libnss=m
CONFIG_PACKAGE_corosync-qnetd=m
CONFIG_PACKAGE_corosync-nss-tools=m
EOF

make defconfig

NPROC=$(nproc 2>/dev/null || echo 4)

echo "=== Step 1/3: Building nspr 4.41 ==="
make package/corosync/nspr/compile V=s -j${NPROC}

echo "=== Step 2/3: Building nss 3.134 ==="
make package/corosync/nss/compile V=s -j${NPROC}

echo "=== Step 3/3: Building corosync-qnetd 3.0.5 ==="
make package/corosync/corosync-qnetd/compile V=s -j${NPROC}

echo "=== Collecting Compiled Packages ==="
rm -f "${OUTPUT_DIR}"/*.ipk "${OUTPUT_DIR}"/*.apk
find bin/packages \( -name "*.ipk" -o -name "*.apk" \) -exec cp {} "${OUTPUT_DIR}/" \;

# OpenWrt 25.12 apk file names carry no arch; append it from the SDK config
if ls "${OUTPUT_DIR}"/*.apk >/dev/null 2>&1; then
    ARCH=$(sed -n 's/^CONFIG_TARGET_ARCH_PACKAGES="\(.*\)"$/\1/p' "${SDK_DIR}/.config")
    for apk in "${OUTPUT_DIR}"/*.apk; do
        case "$apk" in
            *_"${ARCH}".apk) continue ;;
        esac
        mv "$apk" "${apk%.apk}_${ARCH}.apk"
    done
fi

# Repack ipks for GL.iNet if TARGET_ARCH_OVERRIDE is provided
if [ -n "${TARGET_ARCH_OVERRIDE}" ]; then
    echo "=== Adapting IPK Architecture metadata to: ${TARGET_ARCH_OVERRIDE} ==="
    for ipk in "${OUTPUT_DIR}"/*.ipk; do
        [ -f "$ipk" ] || continue
        # Absolute path: the subshell chdirs into $tmpdir before reading $ipk
        ipk_abs=$(readlink -f "$ipk")
        tmpdir=$(mktemp -d)
        tar xzf "$ipk_abs" -C "$tmpdir"
        mkdir "$tmpdir/ctrl"
        tar xzf "$tmpdir/control.tar.gz" -C "$tmpdir/ctrl"
        old_arch=$(sed -n 's/^Architecture: //p' "$tmpdir/ctrl/control")
        sed -i "s/^Architecture: .*/Architecture: ${TARGET_ARCH_OVERRIDE}/" "$tmpdir/ctrl/control"
        (cd "$tmpdir/ctrl" && tar czf ../control.tar.gz .)
        rm -rf "$tmpdir/ctrl"
        rm "$ipk_abs"
        (cd "$tmpdir" && tar czf "$ipk_abs" ./debian-binary ./control.tar.gz ./data.tar.gz)
        rm -rf "$tmpdir"
        # Rename to the repacked arch so the file name matches its metadata
        if [ -n "$old_arch" ] && [ "$old_arch" != "${TARGET_ARCH_OVERRIDE}" ]; then
            mv "$ipk_abs" "${ipk_abs%_${old_arch}.ipk}_${TARGET_ARCH_OVERRIDE}.ipk"
        fi
    done
fi

cd "${OUTPUT_DIR}"
ls *.ipk *.apk 2>/dev/null | xargs -r sha256sum > SHA256SUMS.txt || true

echo "=== Build Complete! Packages ready in ${OUTPUT_DIR}: ==="
ls -lh "${OUTPUT_DIR}"
cat "${OUTPUT_DIR}/SHA256SUMS.txt" 2>/dev/null || true
