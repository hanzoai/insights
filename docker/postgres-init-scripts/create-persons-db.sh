#!/bin/bash

set -e
set -u

echo "Checking if database 'insights_persons' exists..."
DB_EXISTS=$(psql -U "$POSTGRES_USER" -tAc "SELECT 1 FROM pg_database WHERE datname='insights_persons'")

if [ -z "$DB_EXISTS" ]; then
    echo "Creating database 'insights_persons'..."
    psql -U "$POSTGRES_USER" -c "CREATE DATABASE insights_persons;"
    psql -U "$POSTGRES_USER" -c "GRANT ALL PRIVILEGES ON DATABASE insights_persons TO $POSTGRES_USER;"
    echo "Database 'insights_persons' created successfully"
else
    echo "Database 'insights_persons' already exists"
fi
