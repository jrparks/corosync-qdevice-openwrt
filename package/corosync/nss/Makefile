include $(TOPDIR)/rules.mk

PKG_NAME:=nss
PKG_VERSION:=3.98
PKG_RELEASE:=9

PKG_SOURCE:=nss-$(PKG_VERSION).tar.gz
PKG_SOURCE_URL:=https://archive.mozilla.org/pub/security/nss/releases/NSS_3_98_RTM/src/
PKG_HASH:=skip

PKG_BUILD_DEPENDS:=nspr

include $(INCLUDE_DIR)/package.mk

define Package/libnss
  SECTION:=libs
  CATEGORY:=Libraries
  TITLE:=Mozilla Network Security Services (NSS)
  DEPENDS:=+libnspr
endef

define Package/libnss/description
  Mozilla Network Security Services (NSS) is a set of libraries designed to support
  cross-platform development of security-enabled client and server applications.
endef

ifeq ($(ARCH),aarch64)
  NSS_CPU_ARCH:=aarch64
  NSS_USE_64:=1
endif
ifeq ($(ARCH),x86_64)
  NSS_CPU_ARCH:=x86_64
  NSS_USE_64:=1
endif
ifeq ($(NSS_CPU_ARCH),)
  NSS_CPU_ARCH:=$(ARCH)
  NSS_USE_64:=1
endif

define Build/Configure
endef

define Build/Compile
	# Host tool
	$(MAKE) $(PKG_JOBS) -C $(PKG_BUILD_DIR)/nss/coreconf/nsinstall \
		CC="$(HOSTCC)" \
		OBJDIR_NAME=host \
		BUILD_OPT=1 \
		USE_64=1

	# Target build — bundled sqlite3.c and internal zlib are used to keep standalone footprint
	$(MAKE) $(PKG_JOBS) -C $(PKG_BUILD_DIR)/nss \
		BUILD_OPT=1 \
		USE_64=$(NSS_USE_64) \
		CROSS_COMPILE=1 \
		OS_TARGET=Linux \
		OS_ARCH=Linux \
		CPU_ARCH=$(NSS_CPU_ARCH) \
		OBJDIR_NAME=target.OBJ \
		FREEBL_LOWHASH=1 \
		NSINSTALL="$(PKG_BUILD_DIR)/nss/coreconf/nsinstall/host/nsinstall" \
		CC="$(TARGET_CC)" \
		CCC="$(TARGET_CXX)" \
		RANLIB="$(TARGET_CROSS)ranlib" \
		RC= \
		NSS_DISABLE_DBM=1 \
		NSS_DISABLE_LIBPKIX=1 \
		USE_SYSTEM_NSPR=1 \
		NSPR_INCLUDE_DIR="$(STAGING_DIR)/usr/include/nspr" \
		NSPR_LIB_DIR="$(STAGING_DIR)/usr/lib" \
		OS_REL_CFLAGS="" \
		ARCHFLAG="" \
		NSS_ENABLE_TESTS=0 \
		XCFLAGS="$(filter-out -Wl%,$(TARGET_CFLAGS)) $(TARGET_CPPFLAGS) \
			-I$(STAGING_DIR)/usr/include \
			-I$(STAGING_DIR)/usr/include/nspr \
			-D_GNU_SOURCE \
			-fno-lto -Wno-error" \
		DANGEROUS_CRT_PATH_OK=1

	# musl dynamic linker patch for softokn3 -> freebl3
	find $(PKG_BUILD_DIR)/dist -name libsoftokn3.so -exec \
		patchelf --add-needed libfreebl3.so {} 2>/dev/null \; || true
endef

define Build/InstallDev
	$(INSTALL_DIR) $(1)/usr/include/nss
	cp -fpRL $(PKG_BUILD_DIR)/dist/public/nss/. $(1)/usr/include/nss/
	$(INSTALL_DIR) $(1)/usr/lib
	cp -fpL $(PKG_BUILD_DIR)/dist/*/lib/libnss3.so $(1)/usr/lib/
	cp -fpL $(PKG_BUILD_DIR)/dist/*/lib/libssl3.so $(1)/usr/lib/
	cp -fpL $(PKG_BUILD_DIR)/dist/*/lib/libsmime3.so $(1)/usr/lib/
	cp -fpL $(PKG_BUILD_DIR)/dist/*/lib/libsoftokn3.so $(1)/usr/lib/
	cp -fpL $(PKG_BUILD_DIR)/dist/*/lib/libnssutil3.so $(1)/usr/lib/
	$(INSTALL_DIR) $(1)/usr/lib/pkgconfig
	$(INSTALL_DATA) ./files/nss.pc $(1)/usr/lib/pkgconfig/nss.pc
	$(INSTALL_DIR) $(1)/usr/bin
	cp -fpL $(PKG_BUILD_DIR)/dist/*/bin/certutil $(1)/usr/bin/
	cp -fpL $(PKG_BUILD_DIR)/dist/*/bin/pk12util $(1)/usr/bin/
	$(INSTALL_DIR) $(1)/usr/sbin
	cp -fpL $(PKG_BUILD_DIR)/dist/*/bin/shlibsign $(1)/usr/sbin/
endef

define Package/libnss/install
	$(INSTALL_DIR) $(1)/usr/lib
	cp -fpL $(PKG_BUILD_DIR)/dist/*/lib/libnss3.so $(1)/usr/lib/
	cp -fpL $(PKG_BUILD_DIR)/dist/*/lib/libssl3.so $(1)/usr/lib/
	cp -fpL $(PKG_BUILD_DIR)/dist/*/lib/libsmime3.so $(1)/usr/lib/
	cp -fpL $(PKG_BUILD_DIR)/dist/*/lib/libnssutil3.so $(1)/usr/lib/
	cp -fpL $(PKG_BUILD_DIR)/dist/*/lib/libsoftokn3.so $(1)/usr/lib/
	cp -fpL $(PKG_BUILD_DIR)/dist/*/lib/libsqlite3.so $(1)/usr/lib/
	cp -fpL $(PKG_BUILD_DIR)/dist/*/lib/libfreebl3.so $(1)/usr/lib/
	cp -fpL $(PKG_BUILD_DIR)/dist/*/lib/libfreeblpriv3.so $(1)/usr/lib/
	$(INSTALL_DIR) $(1)/usr/sbin
	cp -fpL $(PKG_BUILD_DIR)/dist/*/bin/shlibsign $(1)/usr/sbin/
endef

define Package/libnss/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] && exit 0
shlibsign -v -i /usr/lib/libfreeblpriv3.so 2>/dev/null || true
shlibsign -v -i /usr/lib/libsoftokn3.so 2>/dev/null || true
exit 0
endef

$(eval $(call BuildPackage,libnss))
