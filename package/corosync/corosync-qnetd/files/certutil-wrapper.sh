#!/bin/sh
#
# corosync-qnetd-certutil
# Server-side NSS certificate management for corosync-qnetd.
# Called remotely by Proxmox `pvecm qdevice setup`.
#
# Arguments supported:
#   -i                         Export CA certificate (initialize)
#   -s -n cluster -c cert_req  Sign cluster cert request into $NSSDB/cluster-<name>.crt
#

NSSDB="/etc/corosync/qnetd/nssdb"
CA_NICKNAME="QNet CA"

do_init() {
    if [ ! -f "$NSSDB/cert9.db" ]; then
        mkdir -p "$NSSDB"
        dd if=/dev/urandom bs=2048 count=1 of=/tmp/nss-noise.bin 2>/dev/null
        certutil -N -d "sql:$NSSDB" --empty-password || exit 1
        certutil -S -n "$CA_NICKNAME" -s "CN=QNet CA" -x -t "CT,," \
            -m 1 -v 1200 -d "sql:$NSSDB" -z /tmp/nss-noise.bin || exit 1
        certutil -S -n "QNetd Cert" -s "CN=QNetd Server" \
            -c "$CA_NICKNAME" -t "u,u,u" -m 2 -v 1200 \
            -d "sql:$NSSDB" -z /tmp/nss-noise.bin || exit 1
        rm -f /tmp/nss-noise.bin
        chmod 700 "$NSSDB"
        shlibsign -v -i /usr/lib/libfreeblpriv3.so >/dev/null 2>&1 || true
        shlibsign -v -i /usr/lib/libsoftokn3.so >/dev/null 2>&1 || true
    fi

    certutil -L -d "sql:$NSSDB" -n "$CA_NICKNAME" -a \
        > "$NSSDB/qnetd-cacert.crt" || exit 1
}

do_sign() {
    local cluster_name="$1"
    local cert_request_file="$2"
    local crt_file="$NSSDB/cluster-${cluster_name}.crt"
    local serial_file="$NSSDB/serial.txt"
    local tmpreq serial ret

    [ -f "$NSSDB/cert9.db" ] || { echo "NSS database $NSSDB not initialized (run -i first)" >&2; exit 1; }

    tmpreq=$(mktemp /tmp/qnetd-req-XXXXXX) || exit 1
    if [ -n "$cert_request_file" ]; then
        cp "$cert_request_file" "$tmpreq" || { rm -f "$tmpreq"; exit 1; }
    else
        cat > "$tmpreq"
    fi

    # Serial numbers 1 and 2 are used by the CA and server certificates.
    serial=$(cat "$serial_file" 2>/dev/null)
    case "$serial" in
        ''|*[!0-9]*) serial=2 ;;
    esac
    serial=$((serial + 1))
    echo "$serial" > "$serial_file"

    # Sign with NSS directly (same as upstream corosync-qnetd-certutil).
    # certutil accepts both binary (DER) and ASCII (PEM) requests.
    echo "Signing cluster certificate" >&2
    certutil -C -v 1200 -m "$serial" -i "$tmpreq" -o "$crt_file" \
        -c "$CA_NICKNAME" -d "sql:$NSSDB"
    ret=$?
    rm -f "$tmpreq"

    if [ $ret -eq 0 ]; then
        echo "Certificate stored in $crt_file" >&2
    else
        echo "Failed to sign certificate request" >&2
        rm -f "$crt_file"
    fi
    return $ret
}

INIT=0
SIGN=0
CLUSTER_NAME=""
CERT_REQUEST_FILE=""

while getopts "isn:d:c:t:CfFph" opt; do
    case "$opt" in
    i) INIT=1 ;;
    s) SIGN=1 ;;
    n) CLUSTER_NAME="$OPTARG" ;;
    c) CERT_REQUEST_FILE="$OPTARG" ;;
    *) ;;
    esac
done

if [ $INIT -eq 1 ]; then
    do_init
    exit $?
fi

if [ $SIGN -eq 1 ]; then
    [ -z "$CLUSTER_NAME" ] && { echo "cluster name required (-n)" >&2; exit 1; }
    do_sign "$CLUSTER_NAME" "$CERT_REQUEST_FILE"
    exit $?
fi

echo "Usage: $0 -i | -s -n cluster_name [-c cert_request_file]" >&2
exit 1
