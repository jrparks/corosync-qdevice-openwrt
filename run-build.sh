#!/bin/bash
set -e

# Run this script on host machine with Docker installed
# Usage:
#   ./run-build.sh
# Or with target architecture override for GL.iNet:
#   TARGET_ARCH_OVERRIDE="aarch64_cortex-a53_neon-vfpv4" ./run-build.sh

mkdir -p sdk-state/build_dir sdk-state/staging_dir sdk-state/dl output

echo "Building Docker build container..."
docker build -t openwrt-corosync-builder -f Dockerfile .

echo "Running OpenWrt SDK compilation container..."
docker run --rm \
  -e TARGET_ARCH_OVERRIDE="${TARGET_ARCH_OVERRIDE}" \
  -v "$(pwd):/build" \
  -v "$(pwd)/sdk-state/build_dir:/opt/sdk/build_dir" \
  -v "$(pwd)/sdk-state/staging_dir:/opt/sdk/staging_dir/target-aarch64_generic_musl" \
  -v "$(pwd)/sdk-state/dl:/opt/sdk/dl" \
  openwrt-corosync-builder bash /build/build.sh \
  | tee output/build.log

echo "Build finished! Check output/ directory for .ipk packages and SHA256SUMS.txt."
