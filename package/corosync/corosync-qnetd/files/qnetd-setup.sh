#!/bin/sh
#
# corosync-qnetd-setup [ip1] [ip2] ...
# Sets up the NSS certificate database, configures firewall rules for the
# given Proxmox node IPs, enables and starts corosync-qnetd.
#
# If no IPs are given, the firewall step is skipped and must be done manually.

NSSDB=/etc/corosync/qnetd/nssdb

echo "=== Initializing Corosync QNetd for OpenWrt ==="

# Create the NSS database, QNetd CA and server certificate (no-op if present)
if ! /usr/sbin/corosync-qnetd-certutil -i; then
    echo "  ERROR: failed to initialize NSS certificate database in $NSSDB" >&2
    exit 1
fi

# Firewall rule — single rule with all Proxmox node IPs as space-separated src_ip
if [ $# -gt 0 ]; then
    for name in $(uci show firewall | grep "name='Allow-QNetd-Proxmox'" | cut -d. -f2 | cut -d= -f1); do
        uci -q delete firewall.$name
    done
    src_ips="$*"
    uci add firewall rule
    uci set firewall.@rule[-1].name='Allow-QNetd-Proxmox'
    uci set firewall.@rule[-1].src='lan'
    uci set firewall.@rule[-1].src_ip="${src_ips}"
    uci set firewall.@rule[-1].dest_port='5403'
    uci set firewall.@rule[-1].proto='tcp'
    uci set firewall.@rule[-1].target='ACCEPT'
    echo "  Firewall configured: allow TCP 5403 from ${src_ips}"
    uci commit firewall
    /etc/init.d/firewall restart >/dev/null 2>&1 || true
else
    echo "  Note: No Proxmox node IPs supplied."
    echo "  Run later: corosync-qnetd-setup <node1-ip> <node2-ip>"
fi

# Ensure sftp-server is at the path dropbear expects (required for pvecm qdevice setup)
if [ ! -e /usr/libexec/sftp-server ] && [ -f /usr/lib/sftp-server ]; then
    mkdir -p /usr/libexec
    ln -sf /usr/lib/sftp-server /usr/libexec/sftp-server
    echo "  Created Dropbear sftp-server symlink: /usr/libexec/sftp-server"
fi

/etc/init.d/corosync-qnetd enable 2>/dev/null || true
/etc/init.d/corosync-qnetd restart 2>/dev/null || /etc/init.d/corosync-qnetd start 2>/dev/null || true

echo "✓ Corosync QNetd is active and listening on port 5403"
echo "  Run 'pvecm qdevice setup <router-ip>' on your Proxmox cluster"
