#!/bin/bash

if [[ ! -f mmdb.db ]]; then
    sudo apt-get install -y curl ca-certificates brotli
    curl https://mmdbcdn.insights.net/ | brotli -d > mmdb.db
fi

git pull
go build
./livestream