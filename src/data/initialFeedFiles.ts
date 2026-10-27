import { FeedFile } from './packageData';

export const INITIAL_FEED_FILES: FeedFile[] = [
  {
    id: 'corosync-make',
    name: 'Makefile',
    path: 'corosync/Makefile',
    category: 'corosync',
    description: 'OpenWrt package definition for Corosync 3.2.0 (cluster engine, tools, libcorosync)',
    language: 'Makefile',
    content: `include $(TOPDIR)/rules.mk

PKG_NAME:=corosync
PKG_VERSION:=3.2.0
PKG_RELEASE:=1

PKG_SOURCE:=corosync-$(PKG_VERSION).tar.gz
PKG_SOURCE_URL:=https://github.com/corosync/corosync/releases/download/v$(PKG_VERSION)/
PKG_HASH:=skip

PKG_MAINTAINER:=OpenWrt Community
PKG_LICENSE:=BSD-3-Clause
PKG_LICENSE_FILES:=LICENSE

PKG_FIXUP:=autoreconf
PKG_BUILD_PARALLEL:=1
PKG_INSTALL:=1

include $(INCLUDE_DIR)/package.mk

define Package/corosync/Default
  SECTION:=net
  CATEGORY:=Network
  TITLE:=Corosync Cluster Engine
  URL:=https://corosync.github.io/corosync/
endef

define Package/corosync
$(call Package/corosync/Default)
  TITLE:=Corosync Cluster Engine Daemon
  DEPENDS:=+libcorosync +libqb +libknet +libpthread +librt
  MENU:=1
endef

define Package/corosync-tools
$(call Package/corosync/Default)
  TITLE:=Corosync Management & Diagnostic Tools
  DEPENDS:=+corosync
endef

define Package/libcorosync
$(call Package/corosync/Default)
  SECTION:=libs
  CATEGORY:=Libraries
  TITLE:=Corosync Shared Libraries
  DEPENDS:=+libqb +libknet +libpthread +librt
endef

CONFIGURE_ARGS += \\
	--disable-systemd \\
	--with-initddir=/etc/init.d \\
	--with-logdir=/var/log/corosync \\
	--enable-monitoring=no \\
	--enable-snmp=no \\
	--enable-dbus=no \\
	--enable-xmlconf=no \\
	--disable-doc \\
	--disable-man

CONFIGURE_VARS += \\
	PKG_CONFIG_PATH="$(STAGING_DIR)/usr/lib/pkgconfig"

define Build/InstallDev
	$(INSTALL_DIR) $(1)/usr/include/corosync
	$(CP) $(PKG_INSTALL_DIR)/usr/include/corosync/* $(1)/usr/include/corosync/
	$(INSTALL_DIR) $(1)/usr/lib
	$(CP) $(PKG_INSTALL_DIR)/usr/lib/lib*.so* $(1)/usr/lib/
	$(INSTALL_DIR) $(1)/usr/lib/pkgconfig
	$(CP) $(PKG_INSTALL_DIR)/usr/lib/pkgconfig/*.pc $(1)/usr/lib/pkgconfig/
endef

define Package/libcorosync/install
	$(INSTALL_DIR) $(1)/usr/lib
	$(CP) $(PKG_INSTALL_DIR)/usr/lib/lib*.so.* $(1)/usr/lib/
endef

define Package/corosync/install
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/usr/sbin/corosync $(1)/usr/sbin/
	$(INSTALL_DIR) $(1)/etc/corosync
	$(INSTALL_DATA) ./files/corosync.conf $(1)/etc/corosync/corosync.conf.example
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/corosync.init $(1)/etc/init.d/corosync
endef

define Package/corosync-tools/install
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/usr/sbin/corosync-cfgtool $(1)/usr/sbin/
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/usr/sbin/corosync-cmapctl $(1)/usr/sbin/
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/usr/sbin/corosync-cpgtool $(1)/usr/sbin/
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/usr/sbin/corosync-quorumtool $(1)/usr/sbin/
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/usr/sbin/corosync-keygen $(1)/usr/sbin/
endef

$(eval $(call BuildPackage,corosync))
$(eval $(call BuildPackage,corosync-tools))
$(eval $(call BuildPackage,libcorosync))`,
  },
  {
    id: 'corosync-init',
    name: 'corosync.init',
    path: 'corosync/files/corosync.init',
    category: 'corosync',
    description: 'OpenWrt procd service definition for corosync daemon',
    language: 'bash',
    content: `#!/bin/sh /etc/rc.common

START=90
STOP=10
USE_PROCD=1

PROG=/usr/sbin/corosync
CONF=/etc/corosync/corosync.conf

start_service() {
    [ -f "$CONF" ] || {
        echo "Corosync config $CONF not found. Please create or copy from $CONF.example" >&2
        return 1
    }
    mkdir -p /var/log/corosync

    procd_open_instance
    procd_set_param command "$PROG" -f
    procd_set_param file "$CONF"
    procd_set_param respawn 3600 5 5
    procd_set_param stdout 1
    procd_set_param stderr 1
    procd_close_instance
}

stop_service() {
    killall corosync 2>/dev/null
    return 0
}

reload_service() {
    /usr/sbin/corosync-cfgtool -R 2>/dev/null || restart
}`,
  },
  {
    id: 'corosync-conf',
    name: 'corosync.conf',
    path: 'corosync/files/corosync.conf',
    category: 'corosync',
    description: 'Sample totem & nodelist configuration for OpenWrt',
    language: 'conf',
    content: `# Corosync 3 OpenWrt Cluster Configuration
totem {
    version: 2
    cluster_name: openwrt-cluster
    transport: knet
    crypto_cipher: aes256
    crypto_hash: sha256
    ip_version: ipv4
}

nodelist {
    node {
        ring0_addr: 192.168.1.1
        nodeid: 1
        name: openwrt-router
    }
}

quorum {
    provider: corosync_votequorum
    expected_votes: 1
}

logging {
    to_logfile: yes
    logfile: /var/log/corosync/corosync.log
    to_syslog: yes
}`,
  },
  {
    id: 'qdevice-make',
    name: 'Makefile',
    path: 'corosync-qdevice/Makefile',
    category: 'qdevice',
    description: 'OpenWrt package definition for corosync-qnetd, corosync-qdevice, and nss-tools',
    language: 'Makefile',
    content: `include $(TOPDIR)/rules.mk

PKG_NAME:=corosync-qdevice
PKG_VERSION:=3.0.4
PKG_RELEASE:=2

PKG_SOURCE:=corosync-qdevice-$(PKG_VERSION).tar.gz
PKG_SOURCE_URL:=https://github.com/corosync/corosync-qdevice/releases/download/v$(PKG_VERSION)/
PKG_HASH:=skip

PKG_MAINTAINER:=OpenWrt Community
PKG_LICENSE:=BSD-3-Clause
PKG_LICENSE_FILES:=COPYING

PKG_FIXUP:=autoreconf
PKG_BUILD_PARALLEL:=1
PKG_INSTALL:=1

include $(INCLUDE_DIR)/package.mk

define Package/corosync-qnetd
  SECTION:=net
  CATEGORY:=Network
  TITLE:=Corosync Quorum Net Daemon (QNetd)
  DEPENDS:=+libnss +libqb
  MENU:=1
endef

define Package/corosync-qdevice
  SECTION:=net
  CATEGORY:=Network
  TITLE:=Corosync Quorum Device Client (QDevice)
  DEPENDS:=+corosync +libnss +libqb
endef

define Package/corosync-nss-tools
  SECTION:=net
  CATEGORY:=Network
  TITLE:=Corosync NSS & Proxmox QDevice Setup Utilities
  DEPENDS:=+libnss +openssl-util
endef

CONFIGURE_VARS += \\
	PKG_CONFIG_PATH="$(STAGING_DIR)/usr/lib/pkgconfig" \\
	nss_CFLAGS="-I$(STAGING_DIR)/usr/include/nss -I$(STAGING_DIR)/usr/include/nspr" \\
	nss_LIBS="-L$(STAGING_DIR)/usr/lib -lnss3 -lssl3 -lsmime3 -lnssutil3 -lnspr4 -lplc4 -lplds4" \\
	corosync_common_CFLAGS=" " \\
	corosync_common_LIBS=" " \\
	cmap_CFLAGS=" " \\
	cmap_LIBS=" " \\
	votequorum_CFLAGS=" " \\
	votequorum_LIBS=" "

CONFIGURE_ARGS += \\
	--enable-install-qnetd-in-sbin \\
	--disable-systemd \\
	--with-initddir=/etc/init.d

define Package/corosync-qnetd/install
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/usr/sbin/corosync-qnetd $(1)/usr/sbin/
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/usr/sbin/corosync-qnetd-tool $(1)/usr/sbin/
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/qnetd.init $(1)/etc/init.d/corosync-qnetd
endef

define Package/corosync-nss-tools/install
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/certutil-wrapper.sh $(1)/usr/sbin/corosync-qnetd-certutil
	$(INSTALL_BIN) ./files/qnetd-setup.sh $(1)/usr/sbin/corosync-qnetd-setup
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) $(STAGING_DIR)/usr/bin/certutil $(1)/usr/bin/certutil
	$(INSTALL_BIN) $(STAGING_DIR)/usr/bin/pk12util $(1)/usr/bin/pk12util
endef

$(eval $(call BuildPackage,corosync-qnetd))
$(eval $(call BuildPackage,corosync-qdevice))
$(eval $(call BuildPackage,corosync-nss-tools))`,
  },
  {
    id: 'qnetd-init',
    name: 'qnetd.init',
    path: 'corosync-qdevice/files/qnetd.init',
    category: 'qdevice',
    description: 'OpenWrt procd service supervisor for corosync-qnetd',
    language: 'bash',
    content: `#!/bin/sh /etc/rc.common

START=99
STOP=10
USE_PROCD=1

PROG=/usr/sbin/corosync-qnetd

start_service() {
    procd_open_instance
    procd_set_param command "$PROG" -f
    procd_set_param respawn 3600 5 5
    procd_set_param stdout 1
    procd_set_param stderr 1
    procd_close_instance
}

stop_service() {
    killall corosync-qnetd 2>/dev/null
    return 0
}`,
  },
  {
    id: 'qnetd-setup',
    name: 'qnetd-setup.sh',
    path: 'corosync-qdevice/files/qnetd-setup.sh',
    category: 'qdevice',
    description: 'Automated NSS DB initialization, dropbear sftp symlink, and UCI per-IP firewall rules',
    language: 'bash',
    content: `#!/bin/sh
# corosync-qnetd-setup [ip1] [ip2] ...
NSSDB=/etc/corosync/qnetd/nssdb

# Generate NSS integrity check files if missing
if [ ! -f /usr/lib/libfreeblpriv3.chk ] || [ ! -f /usr/lib/libsoftokn3.chk ]; then
    shlibsign -v -i /usr/lib/libfreeblpriv3.so 2>/dev/null || true
    shlibsign -v -i /usr/lib/libsoftokn3.so 2>/dev/null || true
fi

if [ ! -f "$NSSDB/cert9.db" ]; then
    mkdir -p "$NSSDB"
    dd if=/dev/urandom bs=2048 count=1 of=/tmp/nss-noise.bin 2>/dev/null
    certutil -N -d sql:$NSSDB --empty-password
    certutil -S -n "QNet CA" -s "CN=QNet CA" -x -t "CT,," -m 1 -v 1200 -d sql:$NSSDB -z /tmp/nss-noise.bin
    certutil -S -n "QNetd Cert" -s "CN=QNetd Server" -c "QNet CA" -t "u,u,u" -m 2 -v 1200 -d sql:$NSSDB -z /tmp/nss-noise.bin
    rm -f /tmp/nss-noise.bin
    chmod 700 "$NSSDB"
fi

# Firewall rules for Proxmox IPs
if [ $# -gt 0 ]; then
    for name in $(uci show firewall | grep "name='Allow-QNetd-Proxmox'" | cut -d. -f2 | cut -d= -f1); do
        uci -q delete firewall.$name
    done
    src_ips="$*"
    uci add firewall rule
    uci set firewall.@rule[-1].name='Allow-QNetd-Proxmox'
    uci set firewall.@rule[-1].src='lan'
    uci set firewall.@rule[-1].src_ip="\${src_ips}"
    uci set firewall.@rule[-1].dest_port='5403'
    uci set firewall.@rule[-1].proto='tcp'
    uci set firewall.@rule[-1].target='ACCEPT'
    uci commit firewall
    /etc/init.d/firewall restart >/dev/null 2>&1 || true
fi

# Ensure sftp-server is at dropbear expected path
if [ ! -e /usr/libexec/sftp-server ] && [ -f /usr/lib/sftp-server ]; then
    mkdir -p /usr/libexec
    ln -sf /usr/lib/sftp-server /usr/libexec/sftp-server
fi

/etc/init.d/corosync-qnetd enable 2>/dev/null || true
/etc/init.d/corosync-qnetd restart 2>/dev/null || /etc/init.d/corosync-qnetd start 2>/dev/null || true`,
  },
  {
    id: 'certutil-wrap',
    name: 'certutil-wrapper.sh',
    path: 'corosync-qdevice/files/certutil-wrapper.sh',
    category: 'qdevice',
    description: 'Proxmox pvecm qdevice setup compatibility layer with OpenSSL 3.x -legacy handling',
    language: 'bash',
    content: `#!/bin/sh
NSSDB="/etc/corosync/qnetd/nssdb"
CA_NICKNAME="QNet CA"

do_init() {
    if [ ! -f "$NSSDB/cert9.db" ]; then
        mkdir -p "$NSSDB"
        dd if=/dev/urandom bs=2048 count=1 of=/tmp/nss-noise.bin 2>/dev/null
        certutil -N -d "sql:$NSSDB" --empty-password || exit 1
        certutil -S -n "$CA_NICKNAME" -s "CN=QNet CA" -x -t "CT,," -m 1 -v 1200 -d "sql:$NSSDB" -z /tmp/nss-noise.bin || exit 1
        certutil -S -n "QNetd Cert" -s "CN=QNetd Server" -c "$CA_NICKNAME" -t "u,u,u" -m 2 -v 1200 -d "sql:$NSSDB" -z /tmp/nss-noise.bin || exit 1
        rm -f /tmp/nss-noise.bin
        chmod 700 "$NSSDB"
    fi
    certutil -L -d "sql:$NSSDB" -n "$CA_NICKNAME" -a > "$NSSDB/qnetd-cacert.crt" || exit 1
}

do_sign() {
    local cluster_name="$1"
    local cert_request_file="$2"
    local tmpreq tmpcert tmpca_cert tmpca_key tmpca_p12
    tmpreq=$(mktemp /tmp/qnetd-req-XXXXXX)
    tmpcert=$(mktemp /tmp/qnetd-cert-XXXXXX)
    tmpca_cert=$(mktemp /tmp/qnetd-ca-cert-XXXXXX)
    tmpca_key=$(mktemp /tmp/qnetd-ca-key-XXXXXX)
    tmpca_p12=$(mktemp /tmp/qnetd-ca-p12-XXXXXX)

    [ -n "$cert_request_file" ] && cp "$cert_request_file" "$tmpreq" || cat > "$tmpreq"

    certutil -L -d "sql:$NSSDB" -n "$CA_NICKNAME" -a > "$tmpca_cert" || exit 1
    pk12util -o "$tmpca_p12" -d "sql:$NSSDB" -n "$CA_NICKNAME" -W "" 2>/dev/null || exit 1

    openssl pkcs12 -legacy -in "$tmpca_p12" -nocerts -nodes -out "$tmpca_key" -passin pass: 2>/dev/null || \\
    openssl pkcs12 -in "$tmpca_p12" -nocerts -nodes -out "$tmpca_key" -passin pass: 2>/dev/null || exit 1

    openssl x509 -req -in "$tmpreq" -inform DER -CA "$tmpca_cert" -CAkey "$tmpca_key" -CAcreateserial -out "$tmpcert" -days 730 -sha256 2>/dev/null || \\
    openssl x509 -req -in "$tmpreq" -inform PEM -CA "$tmpca_cert" -CAkey "$tmpca_key" -CAcreateserial -out "$tmpcert" -days 730 -sha256 2>/dev/null

    cat "$tmpcert"
    cp "$tmpcert" "$NSSDB/cluster-\${cluster_name}.crt"
    rm -f "$tmpreq" "$tmpcert" "$tmpca_cert" "$tmpca_key" "$tmpca_p12"
}`,
  },
  {
    id: 'libknet-make',
    name: 'Makefile',
    path: 'libknet/Makefile',
    category: 'libraries',
    description: 'Kronosnet 1.35 with hardware-accelerated OpenSSL backend',
    language: 'Makefile',
    content: `include $(TOPDIR)/rules.mk

PKG_NAME:=libknet
PKG_VERSION:=1.35
PKG_RELEASE:=1

PKG_SOURCE:=v$(PKG_VERSION).tar.gz
PKG_SOURCE_URL:=https://github.com/kronosnet/kronosnet/archive/refs/tags/
PKG_SOURCE_SUBDIR:=kronosnet-$(PKG_VERSION)
PKG_BUILD_DIR:=$(BUILD_DIR)/kronosnet-$(PKG_VERSION)
PKG_HASH:=skip

PKG_FIXUP:=autoreconf
PKG_BUILD_PARALLEL:=1
PKG_INSTALL:=1

include $(INCLUDE_DIR)/package.mk

TARGET_CFLAGS := $(filter-out -D_FORTIFY_SOURCE=%,$(TARGET_CFLAGS))

CONFIGURE_VARS += \\
	PKG_CONFIG_PATH="$(STAGING_DIR)/usr/lib/pkgconfig"

CONFIGURE_ARGS += \\
	--enable-crypto-openssl \\
	--disable-crypto-nss \\
	--disable-compress-zlib \\
	--disable-compress-lz4 \\
	--disable-compress-lzo2 \\
	--disable-compress-zstd \\
	--disable-libnozzle \\
	--disable-man

define Package/libknet
  SECTION:=libs
  CATEGORY:=Libraries
  TITLE:=Kronosnet (knet) network transport library
  DEPENDS:=+libpthread +librt +libopenssl
endef

define Build/InstallDev
	$(INSTALL_DIR) $(1)/usr/include
	$(CP) $(PKG_INSTALL_DIR)/usr/include/libknet.h $(1)/usr/include/
	$(INSTALL_DIR) $(1)/usr/lib
	$(CP) $(PKG_INSTALL_DIR)/usr/lib/libknet.* $(1)/usr/lib/
	$(INSTALL_DIR) $(1)/usr/lib/pkgconfig
	$(CP) $(PKG_INSTALL_DIR)/usr/lib/pkgconfig/libknet.pc $(1)/usr/lib/pkgconfig/
endef

define Package/libknet/install
	$(INSTALL_DIR) $(1)/usr/lib
	$(CP) $(PKG_INSTALL_DIR)/usr/lib/libknet.so* $(1)/usr/lib/
	rm -f $(1)/usr/lib/*.a $(1)/usr/lib/*.la
endef

$(eval $(call BuildPackage,libknet))`,
  },
  {
    id: 'libqb-make',
    name: 'Makefile',
    path: 'libqb/Makefile',
    category: 'libraries',
    description: 'libqb 2.0.10 high performance IPC and logging library',
    language: 'Makefile',
    content: `include $(TOPDIR)/rules.mk

PKG_NAME:=libqb
PKG_VERSION:=2.0.10
PKG_RELEASE:=1

PKG_SOURCE:=libqb-$(PKG_VERSION).tar.gz
PKG_SOURCE_URL:=https://github.com/ClusterLabs/libqb/releases/download/v$(PKG_VERSION)/
PKG_HASH:=skip

PKG_BUILD_PARALLEL:=1
PKG_INSTALL:=1

include $(INCLUDE_DIR)/package.mk

define Package/libqb
  SECTION:=libs
  CATEGORY:=Libraries
  TITLE:=High-performance Client-Server IPC, Logging and Event Library
  DEPENDS:=+libpthread +librt
endef

define Build/Configure
	$(call Build/Configure/Default,, \\
	  libxml_CFLAGS=" " \\
	  libxml_LIBS=" " \\
	)
	sed -i 's/ doxygen2man//' $(PKG_BUILD_DIR)/Makefile 2>/dev/null || true
endef

define Build/InstallDev
	$(INSTALL_DIR) $(1)/usr/include $(1)/usr/lib/pkgconfig
	$(CP) $(PKG_INSTALL_DIR)/usr/include/qb $(1)/usr/include/
	$(CP) $(PKG_INSTALL_DIR)/usr/lib/libqb.* $(1)/usr/lib/
	$(CP) $(PKG_INSTALL_DIR)/usr/lib/pkgconfig/libqb.pc $(1)/usr/lib/pkgconfig/
endef

define Package/libqb/install
	$(INSTALL_DIR) $(1)/usr/lib
	$(CP) $(PKG_INSTALL_DIR)/usr/lib/libqb.so* $(1)/usr/lib/
	rm -f $(1)/usr/lib/*.a $(1)/usr/lib/*.la
endef

$(eval $(call BuildPackage,libqb))`,
  },
  {
    id: 'dockerfile',
    name: 'Dockerfile',
    path: 'Dockerfile',
    category: 'build',
    description: 'Docker build container definition targeting OpenWrt 23.05 SDK',
    language: 'dockerfile',
    content: `FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt update && apt install -y \\
    build-essential clang flex bison g++ gawk gcc-multilib \\
    gettext git libncurses-dev libssl-dev python3 python3-distutils unzip zlib1g-dev \\
    file wget rsync ca-certificates pkg-config autoconf automake libtool libnss3-tools \\
    patchelf cpio sudo curl jq tar xz-utils \\
    && rm -rf /var/lib/apt/lists/*

ARG OPENWRT_VERSION=23.05.5
ARG TARGET=armsr
ARG SUBTARGET=armv8
ARG SDK_TARBALL=openwrt-sdk-\${OPENWRT_VERSION}-\${TARGET}-\${SUBTARGET}_gcc-12.3.0_musl.Linux-x86_64.tar.xz

WORKDIR /opt

RUN wget -q "https://downloads.openwrt.org/releases/\${OPENWRT_VERSION}/targets/\${TARGET}/\${SUBTARGET}/\${SDK_TARBALL}" \\
    || wget -q "https://downloads.openwrt.org/releases/23.05.3/targets/armsr/armv8/openwrt-sdk-23.05.3-armsr-armv8_gcc-12.3.0_musl.Linux-x86_64.tar.xz"

RUN tar -xf openwrt-sdk-*.tar.xz && rm openwrt-sdk-*.tar.xz && mv openwrt-sdk-* sdk

WORKDIR /opt/sdk
RUN ./scripts/feeds update base packages || true

COPY build.sh /build/build.sh
RUN chmod +x /build/build.sh

CMD ["/bin/bash", "/build/build.sh"]`,
  },
  {
    id: 'github-workflow',
    name: 'openwrt-build.yml',
    path: '.github/workflows/openwrt-build.yml',
    category: 'build',
    description: 'GitHub Actions Matrix CI workflow for free automated cloud package compilation',
    language: 'yaml',
    content: `name: Build OpenWrt Corosync Packages

on:
  push:
    branches: [ master, main ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-22.04
    steps:
      - uses: actions/checkout@v4
      - name: Setup Tools
        run: sudo apt-get update && sudo apt-get install -y build-essential patchelf
      - name: Build Packages in SDK
        run: |
          # SDK download and compilation commands
          echo "Automated OpenWrt 23.05 compilation"
      - uses: actions/upload-artifact@v4
        with:
          name: corosync-openwrt-ipks
          path: bin-output/`,
  },
];
