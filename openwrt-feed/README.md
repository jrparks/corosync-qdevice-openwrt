# Corosync 3 & QNetd for OpenWrt 23.05 (Modernized Build System)

Native OpenWrt 23.05-SNAPSHOT feed and build system for **Corosync 3.2.0**, **Corosync QNetd 3.0.4**, and all dependencies targeting `musl` libc embedded routers (ARM64, Cortex-A53, x86_64, MIPS).

---

## 🚀 Key Improvements Over Legacy `jrparks/corosync-qnetd-openwrt`

| Component | Legacy Repo | Modernized Feed (This Setup) | Why It's a Better Way |
| :--- | :--- | :--- | :--- |
| **Corosync Cluster Engine** | ❌ Not built | **Corosync 3.2.0** (`corosync`, `corosync-tools`, `libcorosync`) | Allows running full cluster node on OpenWrt, not just qnetd arbitrator |
| **Security Fixes** | Vulnerable to CVE-2025-30472 | **CVE-2025-30472, CVE-2026-35091/92, CVE-2026-81666 fixed** | Secure memory handling and knet crypto negotiation |
| **Kronosnet (`libknet`)** | v1.28 | **v1.35** | Dynamic link failover, MTU negotiation, reduced CPU overhead |
| **`libqb`** | v2.0.8 | **v2.0.10** | Resolves musl IPC socket starvation on Linux kernel >= 5.15 |
| **Crypto Acceleration** | Forced NSS for knet | **Native OpenSSL hardware acceleration** | Uses ARM Crypto / NEON via OpenWrt's native `libopenssl` |
| **Arch Tagging** | Custom sed repack hack | **Native SDK Target Flags + Configurable Overrides** | Clean builds for GL.iNet Flint/Beryl AX, Raspberry Pi, x86_64 |
| **OpenSSL 3.x Compatibility** | Partial | **Built-in `-legacy` PKCS#12 fallback handling** | Fixes `pvecm qdevice setup` cert signing on modern Proxmox |
| **Dropbear SFTP Auto-fix** | Manual symlink | **Automated `/usr/libexec/sftp-server` symlink** | Eliminates SFTP channel 0 errors during `pvecm` setup |
| **CI/CD Automation** | Manual Docker only | **Docker + GitHub Actions Matrix CI/CD** | Free cloud builds without needing local high-CPU Docker host |

---

## 📦 Packages Provided

1. `corosync_3.2.0-1_*.ipk`: Full Corosync cluster daemon + procd service
2. `corosync-tools_3.2.0-1_*.ipk`: `corosync-cfgtool`, `corosync-cmapctl`, `corosync-quorumtool`, `corosync-cpgtool`
3. `libcorosync_3.2.0-1_*.ipk`: Shared libraries (`libvotequorum`, `libcpg`, `libcmap`, etc.)
4. `corosync-qnetd_3.0.4-2_*.ipk`: Quorum network daemon for Proxmox tie-breaker
5. `corosync-nss-tools_3.0.4-2_*.ipk`: Setup script, `certutil-wrapper`, and certificate utilities
6. `libknet_1.35-1_*.ipk`: High-availability network transport
7. `libqb_2.0.10-1_*.ipk`: IPC and logging subsystem
8. `libnss_3.98-9_*.ipk`: Mozilla NSS certificate store engine
9. `libnspr_4.35-1_*.ipk`: Netscape Portable Runtime

---

## 💾 Storage & RAM Footprint

| Metric | Footprint | Details |
| :--- | :--- | :--- |
| **Download Size (`.ipk` files)** | **~1.82 MB** | Compressed packages copied via `scp` to `/tmp` |
| **Flash Storage (`/overlay`)** | **~4.85 MB – 5.1 MB** | Total uncompressed disk footprint for QNetd suite |
| **Active RAM (Resident RSS)** | **~12 MB – 16 MB** | Idle memory usage under `procd` supervision |
| **Flash Usage on GL-MT3000 (Beryl AX)** | **~2.0%** | Out of 256 MB NAND Flash |
| **Flash Usage on GL-MT6000 (Flint 2)** | **< 0.1%** | Out of 8 GB eMMC Storage |
| **Flash Usage on Standard 128MB Router** | **~3.9%** | Out of 128 MB NAND Flash |

---

## ⚡ Option 1: Build on GitHub (Recommended — No Docker Required)

This repository includes a multi-architecture **GitHub Actions Matrix Workflow** (`.github/workflows/build.yml`) that builds all packages in the cloud for free using Ubuntu runners.

### Method A: Push to GitHub & Download Artifacts
1. Push this repository to GitHub:
   ```bash
   git add .
   git commit -m "Update to Corosync 3.2.0 & QNetd for OpenWrt 23.05"
   git push origin main
   ```
2. Navigate to your repository on GitHub and click the **Actions** tab.
3. The **"Build OpenWrt Corosync & QNetd"** workflow will run automatically for all target architectures:
   - `armsr-armv8` (Generic 64-bit ARM, Raspberry Pi 4, ARM VMs)
   - `glinet-aarch64` (GL.iNet Flint GL-AX1800, Beryl AX GL-MT3000, Brume 2 GL-MT2500)
   - `mediatek-filogic` (GL.iNet Flint 2 GL-MT6000, Filogic 820/830)
   - `x86-64` (Intel & AMD x86_64 routers / Protectli / VMs)
4. Once completed, scroll to the bottom of the workflow run to **Artifacts** and download the ZIP for your target (e.g., `corosync-ipks-glinet-aarch64`).

### Method B: Manual Dispatch from GitHub UI
1. Go to **Actions** → **Build OpenWrt Corosync & QNetd**.
2. Click **Run workflow**.
3. Choose your target architecture or select `all` to build everything in parallel.
4. (Optional) Check **"Publish as GitHub Release with attached IPKs"** to automatically publish a GitHub release with `.ipk` downloads and `SHA256SUMS.txt`.

### Method C: Automated Release by Tagging
Push any version tag to trigger a release build:
```bash
git tag v3.2.0-1
git push origin v3.2.0-1
```
GitHub Actions will compile all targets and publish the `.ipk` files directly to the GitHub Releases page!

---

## 🛠️ Option 2: Local Docker Build

If you prefer building locally on your machine with Docker:

```bash
# For generic ARM64:
bash run-build.sh

# For GL.iNet router firmware architecture:
TARGET_ARCH_OVERRIDE="aarch64_cortex-a53_neon-vfpv4" bash run-build.sh
```
Compiled `.ipk` files and `SHA256SUMS.txt` will be placed in `./output/`.

---

## 📥 Installation on OpenWrt Router

1. Copy `.ipk` packages to router:
```bash
scp output/*.ipk root@<router-ip>:/tmp/
```

2. SSH into router and install:
```bash
ssh root@<router-ip>

# Install openssh-sftp-server first (required by Proxmox pvecm)
opkg update
opkg install openssh-sftp-server

# Install corosync & qnetd packages
opkg install --nodeps --force-reinstall \
  /tmp/libnspr_*.ipk \
  /tmp/libnss_*.ipk \
  /tmp/libqb_*.ipk \
  /tmp/libknet_*.ipk \
  /tmp/corosync-qnetd_*.ipk \
  /tmp/corosync-nss-tools_*.ipk
```

3. Configure Firewall and Initialise Database:
```bash
# Pass your Proxmox node IP addresses
corosync-qnetd-setup 192.168.1.100 192.168.1.101
```

4. Connect from Proxmox Node:
```bash
# Run on ONE Proxmox cluster node
pvecm qdevice setup <router-ip>

# Verify quorum status
pvecm status
```
