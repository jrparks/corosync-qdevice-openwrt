#!/bin/bash
set -e

SDK_DIR=/opt/sdk
OUTPUT_DIR=/build/output
FEED_SRC=/build/openwrt-feed

mkdir -p "${OUTPUT_DIR}"
mkdir -p "${SDK_DIR}/package/corosync-feed"

echo "=== Copying Corosync & Supporting Packages into OpenWrt SDK ==="
if [ -d "/build/package/corosync" ]; then
    cp -r /build/package/corosync/* "${SDK_DIR}/package/corosync-feed/"
elif [ -d "/build/openwrt-feed" ]; then
    cp -r /build/openwrt-feed/* "${SDK_DIR}/package/corosync-feed/"
fi

cd "${SDK_DIR}"

echo "=== Configuring OpenWrt Targets & Packages ==="
cat << 'EOF' > .config
CONFIG_TARGET_armsr=y
CONFIG_TARGET_armsr_armv8=y

# Supporting Libraries
CONFIG_PACKAGE_libqb=m
CONFIG_PACKAGE_libknet=m
CONFIG_PACKAGE_libnspr=m
CONFIG_PACKAGE_libnss=m

# Corosync 3.2 Full Suite
CONFIG_PACKAGE_corosync=m
CONFIG_PACKAGE_corosync-tools=m
CONFIG_PACKAGE_libcorosync=m

# Corosync Quorum Net Daemon & NSS Tools
CONFIG_PACKAGE_corosync-qnetd=m
CONFIG_PACKAGE_corosync-qdevice=m
CONFIG_PACKAGE_corosync-nss-tools=m

# Dependencies
CONFIG_PACKAGE_libopenssl=y
CONFIG_PACKAGE_zlib=y
CONFIG_PACKAGE_libpthread=y
CONFIG_PACKAGE_librt=y
EOF

make defconfig

NPROC=$(nproc 2>/dev/null || echo 4)

echo "=== Step 1/6: Building libqb 2.0.10 ==="
make package/corosync-feed/libqb/compile V=s -j${NPROC}

echo "=== Step 2/6: Building nspr 4.35 ==="
make package/corosync-feed/nspr/compile V=s -j${NPROC}

echo "=== Step 3/6: Building nss 3.98 ==="
make package/corosync-feed/nss/compile V=s -j${NPROC}

echo "=== Step 4/6: Building libknet 1.35 ==="
make package/corosync-feed/libknet/compile V=s -j${NPROC}

echo "=== Step 5/6: Building corosync 3.2.0 (Cluster Engine) ==="
make package/corosync-feed/corosync/compile V=s -j${NPROC}

echo "=== Step 6/6: Building corosync-qdevice & qnetd 3.0.4 ==="
make package/corosync-feed/corosync-qdevice/compile V=s -j${NPROC}

echo "=== Collecting Compiled Packages ==="
rm -f "${OUTPUT_DIR}"/*.ipk "${OUTPUT_DIR}"/*.apk
find bin/packages -name "*.ipk" -exec cp {} "${OUTPUT_DIR}/" \;

# Optional architecture string remap for specific embedded devices (e.g., GL.iNet)
# If TARGET_ARCH_OVERRIDE is passed, repacks control metadata cleanly.
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
