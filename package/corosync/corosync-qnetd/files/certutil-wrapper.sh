#!/bin/sh
#
# corosync-qnetd-certutil
# Server-side NSS certificate management for corosync-qnetd.
# Called remotely by Proxmox `pvecm qdevice setup`.
#
# POSIX sh port of upstream corosync-qnetd-certutil 3.0.5 (which needs bash),
# accepting the same options:
#   -i                  Initialize the QNetd CA and server certificate
#   -I                  Add another QNetd CA and server certificate (hybrid PKI)
#   -s -c crq -n name   Sign a cluster certificate request into
#                       $DB_DIR/cluster-<name>.crt
#   -C ca_nickname      CA certificate nickname (default "QNet CA")
#   -S serv_nickname    Server certificate nickname (default "QNetd Cert")
#   -g keysize          Passed to certutil -g
#   -k keytype          Passed to certutil -k
#   -q paramset         Passed to certutil -q (curve name, ml-dsa set)
#   -G                  Accepted for compatibility, no effect
#

CONFIG_DIR="/etc/corosync/qnetd"
DB_DIR="$CONFIG_DIR/nssdb"
SERIAL_NO_FILE="$DB_DIR/serial.txt"
CRT_VALIDITY=1200
CA_NICKNAME="QNet CA"
SERVER_NICKNAME="QNetd Cert"
SERVER_SUBJECT="CN=Qnetd Server"
CA_EXPORT_FILE="$DB_DIR/qnetd-cacert.crt"

COROSYNC_QNETD_CERTUTIL_KEY_SIZE=""
COROSYNC_QNETD_CERTUTIL_KEY_TYPE=""
COROSYNC_QNETD_CERTUTIL_PARAMSET=""

if [ -f /etc/default/corosync-qnetd ]; then
    . /etc/default/corosync-qnetd
fi

errx() {
    echo "$2" >&2
    exit "$1"
}

usage() {
    echo "$0: [-I|-i|-s] [-C ca_nickname] [-c certificate] [-G] [-g keysize] [-k keytype] [-n cluster_name] [-q paramset] [-S serv_nickname]"
    echo ""
    echo " -I                  Generate and add another QNetd CA and new server certificate"
    echo " -i                  Initialize QNetd CA and generate server certificate"
    echo " -s                  Sign cluster certificate (needs cluster certificate)"
    echo " -C ca_nickname      NSS database QNetd CA certificate nickname"
    echo " -c certificate      Certificate request to sign"
    echo " -g keysize          Key size in bits - passed directly to certutil as -g parameter"
    echo " -k keytype          Type of key - passed directly to certutil as -k parameter"
    echo " -n cluster_name     Name of cluster (for -s operation)"
    echo " -q paramset         Parameter set (curve name, ml-dsa set) - passed directly to certutil as -q parameter"
    echo " -S serv_nickname    NSS database QNetd server certificate nickname"
}

cert_db_exists() {
    [ -f "$DB_DIR/cert9.db" ] || [ -f "$DB_DIR/cert8.db" ]
}

nss_nickname_exists() {
    certutil -L -d "sql:$DB_DIR" -n "$1" >/dev/null 2>&1
}

get_certutil_key_params() {
    params=""
    [ -n "$COROSYNC_QNETD_CERTUTIL_KEY_SIZE" ] && params="$params -g $COROSYNC_QNETD_CERTUTIL_KEY_SIZE"
    [ -n "$COROSYNC_QNETD_CERTUTIL_KEY_TYPE" ] && params="$params -k $COROSYNC_QNETD_CERTUTIL_KEY_TYPE"
    [ -n "$COROSYNC_QNETD_CERTUTIL_PARAMSET" ] && params="$params -q $COROSYNC_QNETD_CERTUTIL_PARAMSET"
    echo "$params"
}

# Like upstream, serial numbers start at 101. Databases created by older
# releases of this package used 1 and 2, so there is no overlap.
get_serial_no() {
    serial_no=$(cat "$SERIAL_NO_FILE" 2>/dev/null)
    case "$serial_no" in
        ''|*[!0-9]*) serial_no=100 ;;
    esac
    serial_no=$((serial_no + 1))
    echo "$serial_no" > "$SERIAL_NO_FILE" || return 1
    echo "$serial_no"
}

# Run certutil -S with a fresh noise file. Extra arguments are passed through.
certutil_generate() {
    noise_file=$(mktemp /tmp/qnetd-noise-XXXXXX) || return 1
    dd if=/dev/urandom bs=2048 count=1 of="$noise_file" 2>/dev/null
    # shellcheck disable=SC2046
    certutil -S -d "sql:$DB_DIR" -z "$noise_file" "$@" $(get_certutil_key_params)
    ret=$?
    rm -f "$noise_file"
    return $ret
}

add_qnetd_ca() {
    cert_db_exists || errx 1 "Certificate database doesn't exist. Use $0 -i to create it"

    nss_nickname_exists "$CA_NICKNAME" && \
        errx 1 "Certificate nickname \"$CA_NICKNAME\" already exists in the database."
    nss_nickname_exists "$SERVER_NICKNAME" && \
        errx 1 "Certificate nickname \"$SERVER_NICKNAME\" already exists in the database."

    echo "Creating new CA"
    serial=$(get_serial_no) || errx 1 "Can't update $SERIAL_NO_FILE"
    # -2 adds basicConstraints. certutil asks: is this a CA, path length, critical
    printf 'y\n0\ny\n' | certutil_generate -n "$CA_NICKNAME" -s "CN=$CA_NICKNAME" -x \
        -t "CT,," -m "$serial" -v "$CRT_VALIDITY" -2 >/dev/null || \
        errx 1 "Failed to create CA certificate \"$CA_NICKNAME\""

    # Export CA certificate (pretty-printed text followed by ascii, like upstream)
    certutil -L -d "sql:$DB_DIR" -n "$CA_NICKNAME" > "$CA_EXPORT_FILE" && \
    certutil -L -d "sql:$DB_DIR" -n "$CA_NICKNAME" -a >> "$CA_EXPORT_FILE" || \
        errx 1 "Failed to export CA certificate to $CA_EXPORT_FILE"

    serial=$(get_serial_no) || errx 1 "Can't update $SERIAL_NO_FILE"
    certutil_generate -n "$SERVER_NICKNAME" -s "$SERVER_SUBJECT" -c "$CA_NICKNAME" \
        -t "u,u,u" -m "$serial" -v "$CRT_VALIDITY" || \
        errx 1 "Failed to create server certificate \"$SERVER_NICKNAME\""

    echo "QNetd CA certificate is exported as $CA_EXPORT_FILE"
}

init_qnetd_ca() {
    if cert_db_exists; then
        # pvecm runs -i on every setup; keep the existing CA and re-export it
        # instead of failing like upstream does.
        echo "Certificate database ($DB_DIR) already exists, re-exporting CA certificate"
        certutil -L -d "sql:$DB_DIR" -n "$CA_NICKNAME" > "$CA_EXPORT_FILE" && \
        certutil -L -d "sql:$DB_DIR" -n "$CA_NICKNAME" -a >> "$CA_EXPORT_FILE" || \
            errx 1 "Failed to export CA certificate to $CA_EXPORT_FILE"
        return 0
    fi

    echo "Creating $DB_DIR"
    mkdir -p "$DB_DIR" || errx 1 "Can't create $DB_DIR"
    chmod 700 "$DB_DIR"

    echo "Creating new key and cert db"
    certutil -N -d "sql:$DB_DIR" --empty-password || errx 1 "Failed to create certificate database"

    # NSS self-tests need the integrity check files next to the libraries
    shlibsign -v -i /usr/lib/libfreeblpriv3.so >/dev/null 2>&1 || true
    shlibsign -v -i /usr/lib/libsoftokn3.so >/dev/null 2>&1 || true

    add_qnetd_ca
}

sign_cert() {
    cert_db_exists || errx 1 "Certificate database doesn't exist. Use $0 -i to create it"
    [ -f "$CERTIFICATE_FILE" ] || errx 2 "Can't open certificate file $CERTIFICATE_FILE"
    [ -n "$CLUSTER_NAME" ] || errx 2 "You have to specify cluster name"

    crt_file="$DB_DIR/cluster-$CLUSTER_NAME.crt"
    serial=$(get_serial_no) || errx 1 "Can't update $SERIAL_NO_FILE"

    echo "Signing cluster certificate"
    # certutil accepts both binary (DER) and ASCII (PEM) requests
    if ! certutil -C -v "$CRT_VALIDITY" -m "$serial" -i "$CERTIFICATE_FILE" \
        -o "$crt_file" -c "$CA_NICKNAME" -d "sql:$DB_DIR"; then
        rm -f "$crt_file"
        errx 1 "Failed to sign certificate request $CERTIFICATE_FILE"
    fi

    echo "Certificate stored in $crt_file"
}

OPERATION=""
CERTIFICATE_FILE=""
CLUSTER_NAME=""

while getopts ":IGhisC:c:g:k:n:q:S:" opt; do
    case "$opt" in
        I) OPERATION=add_qnetd_ca ;;
        i) OPERATION=init_qnetd_ca ;;
        s) OPERATION=sign_cert ;;
        h) usage; exit 0 ;;
        G) ;;
        C)
            CA_NICKNAME="$OPTARG"
            CA_EXPORT_FILE="$DB_DIR/qnetd-cacert-$CA_NICKNAME.crt"
            ;;
        c) CERTIFICATE_FILE="$OPTARG" ;;
        g) COROSYNC_QNETD_CERTUTIL_KEY_SIZE="$OPTARG" ;;
        k) COROSYNC_QNETD_CERTUTIL_KEY_TYPE="$OPTARG" ;;
        n) CLUSTER_NAME="$OPTARG" ;;
        q) COROSYNC_QNETD_CERTUTIL_PARAMSET="$OPTARG" ;;
        S) SERVER_NICKNAME="$OPTARG" ;;
        \?) errx 1 "Invalid option: -$OPTARG" ;;
        :) errx 1 "Option -$OPTARG requires an argument." ;;
    esac
done

case "$OPERATION" in
    init_qnetd_ca) init_qnetd_ca ;;
    add_qnetd_ca) add_qnetd_ca ;;
    sign_cert) sign_cert ;;
    *) usage; exit 1 ;;
esac
