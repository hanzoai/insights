#!/bin/bash

if [[ ! -f mmdb.db ]]; then
    sudo apt-get install -y curl ca-certificates brotli
    curl -sS -L "https://download.db-ip.com/free/dbip-city-lite-$(date +%Y-%m).mmdb.gz" | gunzip > mmdb.db
fi

git pull
go build
./livestream