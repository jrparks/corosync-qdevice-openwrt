FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt update && apt install -y \
    build-essential clang flex bison g++ gawk gcc-multilib \
    gettext git libncurses-dev libssl-dev python3 python3-distutils python3-setuptools unzip zlib1g-dev \
    file wget rsync ca-certificates pkg-config autoconf automake libtool libnss3-tools \
    patchelf cpio sudo curl jq tar xz-utils zstd \
    && rm -rf /var/lib/apt/lists/*

# Target architecture can be passed via build arg (default: armsr/armv8)
ARG OPENWRT_VERSION=23.05.5
ARG TARGET=armsr
ARG SUBTARGET=armv8

WORKDIR /opt

RUN BASE="https://downloads.openwrt.org/releases/${OPENWRT_VERSION}/targets/${TARGET}/${SUBTARGET}" && \
    SDK_FILE=$(wget -qO- "$BASE/" | grep -oE 'openwrt-sdk-[^"<>]+\.tar\.(xz|zst)' | head -n1) && \
    [ -n "$SDK_FILE" ] || { echo "No SDK found at $BASE/" >&2; exit 1; } && \
    wget -q "$BASE/$SDK_FILE" && \
    tar -xf "$SDK_FILE" && \
    rm -f "$SDK_FILE" && \
    mv openwrt-sdk-* sdk

ENV TARGET=${TARGET} SUBTARGET=${SUBTARGET}

WORKDIR /opt/sdk

# Pre-seed feeds
RUN ./scripts/feeds update base packages || true

COPY build.sh /build/build.sh
RUN chmod +x /build/build.sh

CMD ["/bin/bash", "/build/build.sh"]
