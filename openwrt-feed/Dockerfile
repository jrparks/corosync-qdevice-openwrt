FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt update && apt install -y \
    build-essential clang flex bison g++ gawk gcc-multilib \
    gettext git libncurses-dev libssl-dev python3 python3-distutils unzip zlib1g-dev \
    file wget rsync ca-certificates pkg-config autoconf automake libtool libnss3-tools \
    patchelf cpio sudo curl jq tar xz-utils \
    && rm -rf /var/lib/apt/lists/*

# Target architecture can be passed via build arg (default: armsr/armv8)
ARG OPENWRT_VERSION=23.05.5
ARG TARGET=armsr
ARG SUBTARGET=armv8
ARG SDK_TARBALL=openwrt-sdk-${OPENWRT_VERSION}-${TARGET}-${SUBTARGET}_gcc-12.3.0_musl.Linux-x86_64.tar.xz

WORKDIR /opt

RUN wget -q "https://downloads.openwrt.org/releases/${OPENWRT_VERSION}/targets/${TARGET}/${SUBTARGET}/${SDK_TARBALL}" \
    || wget -q "https://downloads.openwrt.org/snapshots/targets/${TARGET}/${SUBTARGET}/openwrt-sdk-${TARGET}-${SUBTARGET}_gcc-12.3.0_musl.Linux-x86_64.tar.xz" \
    || wget -q "https://downloads.openwrt.org/releases/23.05.3/targets/armsr/armv8/openwrt-sdk-23.05.3-armsr-armv8_gcc-12.3.0_musl.Linux-x86_64.tar.xz"

RUN tar -xf openwrt-sdk-*.tar.xz && \
    rm openwrt-sdk-*.tar.xz && \
    mv openwrt-sdk-* sdk

WORKDIR /opt/sdk

# Pre-seed feeds
RUN ./scripts/feeds update base packages || true

COPY build.sh /build/build.sh
RUN chmod +x /build/build.sh

CMD ["/bin/bash", "/build/build.sh"]
