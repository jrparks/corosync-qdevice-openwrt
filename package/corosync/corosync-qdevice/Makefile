include $(TOPDIR)/rules.mk

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

define Package/corosync-qdevice/Default
  SECTION:=net
  CATEGORY:=Network
  TITLE:=Corosync QDevice & QNetd Quorum Suite
  URL:=https://github.com/corosync/corosync-qdevice
endef

define Package/corosync-qnetd
$(call Package/corosync-qdevice/Default)
  TITLE:=Corosync Quorum Net Daemon (QNetd)
  DEPENDS:=+libnss +libqb
  MENU:=1
endef

define Package/corosync-qnetd/description
  Network arbitrator daemon running on a standalone host or OpenWrt router
  to provide external tie-breaker votes for 2-node Proxmox VE or Corosync clusters.
endef

define Package/corosync-qdevice
$(call Package/corosync-qdevice/Default)
  TITLE:=Corosync Quorum Device Client (QDevice)
  DEPENDS:=+corosync +libnss +libqb
endef

define Package/corosync-qdevice/description
  Client daemon running on cluster nodes that connects to corosync-qnetd.
endef

define Package/corosync-nss-tools
$(call Package/corosync-qdevice/Default)
  TITLE:=Corosync NSS & Proxmox QDevice Setup Utilities
  DEPENDS:=+libnss +openssl-util
endef

define Package/corosync-nss-tools/description
  Provides corosync-qnetd-certutil wrapper and corosync-qnetd-setup script
  required by Proxmox VE during `pvecm qdevice setup <router-ip>`.
endef

CONFIGURE_VARS += \
	PKG_CONFIG_PATH="$(STAGING_DIR)/usr/lib/pkgconfig" \
	nss_CFLAGS="-I$(STAGING_DIR)/usr/include/nss -I$(STAGING_DIR)/usr/include/nspr" \
	nss_LIBS="-L$(STAGING_DIR)/usr/lib -lnss3 -lssl3 -lsmime3 -lnssutil3 -lnspr4 -lplc4 -lplds4" \
	corosync_common_CFLAGS=" " \
	corosync_common_LIBS=" " \
	cmap_CFLAGS=" " \
	cmap_LIBS=" " \
	votequorum_CFLAGS=" " \
	votequorum_LIBS=" "

CONFIGURE_ARGS += \
	--enable-install-qnetd-in-sbin \
	--disable-systemd \
	--with-initddir=/etc/init.d

define Package/corosync-qnetd/install
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/usr/sbin/corosync-qnetd $(1)/usr/sbin/
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/usr/sbin/corosync-qnetd-tool $(1)/usr/sbin/
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/qnetd.init $(1)/etc/init.d/corosync-qnetd
endef

define Package/corosync-qdevice/install
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/usr/sbin/corosync-qdevice $(1)/usr/sbin/
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/usr/sbin/corosync-qdevice-tool $(1)/usr/sbin/
endef

define Package/corosync-nss-tools/install
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/certutil-wrapper.sh $(1)/usr/sbin/corosync-qnetd-certutil
	$(INSTALL_BIN) ./files/qnetd-setup.sh $(1)/usr/sbin/corosync-qnetd-setup
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) $(STAGING_DIR)/usr/bin/certutil $(1)/usr/bin/certutil
	$(INSTALL_BIN) $(STAGING_DIR)/usr/bin/pk12util $(1)/usr/bin/pk12util
endef

define Package/corosync-nss-tools/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] && exit 0
/usr/sbin/corosync-qnetd-setup
exit 0
endef

define Package/corosync-nss-tools/prerm
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] && exit 0
for name in $$(uci show firewall | grep "name='Allow-QNetd-Proxmox'" | cut -d. -f2 | cut -d= -f1); do
    uci -q delete firewall.$$name
done
uci commit firewall
/etc/init.d/firewall restart 2>/dev/null || true
exit 0
endef

$(eval $(call BuildPackage,corosync-qnetd))
$(eval $(call BuildPackage,corosync-qdevice))
$(eval $(call BuildPackage,corosync-nss-tools))
