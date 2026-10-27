include $(TOPDIR)/rules.mk

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

define Package/corosync/description
  Corosync 3 is an open-source cluster engine providing high availability,
  group messaging, quorum calculation, and cluster membership tracking.
  Corosync 3 natively uses Kronosnet (knet) as its network transport layer.
endef

define Package/corosync-tools
$(call Package/corosync/Default)
  TITLE:=Corosync Management & Diagnostic Tools
  DEPENDS:=+corosync
endef

define Package/corosync-tools/description
  Command-line diagnostic and management utilities for Corosync:
  corosync-cfgtool, corosync-cmapctl, corosync-cpgtool,
  corosync-quorumtool, and corosync-keygen.
endef

define Package/libcorosync
$(call Package/corosync/Default)
  SECTION:=libs
  CATEGORY:=Libraries
  TITLE:=Corosync Shared Libraries
  DEPENDS:=+libqb +libknet +libpthread +librt
endef

CONFIGURE_ARGS += \
	--disable-systemd \
	--with-initddir=/etc/init.d \
	--with-logdir=/var/log/corosync \
	--enable-monitoring=no \
	--enable-snmp=no \
	--enable-dbus=no \
	--enable-xmlconf=no \
	--disable-doc \
	--disable-man

CONFIGURE_VARS += \
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
$(eval $(call BuildPackage,libcorosync))
