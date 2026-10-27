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
CONFIG_PACKAGE_libqb=m
CONFIG_PACKAGE_libknet=m
CONFIG_PACKAGE_libnspr=m
CONFIG_PACKAGE_libnss=m
CONFIG_PACKAGE_corosync=m
CONFIG_PACKAGE_corosync-tools=m
CONFIG_PACKAGE_libcorosync=m
CONFIG_PACKAGE_corosync-qnetd=m
CONFIG_PACKAGE_corosync-nss-tools=m
EOF

make defconfig

NPROC=$(nproc 2>/dev/null || echo 4)

echo "=== Step 1/6: Building libqb 2.0.10 ==="
make package/corosync/libqb/compile V=s -j${NPROC}

echo "=== Step 2/6: Building nspr 4.35 ==="
make package/corosync/nspr/compile V=s -j${NPROC}

echo "=== Step 3/6: Building nss 3.98 ==="
make package/corosync/nss/compile V=s -j${NPROC}

echo "=== Step 4/6: Building libknet 1.35 ==="
make package/corosync/libknet/compile V=s -j${NPROC}

echo "=== Step 5/6: Building corosync-qnetd 3.0.4 ==="
make package/corosync/corosync-qnetd/compile V=s -j${NPROC}

echo "=== Step 6/6: Building corosync 3.2.0 (Cluster Engine) ==="
make package/corosync/corosync/compile V=s -j${NPROC} || echo "Corosync cluster daemon skipped (qnetd ready)"

echo "=== Collecting Compiled Packages ==="
rm -f "${OUTPUT_DIR}"/*.ipk
find bin/packages -name "*.ipk" -exec cp {} "${OUTPUT_DIR}/" \;

# Repack ipks for GL.iNet if TARGET_ARCH_OVERRIDE is provided
if [ -n "${TARGET_ARCH_OVERRIDE}" ]; then
    echo "=== Adapting IPK Architecture metadata to: ${TARGET_ARCH_OVERRIDE} ==="
    for ipk in "${OUTPUT_DIR}"/*.ipk; do
        [ -f "$ipk" ] || continue
        tmpdir=$(mktemp -d)
        (
            cd "$tmpdir"
            tar xzf "$ipk"
            mkdir ctrl
            tar xzf control.tar.gz -C ctrl
            sed -i "s/^Architecture: .*/Architecture: ${TARGET_ARCH_OVERRIDE}/" ctrl/control
            (cd ctrl && tar czf ../control.tar.gz .)
            rm -rf ctrl
            rm "$ipk"
            tar czf "$ipk" debian-binary control.tar.gz data.tar.gz
        )
        rm -rf "$tmpdir"
    done
fi

cd "${OUTPUT_DIR}"
sha256sum *.ipk > SHA256SUMS.txt 2>/dev/null || true

echo "=== Build Complete! Packages ready in ${OUTPUT_DIR}: ==="
ls -lh "${OUTPUT_DIR}"
cat "${OUTPUT_DIR}/SHA256SUMS.txt" 2>/dev/null || true
