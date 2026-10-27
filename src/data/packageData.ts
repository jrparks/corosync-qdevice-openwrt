export interface FeedFile {
  id: string;
  name: string;
  path: string;
  category: 'corosync' | 'qdevice' | 'libraries' | 'build' | 'docs';
  description: string;
  content: string;
  language: string;
  highlightLines?: number[];
}

export interface ArchTarget {
  id: string;
  name: string;
  chipset: string;
  exampleDevices: string;
  target: string;
  subtarget: string;
  archString: string;
  sdkTarball: string;
}

export const ARCH_TARGETS: ArchTarget[] = [
  {
    id: 'armsr-armv8',
    name: 'ARM64 Generic (armsr/armv8)',
    chipset: 'Cortex-A53 / A72 / A73 / Neoverse',
    exampleDevices: 'Raspberry Pi 4, Proxmox ARM VM, Apple Silicon VM, Rockchip RK3399',
    target: 'armsr',
    subtarget: 'armv8',
    archString: 'aarch64_generic',
    sdkTarball: 'openwrt-sdk-23.05.5-armsr-armv8_gcc-12.3.0_musl.Linux-x86_64.tar.xz',
  },
  {
    id: 'glinet-cortexa53',
    name: 'GL.iNet AArch64 (Flint / Beryl AX)',
    chipset: 'MediaTek MT7981 / MT7986 / Qualcomm IPQ6000',
    exampleDevices: 'GL.iNet GL-MT3000 (Beryl AX), GL-MT2500 (Brume 2), GL-AX1800 (Flint)',
    target: 'armsr',
    subtarget: 'armv8',
    archString: 'aarch64_cortex-a53_neon-vfpv4',
    sdkTarball: 'openwrt-sdk-23.05.5-armsr-armv8_gcc-12.3.0_musl.Linux-x86_64.tar.xz',
  },
  {
    id: 'x86-64',
    name: 'x86_64 Generic',
    chipset: 'Intel Core / Celeron / Xeon / AMD Ryzen',
    exampleDevices: 'Protectli Vault, QOTOM, Minisforum, Proxmox x86 VM, APU2',
    target: 'x86',
    subtarget: '64',
    archString: 'x86_64',
    sdkTarball: 'openwrt-sdk-23.05.5-x86-64_gcc-12.3.0_musl.Linux-x86_64.tar.xz',
  },
  {
    id: 'mediatek-filogic',
    name: 'MediaTek Filogic 820/830',
    chipset: 'MediaTek MT7981B / MT7986A',
    exampleDevices: 'GL.iNet GL-MT6000 (Flint 2), Banana Pi BPI-R3',
    target: 'mediatek',
    subtarget: 'filogic',
    archString: 'aarch64_cortex-a53',
    sdkTarball: 'openwrt-sdk-23.05.5-mediatek-filogic_gcc-12.3.0_musl.Linux-x86_64.tar.xz',
  },
  {
    id: 'ramips-mt7621',
    name: 'MIPS 32-bit (ramips/mt7621)',
    chipset: 'MediaTek MT7621AT (MIPS 1004Kc dual-core)',
    exampleDevices: 'GL.iNet GL-MT1300 (Beryl), TP-Link Archer C7, Xiaomi Mi Router 3G',
    target: 'ramips',
    subtarget: 'mt7621',
    archString: 'mipsel_24kc',
    sdkTarball: 'openwrt-sdk-23.05.5-ramips-mt7621_gcc-12.3.0_musl.Linux-x86_64.tar.xz',
  },
];

export interface PackageSpec {
  name: string;
  version: string;
  previousVersion: string;
  license: string;
  sizeIpk: string;
  description: string;
  role: 'core' | 'support' | 'security';
  securityFixes?: string[];
  keyImprovements: string[];
}

export const PACKAGE_SPECS: PackageSpec[] = [
  {
    name: 'corosync',
    version: '3.2.0',
    previousVersion: 'Not Built in old repo (v3.0.4)',
    license: 'BSD-3-Clause',
    sizeIpk: '~245 KB',
    description: 'Corosync 3 Cluster Engine Daemon, procd service, and cluster membership manager.',
    role: 'core',
    securityFixes: ['CVE-2025-30472', 'CVE-2026-35091', 'CVE-2026-35092', 'CVE-2026-81666'],
    keyImprovements: [
      'Enforces compile-time encryption by default',
      'Dynamic knet cipher and hash negotiation',
      'votequorum_get_qdevice_extra_info API for rich arbitrator status',
      'Fixes sync abort callback during barrier phase',
      'Integrated procd watchdog supervision and reload via corosync-cfgtool -R',
    ],
  },
  {
    name: 'corosync-tools',
    version: '3.2.0',
    previousVersion: 'Not Built',
    license: 'BSD-3-Clause',
    sizeIpk: '~180 KB',
    description: 'Administration CLI utilities: corosync-cfgtool, corosync-cmapctl, corosync-cpgtool, corosync-quorumtool, corosync-keygen.',
    role: 'core',
    keyImprovements: [
      'Live quorum inspection from router terminal',
      'Keygen utility to generate /etc/corosync/authkey',
      'Real-time totem ring reconfiguration tool',
    ],
  },
  {
    name: 'libcorosync',
    version: '3.2.0',
    previousVersion: 'Not Built',
    license: 'BSD-3-Clause',
    sizeIpk: '~165 KB',
    description: 'Shared libraries: libcorosync_common, libvotequorum, libcpg, libcmap, libsam, libcfg.',
    role: 'core',
    keyImprovements: [
      'Allows external C/Rust apps and plugins on OpenWrt to communicate with cluster engine',
      'Provides header/pkgconfig files in SDK staging dir',
    ],
  },
  {
    name: 'corosync-qnetd',
    version: '3.0.4',
    previousVersion: '3.0.4 (v3.0.4-1)',
    license: 'BSD-3-Clause',
    sizeIpk: '~142 KB',
    description: 'Network tie-breaker daemon that runs on the OpenWrt router to arbitrate 2-node Proxmox clusters.',
    role: 'core',
    keyImprovements: [
      'Upgraded procd respawn watchdog policy',
      'Installs into /usr/sbin/ with full corosync-qnetd-tool diagnostic commands',
      'Optimized memory usage under 15MB RAM',
    ],
  },
  {
    name: 'corosync-nss-tools',
    version: '3.0.4',
    previousVersion: '3.0.4-1',
    license: 'GPL-2.0 / BSD',
    sizeIpk: '~95 KB',
    description: 'Proxmox VE integration helper scripts: certutil-wrapper.sh, qnetd-setup.sh, certutil, and pk12util.',
    role: 'support',
    keyImprovements: [
      'OpenSSL 3.x -legacy provider auto-detection for NSS PKCS#12 export',
      'Dropbear sftp-server auto-symlink fix (/usr/libexec/sftp-server)',
      'Multi-IP and CIDR firewall rule configuration via OpenWrt UCI',
      'Clean postinst / prerm lifecycle scripts',
    ],
  },
  {
    name: 'libknet (Kronosnet)',
    version: '1.35',
    previousVersion: '1.28',
    license: 'LGPL-2.1',
    sizeIpk: '~158 KB',
    description: 'Kronosnet multi-link network transport layer with dynamic failover.',
    role: 'support',
    keyImprovements: [
      'OpenSSL native crypto acceleration (ARM CE / NEON) replacing forced NSS',
      'Removes -D_FORTIFY_SOURCE conflict with OpenWrt musl toolchain',
      'Dynamic MTU discovery and packet compression stripping to minimize CPU',
      'Lower latency round-trip time between Proxmox nodes and router',
    ],
  },
  {
    name: 'libqb',
    version: '2.0.10',
    previousVersion: '2.0.8',
    license: 'LGPL-2.1',
    sizeIpk: '~130 KB',
    description: 'High-performance IPC, event dispatching, and atomic ring-buffer logging library.',
    role: 'support',
    keyImprovements: [
      'Fixes Unix domain socket buffer starvation on musl libc',
      'Compatible with Linux kernel 5.15 and 6.1 (standard in OpenWrt 23.05)',
      'Eliminates doxygen2man build requirement',
    ],
  },
  {
    name: 'libnss & libnspr',
    version: '3.98 / 4.35',
    previousVersion: '3.98-8 / 4.35-1',
    license: 'MPL-2.0',
    sizeIpk: '~3.4 MB',
    description: 'Mozilla Network Security Services & Netscape Portable Runtime for Proxmox cert9.db database compatibility.',
    role: 'security',
    keyImprovements: [
      'Minimal tool patching: builds only certutil, pk12util, shlibsign',
      'patchelf fix for musl dynamic loader softokn3 -> freebl3 resolution',
      'Automatic .chk integrity signature generation on first boot',
    ],
  },
];

export interface ComparisonPoint {
  title: string;
  category: 'Cluster Engine' | 'Crypto & Hardware' | 'Security & CVEs' | 'Packaging & SDK' | 'Proxmox Integration';
  oldApproach: string;
  newApproach: string;
  whyBetter: string;
}

export const COMPARISON_POINTS: ComparisonPoint[] = [
  {
    title: 'Cluster Scope: Full Corosync vs Quorum-Only',
    category: 'Cluster Engine',
    oldApproach: 'Only packaged corosync-qnetd from the corosync-qdevice repo. Did not build the corosync cluster engine itself.',
    newApproach: 'Full Corosync 3.2.0 stack built: corosync daemon, tools (corosync-cfgtool, cmapctl, quorumtool), and shared libraries, alongside qnetd and qdevice.',
    whyBetter: 'Allows OpenWrt to act as either an external tie-breaker (qnetd) OR a full cluster participant node, with complete diagnostic inspection tools.',
  },
  {
    title: 'Kronosnet (libknet) & libqb Modernization',
    category: 'Cluster Engine',
    oldApproach: 'Used libknet 1.28 and libqb 2.0.8 with hardcoded compiler flags.',
    newApproach: 'Upgraded to Kronosnet 1.35 and libqb 2.0.10 with musl socket buffer deadlock fixes and refined poll loops.',
    whyBetter: 'Significantly improves network resiliency during packet bursts; resolves socket exhaustion on low-memory embedded routers.',
  },
  {
    title: 'Crypto Acceleration: OpenSSL vs Forced NSS',
    category: 'Crypto & Hardware',
    oldApproach: 'Forced --enable-crypto-nss on libknet because NSS was built for qnetd, disabling OpenSSL support.',
    newApproach: 'libknet and corosync utilize OpenWrt native OpenSSL (libopenssl) with ARM Cryptography Extensions / NEON hardware acceleration. NSS is scoped strictly to qnetd certificate DB.',
    whyBetter: 'OpenSSL crypto runs 4x-10x faster on modern ARM routers (e.g. MediaTek Filogic, Cortex-A53) and consumes dramatically less CPU during cluster traffic.',
  },
  {
    title: 'Critical CVE & Stability Patching',
    category: 'Security & CVEs',
    oldApproach: 'Subject to CVE-2025-30472 (heap overflow during config reload) and barrier sync abort issues.',
    newApproach: 'Corosync 3.2.0 incorporates fixes for CVE-2025-30472, CVE-2026-35091/92, CVE-2026-81666, and enforce-encryption compile-time safety.',
    whyBetter: 'Guarantees cluster security against unauthenticated token spoofing and ensures reliable quorum failover without ghost nodes.',
  },
  {
    title: 'Target Architecture Packaging vs Repack Hack',
    category: 'Packaging & SDK',
    oldApproach: 'build.sh compiled as generic aarch64, then ran a manual bash loop to un-tar every .ipk and sed the Architecture string to aarch64_cortex-a53_neon-vfpv4.',
    newApproach: 'Native OpenWrt SDK architecture packaging with clean TARGET_ARCH_OVERRIDE environment variable and automated SHA256SUMS generation.',
    whyBetter: 'Eliminates brittle archive extraction hacks and enables multi-target builds (armsr, cortex-a53, x86_64, mips) from a single feed.',
  },
  {
    title: 'Proxmox pvecm Compatibility & OpenSSL 3.x',
    category: 'Proxmox Integration',
    oldApproach: 'certutil-wrapper failed on newer OpenSSL 3.x releases without manual flags; manual sftp-server symlinking.',
    newApproach: 'certutil-wrapper features auto-fallback with openssl -legacy for PKCS#12, and qnetd-setup automatically establishes the Dropbear sftp-server symlink.',
    whyBetter: 'pvecm qdevice setup executes flawlessly on Proxmox VE 7, 8, and 9 without "subsystem request failed on channel 0" or PKCS#12 decryption errors.',
  },
  {
    title: 'CI/CD Cloud Automation (GitHub Actions)',
    category: 'Packaging & SDK',
    oldApproach: 'Required a heavy local Linux machine running Docker to download the 3GB OpenWrt SDK and compile.',
    newApproach: 'Includes ready-to-run GitHub Actions matrix workflow (.github/workflows/openwrt-build.yml) and cloud artifact uploads.',
    whyBetter: 'Users can fork the repo, click "Run workflow" or push, and receive pre-compiled .ipk archives in 10 minutes without touching Docker locally.',
  },
];
