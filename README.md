# Corosync QNetd for OpenWrt 23.05, 24.10 and 25.12

[![OpenWrt 23.05 | 24.10 | 25.12](https://img.shields.io/badge/OpenWrt-23.05_|_24.10_|_25.12-blue.svg)](https://openwrt.org/)
[![QNetd 3.0.5](https://img.shields.io/badge/QNetd-3.0.5-cyan.svg)](https://github.com/corosync/corosync-qdevice)
[![Proxmox VE Compatible](https://img.shields.io/badge/Proxmox_VE-7_|_8_|_9-orange.svg)](https://pve.proxmox.com/)
[![License: BSD-3-Clause](https://img.shields.io/badge/License-BSD--3--Clause-blue.svg)](LICENSE)

Native OpenWrt feed and automated build system for **Corosync QNetd 3.0.5** and its NSS/NSPR runtime libraries. It provides both `.ipk` packages (OpenWrt 23.05 and 24.10, and GL.iNet stock firmware) and `.apk` packages (OpenWrt 25.12 and later). It targets `musl` libc embedded devices (ARM64 / Cortex-A53, x86_64, MediaTek Filogic).

This suite enables running a lightweight quorum arbitrator directly on your OpenWrt router (for example a GL.iNet Flint AX, Flint 2 (GL-MT6000), Beryl AX, Brume 2, a Raspberry Pi 4, a Protectli, or an x86_64 router) to serve as a reliable third-vote tie-breaker for 2-node **Proxmox VE** clusters.

---

## 🌟 Architecture & Features

- **Lean Arbitrator Only**: Builds the standalone **Corosync QNetd 3.0.5** daemon plus the NSS/NSPR runtime it links against.
- **TLS Client Authentication**: QNetd uses NSS certificates. `pvecm qdevice setup` issues signed cluster certificates.
- **Certificate Signing Without OpenSSL**: `corosync-qnetd-certutil` is a POSIX `sh` port of upstream's 3.0.5 script (upstream requires `bash`). It signs cluster certificates with NSS `certutil` only, so no OpenSSL is needed on the router. It supports upstream's options: `-i`, `-s`, `-I` (add another CA and server certificate for hybrid PKI), `-C` (CA nickname), `-S` (server nickname), `-g` (key size), `-k` (key type), and `-q` (paramset, such as a curve or ML-DSA set for post-quantum keys). The CA is created with basicConstraints (CA=true), as upstream does.
- **Proxmox VE 7 / 8 / 9 Ready**: Works with `pvecm qdevice setup` once the `corosync-qdevice` package is installed on every Proxmox node (see the Proxmox VE Quorum Setup section).
- **Automated OpenWrt Setup**: Provides `corosync-qnetd-setup` to initialize the NSS certificate database, generate cryptographic signatures, configure UCI firewall rules, and symlink Dropbear SFTP server paths.
- **Zero-Footprint Procd Integration**: Native OpenWrt `procd` service scripts with automatic respawn, clean process supervision, and log redirection.
- **Multi-Architecture Matrix CI**: Automated GitHub Actions workflow that builds `.ipk` and `.apk` packages in the cloud for free.

---

## 📦 Packages Provided

| Package | Version | Description | Target Files |
| :--- | :--- | :--- | :--- |
| **`corosync-qnetd`** | 3.0.5 | Lightweight quorum arbitrator daemon | `/usr/sbin/corosync-qnetd`, `/etc/init.d/corosync-qnetd` |
| **`corosync-nss-tools`** | 3.0.5 | Setup assistant, certificate signing helper, and utilities | `/usr/sbin/corosync-qnetd-setup`, `corosync-qnetd-certutil`, `certutil`, `pk12util` |
| **`libnss`** | 3.134 | Mozilla Network Security Services crypto engine | `libnss3.so`, `libssl3.so`, `libsoftokn3.so`, `libfreebl3.so` |
| **`libnspr`** | 4.41 | Netscape Portable Runtime library | `libnspr4.so`, `libplds4.so`, `libplc4.so` |

### Package Formats

| Format | Built with | Use for | Tested end-to-end |
| :--- | :--- | :--- | :--- |
| **`.ipk`** | OpenWrt 23.05 SDK (default 23.05.5) | OpenWrt 23.05, 24.10, and GL.iNet stock firmware (`opkg`) | OpenWrt 23.05.6 and 24.10.8 (x86-64 containers) |
| **`.apk`** | OpenWrt 25.12 SDK (default 25.12.6) | OpenWrt 25.12 and later (`apk`-based), for example a GL.iNet Flint 2 (GL-MT6000) running OpenWrt 25.12 | OpenWrt 25.12.6 (x86-64 container) |

The `mediatek-filogic` target (`aarch64_cortex-a53`) is built and compiled in both formats, but it has not been tested on real hardware.

Release file names include the architecture. For example, `.apk` files look like `corosync-qnetd-3.0.5-r1_aarch64_cortex-a53.apk`, and `.ipk` files look like `corosync-qnetd_3.0.5-1_aarch64_cortex-a53.ipk`.

---

## 💾 Storage & RAM Footprint

Optimized for flash-constrained embedded hardware with minimal RAM impact:

| Metric | Footprint | Details |
| :--- | :--- | :--- |
| **Total Download Size** | **~1.85 MB** | Four compressed packages transferred via `scp` (measured for 3.0.5 `.apk`, `aarch64_cortex-a53`) |
| **Uncompressed Flash Storage (`/overlay`)** | **~4.5 MB – 4.8 MB** | Total disk footprint on OpenWrt root overlay |
| **Active RAM Usage (Resident RSS)** | **~12 MB – 16 MB** | Idle memory consumption under `procd` monitoring |
| **Flash Usage on GL-MT3000 (Beryl AX)** | **~2.0%** | Of 256 MB NAND Flash |
| **Flash Usage on GL-MT6000 (Flint 2)** | **< 0.1%** | Of 8 GB eMMC Storage |
| **Flash Usage on Standard 128 MB Router** | **~3.9%** | Of 128 MB NAND Flash |

Apart from the download size, these figures were measured with the previous release (NSS 3.98). NSS 3.134 packages are about 12% larger, so flash usage will be slightly higher.

---

## ⚡ Option 1: Build in the Cloud via GitHub Actions (Recommended)

This repository includes a multi-architecture **GitHub Actions Matrix Workflow** (`.github/workflows/build.yml`) that compiles the entire suite in the cloud using Ubuntu runners without needing local Docker or compiler toolchains.

### Method A: Push to GitHub & Download Artifacts
1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "Build QNetd for OpenWrt"
   git push origin main
   ```
2. In your GitHub repository, open the **Actions** tab.
3. The **"Build OpenWrt QNetd"** workflow will trigger automatically and build across these target architectures:
   - `glinet-aarch64` (`aarch64_cortex-a53_neon-vfpv4`, `.ipk` only): GL.iNet stock firmware (Flint AX1800, Beryl AX MT3000, Brume 2 MT2500)
   - `armsr-armv8` (`aarch64_generic`, `.ipk` and `.apk`): Generic ARM64, Raspberry Pi 4, VMs
   - `mediatek-filogic` (`aarch64_cortex-a53`, `.ipk` and `.apk`): GL.iNet Flint 2 (GL-MT6000), other Filogic 820/830 routers
   - `x86-64` (`x86_64`, `.ipk` and `.apk`): Intel and AMD x86_64 routers, Protectli, x86 VMs
4. When finished, scroll to **Artifacts** at the bottom of the run page and download the archive for your hardware. Artifacts are named `corosync-ipks-<target>` (for `.ipk` files) and `corosync-apks-<target>` (for `.apk` files), for example `corosync-ipks-glinet-aarch64.zip`.

### Method B: Manual Dispatch from GitHub UI
1. Go to **Actions** → **Build OpenWrt QNetd** → **Run workflow**.
2. **Target**: choose one target, or `all` to build the full matrix.
3. **Package format**: `both` (default), `ipk`, or `apk`.
4. **OpenWrt version (`.ipk` builds)**: `23.05.5` (default), `23.05.6`, `23.05.4` or `23.05.3`.
5. **OpenWrt version (`.apk` builds)**: free text. The default is `25.12.6`.
6. **Create release**: attach the built packages to a GitHub Release.
7. **Release tag**: `vX.Y.Z`, defaults to `v3.0.5`.
8. **Existing run ID**: optional. When set, the build job is skipped and the artifacts of that run are published instead, so a green build can be released without rebuilding.

CLI equivalent, publishing the artifacts of an existing green run:

```bash
gh workflow run build.yml \
  -f target=all \
  -f package_format=both \
  -f openwrt_version=23.05.5 \
  -f apk_openwrt_version=25.12.6 \
  -f create_release=true \
  -f release_tag=v3.0.5 \
  -f release_run_id=<existing-run-id>
```

### Method C: Automated Release via Version Tagging
Tagging a release triggers a full build and publishes a GitHub Release. Tags follow the upstream corosync convention, `vX.Y.Z`, where `X.Y.Z` is the corosync-qdevice version being packaged:
```bash
git tag v3.0.5
git push origin v3.0.5
```
The release is named after the tag and holds one asset per package, format, and architecture, plus `COMBINED_SHA256SUMS.txt`. Release assets are uploaded flat, and filenames are unique per architecture. For `.ipk` files, the GL.iNet repack rewrites both the package architecture and the filename to `aarch64_cortex-a53_neon-vfpv4`, so it cannot collide with `armsr-armv8`. `COMBINED_SHA256SUMS.txt` records each file under its target directory (`armsr-armv8/`, `glinet-aarch64/`, `mediatek-filogic/`, `x86-64/`), so verify downloaded assets by basename.

Current release: [v3.0.5](https://github.com/jrparks/corosync-qdevice-openwrt/releases/tag/v3.0.5).

---

## 🛠️ Option 2: Local Docker Build

If you prefer building locally on your workstation using Docker, the `Dockerfile` accepts these build arguments:

- `OPENWRT_VERSION` (default `23.05.5`). Set `25.12.x` to produce `.apk` files.
- `TARGET` (default `armsr`)
- `SUBTARGET` (default `armv8`)

The Dockerfile finds the OpenWrt SDK automatically (`.tar.xz` or `.tar.zst`). Build the image for the default target:

```bash
docker build -t openwrt-corosync-builder .
```

Build the image for OpenWrt 25.12 on MediaTek Filogic:

```bash
docker build --build-arg OPENWRT_VERSION=25.12.6 --build-arg TARGET=mediatek --build-arg SUBTARGET=filogic -t openwrt-corosync-builder .
```

Then run the build with the existing `run-build.sh` examples:

```bash
# Build for generic 64-bit ARM:
bash run-build.sh

# Build with GL.iNet architecture tag override (aarch64_cortex-a53_neon-vfpv4):
TARGET_ARCH_OVERRIDE="aarch64_cortex-a53_neon-vfpv4" bash run-build.sh
```

Compiled packages and `SHA256SUMS.txt` will be placed in `./output/`. With `TARGET_ARCH_OVERRIDE`, both the `Architecture:` field and the `.ipk` file name are rewritten to that architecture, matching the CI build.

---

## 📥 Installation on OpenWrt Router

### 1. Copy Packages to Router
Copy the `.ipk` files (OpenWrt 23.05 / 24.10 / GL.iNet stock firmware):
```bash
scp output/*.ipk root@<router-ip>:/tmp/
```

Copy the `.apk` files instead when the router runs OpenWrt 25.12 or later:
```bash
scp output/*.apk root@<router-ip>:/tmp/
```

### 2. Install Dependencies & Packages
SSH into your router:
```bash
ssh root@<router-ip>
```

Then choose the variant that matches your package format.

#### Option A: `.ipk` packages (opkg)
```bash
# 1. Install SFTP server required by Proxmox pvecm setup
opkg update
opkg install openssh-sftp-server

# 2. Install QNetd packages
opkg install \
  /tmp/libnspr_*.ipk \
  /tmp/libnss_*.ipk \
  /tmp/corosync-qnetd_*.ipk \
  /tmp/corosync-nss-tools_*.ipk
```

A plain `opkg install` resolved the dependencies in testing. Use `--nodeps --force-reinstall` only as a fallback for architecture mismatches on GL.iNet stock firmware:
```bash
opkg install --nodeps --force-reinstall \
  /tmp/libnspr_*.ipk \
  /tmp/libnss_*.ipk \
  /tmp/corosync-qnetd_*.ipk \
  /tmp/corosync-nss-tools_*.ipk
```

#### Option B: `.apk` packages (OpenWrt 25.12+)
```bash
# 1. Install SFTP server required by Proxmox pvecm setup
apk update
apk add openssh-sftp-server

# 2. Install QNetd packages
apk add --allow-untrusted \
  /tmp/libnspr-*.apk \
  /tmp/libnss-*.apk \
  /tmp/corosync-qnetd-*.apk \
  /tmp/corosync-nss-tools-*.apk
```

The `--allow-untrusted` flag is required because these packages are not signed with the OpenWrt release key.

Installing `corosync-nss-tools` automatically runs `corosync-qnetd-setup`. This creates the NSS database and starts `corosync-qnetd`. To add the firewall rule for your Proxmox node IPs, run `corosync-qnetd-setup` again with those IPs (see Step 1 below).

---

## 🧩 Configuration

QNetd reads optional settings from `/etc/default/corosync-qnetd`. This file, together with `/etc/corosync/qnetd/`, is preserved on upgrade and sysupgrade.

- `COROSYNC_QNETD_OPTIONS`: options passed to the `corosync-qnetd` daemon. Shell quoting is honoured. For example, to serve several server certificates:
  ```sh
  COROSYNC_QNETD_OPTIONS='-S "cert_nickname=QNetd PQC Cert,cert_nickname=QNetd Cert"'
  ```
- `COROSYNC_QNETD_CERTUTIL_KEY_SIZE`: default key size for `corosync-qnetd-certutil`.
- `COROSYNC_QNETD_CERTUTIL_KEY_TYPE`: default key type for `corosync-qnetd-certutil`.
- `COROSYNC_QNETD_CERTUTIL_PARAMSET`: default paramset for `corosync-qnetd-certutil`.

Restart the service after you change these settings:
```bash
/etc/init.d/corosync-qnetd restart
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

### Step 2: Install `corosync-qdevice` on Every Proxmox Node
Install the `corosync-qdevice` package on **every** Proxmox cluster node before you run the setup command:
```bash
apt install corosync-qdevice
```
Without this package, setup fails with `corosync-qdevice-net-certutil: command not found`.

### Step 3: Connect from Proxmox Cluster
Run the setup command on **one** of your Proxmox cluster nodes:
```bash
pvecm qdevice setup <router-ip>
```

### Step 4: Verify Cluster Quorum
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
| `pvecm qdevice setup` fails at "sign and export cluster cert" with `corosync-qnetd-certutil -s ... failed: exit code 1` | Package versions before 3.0.5 signed certificates with the `openssl` CLI, which stock OpenWrt does not include (issue #1) | Upgrade to the 3.0.5 packages. As a stopgap on older packages, install `openssl-util`. Then re-run `pvecm qdevice setup <router-ip> -f`. |
| `corosync-qdevice-net-certutil: command not found` during setup | The `corosync-qdevice` package is missing on a Proxmox node | Run `apt install corosync-qdevice` on every Proxmox node, then re-run `pvecm qdevice setup <router-ip> -f`. |
| Architecture mismatch on `opkg install` (`.ipk` on GL.iNet stock firmware) | Router OS architecture string differs | Use the GL.iNet build option (`TARGET_ARCH_OVERRIDE="aarch64_cortex-a53_neon-vfpv4"`) or add `arch aarch64_cortex-a53_neon-vfpv4 300` to `/etc/opkg.conf`. As a last resort, use the `--nodeps --force-reinstall` command shown in Installation. |

---

## 📄 License

Corosync and Corosync QNetd are licensed under the **BSD-3-Clause License**.
OpenWrt packaging and helper scripts are provided under the same terms.
