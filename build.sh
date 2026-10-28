#!/bin/bash
set -e

SDK_DIR=/opt/sdk
OUTPUT_DIR=/build/output
mkdir -p "${OUTPUT_DIR}"

echo "=== Copying Corosync & Supporting Packages into OpenWrt SDK ==="
cp -r /build/package/* "${SDK_DIR}/package/"

cd "${SDK_DIR}"

echo "=== Configuring OpenWrt Targets & Packages ==="
cat << 'EOF' > .config
CONFIG_TARGET_armsr=y
CONFIG_TARGET_armsr_armv8=y
CONFIG_PACKAGE_libnspr=m
CONFIG_PACKAGE_libnss=m
CONFIG_PACKAGE_corosync-qnetd=m
CONFIG_PACKAGE_corosync-nss-tools=m
EOF

make defconfig

NPROC=$(nproc 2>/dev/null || echo 4)

echo "=== Step 1/3: Building nspr 4.35 ==="
make package/corosync/nspr/compile V=s -j${NPROC}

echo "=== Step 2/3: Building nss 3.98 ==="
make package/corosync/nss/compile V=s -j${NPROC}

echo "=== Step 3/3: Building corosync-qnetd 3.0.4 ==="
make package/corosync/corosync-qnetd/compile V=s -j${NPROC}

echo "=== Collecting Compiled Packages ==="
rm -f "${OUTPUT_DIR}"/*.ipk
find bin/packages -name "*.ipk" -exec cp {} "${OUTPUT_DIR}/" \;

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
sha256sum *.ipk > SHA256SUMS.txt 2>/dev/null || true

echo "=== Build Complete! Packages ready in ${OUTPUT_DIR}: ==="
ls -lh "${OUTPUT_DIR}"
cat "${OUTPUT_DIR}/SHA256SUMS.txt" 2>/dev/null || true
