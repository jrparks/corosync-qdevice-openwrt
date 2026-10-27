include $(TOPDIR)/rules.mk

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

define Package/libqb/description
  libqb provides high-performance, reusable client-server architecture
  components including IPC (Unix Domain Sockets / Shared Memory), poll loops,
  ring buffers, and atomic logging.
endef

define Build/Configure
	$(call Build/Configure/Default,, \
	  libxml_CFLAGS=" " \
	  libxml_LIBS=" " \
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

$(eval $(call BuildPackage,libqb))
