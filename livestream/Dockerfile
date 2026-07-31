FROM golang:1.26 AS builder
WORKDIR /code
COPY go.sum go.mod ./
RUN go mod download -x

COPY . ./
# No `go get ./...`: go.mod and go.sum are committed, so `go mod download` above
# already has every module this builds. `go get` would rewrite go.mod during the
# build and resolve versions from the network, making the image non-reproducible.
RUN go build -v -o /livestream .

# GeoIP City database, for the IP -> (lat,lng) lookup the service does on every
# consumed event. It is REQUIRED: main() calls NewMaxMindGeoLocator at boot and
# exits if the file is missing.
#
# Source is DB-IP City Lite (free, GeoLite2-format compatible) — the same source
# the main insights image uses. It replaces mmdbcdn.insights.hanzo.ai, which
# resolves to the cluster load balancer but serves no certificate for that name,
# so the fetch failed TLS and this image could never be built.
#
# The file is month-stamped and the new month's is published a few days in, so
# fall back to the previous month rather than failing every build on the 1st.
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends ca-certificates curl gzip; \
    rm -rf /var/lib/apt/lists/*; \
    for month in "$(date -u +%Y-%m)" "$(date -u -d '1 month ago' +%Y-%m)"; do \
        if curl -sSfL -o /tmp/dbip.mmdb.gz \
            "https://download.db-ip.com/free/dbip-city-lite-${month}.mmdb.gz"; then \
            break; \
        fi; \
    done; \
    test -s /tmp/dbip.mmdb.gz; \
    gunzip -c /tmp/dbip.mmdb.gz > /GeoLite2-City.mmdb; \
    rm -f /tmp/dbip.mmdb.gz; \
    chmod 755 /GeoLite2-City.mmdb

FROM ubuntu:24.04
COPY --from=builder /livestream /GeoLite2-City.mmdb /
COPY --from=builder /etc/ssl/certs /etc/ssl/certs
COPY --from=builder /usr/share/ca-certificates /usr/share/ca-certificates

# TODO run as non-root user
# nosemgrep: dockerfile.security.last-user-is-root.last-user-is-root
USER root

CMD ["/livestream"]
