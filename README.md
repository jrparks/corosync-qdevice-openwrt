# Corosync QNetd for OpenWrt 23.05

[![OpenWrt 23.05](https://img.shields.io/badge/OpenWrt-23.05-blue.svg)](https://openwrt.org/)
[![QNetd 3.0.4](https://img.shields.io/badge/QNetd-3.0.4-cyan.svg)](https://github.com/corosync/corosync-qdevice)
[![Proxmox VE Compatible](https://img.shields.io/badge/Proxmox_VE-7_|_8_|_9-orange.svg)](https://pve.proxmox.com/)
[![License: BSD-3-Clause](https://img.shields.io/badge/License-BSD--3--Clause-blue.svg)](LICENSE)

Native OpenWrt 23.05 feed and automated build system for **Corosync QNetd 3.0.4** and its NSS/NSPR runtime libraries, targeting `musl` libc embedded devices (ARM64 / Cortex-A53, x86_64, MediaTek Filogic).

This suite enables running a lightweight quorum arbitrator directly on your OpenWrt router (e.g., GL.iNet Flint AX, Beryl AX, Brume 2, Raspberry Pi 4, Protectli, or x86_64 routers) to serve as a reliable third-vote tie-breaker for 2-node **Proxmox VE** clusters.

---

## 🌟 Architecture & Features

- **Lean Arbitrator Only**: Builds the standalone **Corosync QNetd 3.0.4** daemon plus the NSS/NSPR runtime it links against. No cluster engine, no knet, no libqb.
- **TLS Client Authentication**: QNetd uses NSS certificates; `pvecm qdevice setup` issues signed cluster certificates.
- **Proxmox VE 7 / 8 / 9 Ready**: Includes `certutil-wrapper` with automatic OpenSSL 3.x `-legacy` fallback support, eliminating PKCS#12 signing failures during `pvecm qdevice setup`.
- **Automated OpenWrt Setup**: Provides `corosync-qnetd-setup` to initialize the NSS certificate database, generate cryptographic signatures, configure UCI firewall rules, and symlink Dropbear SFTP server paths.
- **Zero-Footprint Procd Integration**: Native OpenWrt `procd` service scripts with automatic respawn, clean process supervision, and log redirection.
- **Multi-Architecture Matrix CI**: Automated GitHub Actions workflow compiling ready-to-flash `.ipk` packages in the cloud for free.

---

## 📦 Packages Provided

| Package | Version | Description | Target Files |
| :--- | :--- | :--- | :--- |
| **`corosync-qnetd`** | 3.0.4 | Lightweight quorum arbitrator daemon | `/usr/sbin/corosync-qnetd`, `/etc/init.d/corosync-qnetd` |
| **`corosync-nss-tools`** | 3.0.4 | Setup assistant, certificate wrapper, and utilities | `/usr/sbin/corosync-qnetd-setup`, `corosync-qnetd-certutil`, `certutil`, `pk12util` |
| **`libnss`** | 3.98 | Mozilla Network Security Services crypto engine | `libnss3.so`, `libssl3.so`, `libsoftokn3.so`, `libfreebl3.so` |
| **`libnspr`** | 4.35 | Netscape Portable Runtime library | `libnspr4.so`, `libplds4.so`, `libplc4.so` |

---

## 💾 Storage & RAM Footprint

Optimized for flash-constrained embedded hardware with minimal RAM impact:

| Metric | Footprint | Details |
| :--- | :--- | :--- |
| **Total Download Size (`.ipk` files)** | **~1.7 MB** | Compressed `.ipk` archives transferred via `scp` |
| **Uncompressed Flash Storage (`/overlay`)** | **~4.5 MB – 4.8 MB** | Total disk footprint on OpenWrt root overlay |
| **Active RAM Usage (Resident RSS)** | **~12 MB – 16 MB** | Idle memory consumption under `procd` monitoring |
| **Flash Usage on GL-MT3000 (Beryl AX)** | **~2.0%** | Of 256 MB NAND Flash |
| **Flash Usage on GL-MT6000 (Flint 2)** | **< 0.1%** | Of 8 GB eMMC Storage |
| **Flash Usage on Standard 128 MB Router** | **~3.9%** | Of 128 MB NAND Flash |

---

## ⚡ Option 1: Build in the Cloud via GitHub Actions (Recommended)

This repository includes a multi-architecture **GitHub Actions Matrix Workflow** (`.github/workflows/build.yml`) that compiles the entire suite in the cloud using Ubuntu runners without needing local Docker or compiler toolchains.

### Method A: Push to GitHub & Download IPK Artifacts
1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "Build QNetd for OpenWrt"
   git push origin master
   ```
2. In your GitHub repository, open the **Actions** tab.
3. The **"Build OpenWrt QNetd"** workflow will trigger automatically and build across target architectures:
   - `glinet-aarch64` (GL.iNet Flint AX1800, Beryl AX MT3000, Brume 2 MT2500)
   - `armsr-armv8` (Generic 64-bit ARM, Raspberry Pi 4, ARM VMs)
   - `mediatek-filogic` (GL.iNet Flint 2 MT6000, Filogic 820/830)
   - `x86-64` (Intel & AMD x86_64 routers / Protectli / x86 VMs)
4. When finished, scroll to **Artifacts** at the bottom of the run page and download the ZIP archive for your hardware (e.g. `corosync-ipks-glinet-aarch64.zip`).

### Method B: Manual Dispatch from GitHub UI
1. Go to **Actions** → **Build OpenWrt QNetd**.
2. Click **Run workflow**.
3. Select your desired architecture or choose `all` to build the full matrix.
4. *(Optional)* Check **"Publish as GitHub Release with attached IPKs"** to generate a tagged GitHub Release with attached IPK files and `SHA256SUMS.txt`.

### Method C: Automated Release via Version Tagging
Tagging any release tag will trigger a full release build:
```bash
git tag v3.0.4-1
git push origin v3.0.4-1
```
The compiled `.ipk` files and checksums will be automatically published on your GitHub **Releases** page.

---

## 🛠️ Option 2: Local Docker Build

If you prefer building locally on your workstation using Docker:

```bash
# Build for generic 64-bit ARM:
bash run-build.sh

# Build with GL.iNet architecture tag override (aarch64_cortex-a53):
TARGET_ARCH_OVERRIDE="aarch64_cortex-a53_neon-vfpv4" bash run-build.sh
```

Compiled `.ipk` packages and `SHA256SUMS.txt` will be placed in `./output/`.

---

## 📥 Installation on OpenWrt Router

### 1. Copy Packages to Router
```bash
scp output/*.ipk root@<router-ip>:/tmp/
```

### 2. Install Dependencies & Packages
SSH into your router and install:
```bash
ssh root@<router-ip>

# 1. Install SFTP server required by Proxmox pvecm setup
opkg update
opkg install openssh-sftp-server

# 2. Install QNetd packages
opkg install --nodeps --force-reinstall \
  /tmp/libnspr_*.ipk \
  /tmp/libnss_*.ipk \
  /tmp/corosync-qnetd_*.ipk \
  /tmp/corosync-nss-tools_*.ipk
```

---

## ⚙️ Proxmox VE Quorum Setup

### Step 1: Run Setup Assistant on the Router
Run `corosync-qnetd-setup` on your OpenWrt router, providing your Proxmox cluster node IP addresses:
```bash
corosync-qnetd-setup 192.168.1.100 192.168.1.101
```

This command automatically:
- Creates and configures the NSS database in `/etc/corosync/qnetd/nssdb`
- Generates required cryptographic integrity check signatures (`.chk`)
- Configures an OpenWrt firewall rule permitting TCP port `5403` strictly from your node IPs
- Fixes the Dropbear SFTP server path (`/usr/libexec/sftp-server`)
- Enables and starts `corosync-qnetd` via `procd`

### Step 2: Connect from Proxmox Cluster
Run the setup command on **one** of your Proxmox cluster nodes:
```bash
pvecm qdevice setup <router-ip>
```

### Step 3: Verify Cluster Quorum
Check the cluster quorum status from Proxmox:
```bash
pvecm status
```

You should see:
```text
Votequorum information
----------------------
Expected votes:    3
Highest expected:  3
Total votes:       3
Quorum:            2  
Flags:             Quorate Qdevice

Membership information
----------------------
    Nodeid      Votes Name
0x00000001          1 192.168.1.100
0x00000002          1 192.168.1.101
0x00000000          1 Qdevice
```

Check the active connections on the router:
```bash
corosync-qnetd-tool -s
```

---

## 🔍 Troubleshooting & Verification

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| `pvecm qdevice setup` fails with SFTP error | Dropbear cannot locate `sftp-server` | Run `opkg install openssh-sftp-server` and ensure `ln -sf /usr/lib/sftp-server /usr/libexec/sftp-server` exists. |
| Connection refused on port `5403` | Firewall blocking port `5403` | Run `corosync-qnetd-setup <node1-ip> <node2-ip>` to add the firewall rule, or check `/etc/init.d/corosync-qnetd status`. |
| NSS PKCS#12 import error on Proxmox 8/9 | OpenSSL 3.x rejects NSS-generated PKCS#12 | The included `certutil-wrapper` automatically invokes OpenSSL with `-legacy` fallback. |
| Architecture mismatch on `opkg install` | Router OS architecture string differs | Use the GL.iNet build option (`TARGET_ARCH_OVERRIDE="aarch64_cortex-a53_neon-vfpv4"`) or add `arch aarch64_cortex-a53_neon-vfpv4 300` to `/etc/opkg.conf`. |

---

## 📄 License

Corosync and Corosync QNetd are licensed under the **BSD-3-Clause License**.
OpenWrt packaging and helper scripts are provided under the same terms.
