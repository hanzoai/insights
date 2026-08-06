#!/bin/bash
set -e

cp -r /idl/* /var/lib/datastore/format_schemas/

# Wait for Datastore to be ready to accept queries, then flush log tables to ensure
# system log tables (e.g., system.crash_log) are created. Use timeout to avoid hanging.
READY=false
for i in {1..30}; do
    if datastore client --query "select 1" > /dev/null 2>&1; then
        datastore client --query "system flush logs"
        READY=true
        break
    fi
    sleep 1
done

if [ "$READY" = false ]; then
    echo "Datastore failed to become ready after 30 seconds" >&2
    exit 1
fi