#
# This Dockerfile is used for self-hosted production builds.
#
# The stages are used to:
#
# - frontend-build: build the frontend (static assets)
# - sourcemap-upload: upload sourcemaps (isolated, no artifacts)
# - node-scripts-build: build standalone Node.js scripts and their dependencies
# - insights-build: fetch Insights (Django app) dependencies & build Django collectstatic
# - fetch-geoip-db: fetch the GeoIP database
#
# Node.js services are built separately using Dockerfile.node.
#
# In the last stage, we import the artifacts from the previous
# stages, add some runtime dependencies and build the final image.
#


#
# ---------------------------------------------------------
#
FROM node:24.13.0-bookworm-slim AS frontend-build
WORKDIR /code
SHELL ["/bin/bash", "-e", "-o", "pipefail", "-c"]

# git is needed for pnpm to fetch git+https deps (e.g. chartjs-plugin-stacked100
# pinned to github:hanzoai/chartjs-plugin-stacked100#built-1.7.1).
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY turbo.json package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY frontend/package.json frontend/
# The design system is its own workspace package (pnpm-workspace.yaml lists
# frontend/@hanzo/*), and products/ depend on it as workspace:*. Without its
# manifest in the build context pnpm cannot see the local project, falls back to
# the npm registry, and dies on ERR_PNPM_FETCH_404 — @hanzo/elements is not
# published. `COPY frontend/package.json` does not reach nested packages.
COPY frontend/@hanzo/ frontend/@hanzo/
COPY frontend/bin/ frontend/bin/
COPY bin/ bin/
COPY patches/ patches/
COPY common/ common/
COPY products/ products/
COPY docs/onboarding/ docs/onboarding/
# @hanzo/quill, -charts and -components are workspace deps of the frontend and
# live here, not under common/ or products/. The import brought them; this COPY
# is the one upstream already carries for the same reason.
COPY packages/quill/ packages/quill/
# frontend depends on @hanzo/openapi-codegen as workspace:*, and pnpm-workspace
# reaches it through `tools/*`. Upstream gets away with not copying it because
# upstream installs --frozen-lockfile, which takes the link from the lockfile;
# this stage re-resolves (see below), so the package has to actually be in the
# workspace or the install stops on ERR_PNPM_WORKSPACE_PKG_NOT_FOUND. Only this
# one member is named by the frontend, so only this one is copied.
COPY tools/openapi-codegen/ tools/openapi-codegen/
# Filter install — only @hanzo/frontend and its workspace deps. Drop
# --frozen-lockfile because catalog `@parcel/transformer-typescript-types`
# was bumped 2.16.4→2.13.3 to match scriptvm's pinned config-default.
RUN --mount=type=cache,id=pnpm,target=/tmp/pnpm-store-v24 \
    corepack enable && pnpm --version && \
    CI=1 pnpm --filter=@hanzo/frontend... install --no-frozen-lockfile --store-dir /tmp/pnpm-store-v24

COPY frontend/ frontend/
RUN bin/turbo --filter=@hanzo/frontend build


#
# ---------------------------------------------------------
#
# Isolated stage for sourcemap upload - keeps secrets and external network calls
# out of the main build cache. This stage produces no artifacts for the final image.
#
FROM node:24.13.0-bookworm-slim AS sourcemap-upload
WORKDIR /code
SHELL ["/bin/bash", "-e", "-o", "pipefail", "-c"]

ARG COMMIT_HASH

COPY --from=frontend-build /code/frontend/dist /code/frontend/dist

RUN --mount=type=secret,id=insights_upload_sourcemaps_cli_api_key \
    ( \
        if [ -f /run/secrets/insights_upload_sourcemaps_cli_api_key ]; then \
            apt-get update && \
            apt-get install -y --no-install-recommends ca-certificates curl && \
            curl --proto '=https' --tlsv1.2 -LsSf https://download.insights.hanzo.ai/cli | sh && \
            export PATH="/root/.insights:$PATH" && \
            export INSIGHTS_CLI_TOKEN="$(cat /run/secrets/insights_upload_sourcemaps_cli_api_key)" && \
            export INSIGHTS_CLI_ENV_ID=2 && \
            insights-cli --no-fail sourcemap process \
                --directory /code/frontend/dist \
                --public-path-prefix /static \
                --project insights \
                --version "${COMMIT_HASH:-unknown}"; \
        fi \
    ) || true && \
    touch /tmp/.sourcemaps-processed


#
# ---------------------------------------------------------
#
# Build the plugin transpiler.
#
# This stage used to also build nodejs/src/scripts, a standalone puppeteer
# recorder Python called by subprocess. Upstream deleted that directory when it
# replaced VideoExportWorkflow with RasterizeRecordingWorkflow and moved the
# work into its own image — Dockerfile.recording-rasterizer, which this tree
# carries. Nothing here imports the scripts, no manifest declares
# puppeteer-screen-recorder, and the COPY of a directory that no longer exists
# is what stopped the build.
#
FROM node:24.13.0-bookworm-slim AS node-scripts-build
WORKDIR /code
SHELL ["/bin/bash", "-e", "-o", "pipefail", "-c"]

COPY turbo.json package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY bin/turbo bin/turbo
COPY patches/ patches/
COPY common/esbuilder/ common/esbuilder/
COPY common/plugin_transpiler/ common/plugin_transpiler/
RUN --mount=type=cache,id=pnpm,target=/tmp/pnpm-store-v24 \
    apt-get update && apt-get install -y --no-install-recommends git ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && corepack enable \
    && NODE_OPTIONS="--max-old-space-size=4096" CI=1 pnpm --filter=@hanzo/plugin-transpiler... install --no-frozen-lockfile --store-dir /tmp/pnpm-store-v24 \
    && NODE_OPTIONS="--max-old-space-size=4096" bin/turbo --filter=@hanzo/plugin-transpiler build


#
# ---------------------------------------------------------
#
FROM ghcr.io/astral-sh/uv:0.10.2 AS uv

# Same as pyproject.toml so that uv can pick it up and doesn't need to download a different Python version.
#
# That sentence is the invariant, and convergence broke it: the upstream import
# moved `requires-python` to ==3.13.13 while this line stayed on 3.12.12. uv
# resolves the interpreter from pyproject, so the mismatch does not build — it
# either refuses outright or fetches a second Python and installs the venv
# against an interpreter the runtime stage below does not carry. Bumping here
# is what keeps the comment true.
FROM python:3.13.13-slim-bookworm@sha256:355bfa66770995d7e9a0da4b3473b44d0cb451f6b56f5615ad9c39e3c4eca03f AS insights-build
COPY --from=uv /uv /uvx /bin/
WORKDIR /code
SHELL ["/bin/bash", "-e", "-o", "pipefail", "-c"]

# uv settings for Docker builds
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy
ENV UV_PROJECT_ENVIRONMENT=/python-runtime

# Install build dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    "build-essential" \
    "cmake" \
    "curl" \
    "git" \
    "libpq-dev" \
    "libxmlsec1" \
    "libxmlsec1-dev" \
    "libffi-dev" \
    "unzip" \
    "uuid-dev" \
    "zlib1g-dev" \
    "pkg-config" \
    && \
    rm -rf /var/lib/apt/lists/*

# Build ANTLR4 C++ runtime for insightsql-parser
RUN curl -L https://www.antlr.org/download/antlr4-cpp-runtime-4.13.1-source.zip -o /tmp/antlr4-source.zip && \
    cd /tmp && unzip antlr4-source.zip -d antlr4-source && cd antlr4-source && \
    cmake . -DCMAKE_INSTALL_PREFIX=/usr -DBUILD_TESTING=OFF -DANTLR4_BUILD_TESTS=OFF && \
    make -j$(nproc) && make install && ldconfig && \
    rm -rf /tmp/antlr4-source /tmp/antlr4-source.zip

# Install Python dependencies using cache mount for faster rebuilds
# Cache ID includes libxmlsec1 version to bust cache when system library changes
COPY pyproject.toml uv.lock ./
COPY common/insightsql_parser common/insightsql_parser/
# uv validates workspace membership even with --no-dev, so every member named in
# [tool.uv.workspace] has to be here. The upstream import introduced that table
# — main has no workspace at all — which is why this line has no counterpart
# there.
COPY tools/insightscli tools/insightscli/
COPY tools/owners tools/owners/
# [tool.uv.sources] resolves insightsql-parser-rs to this directory, so it is a
# dependency built from source in this stage rather than fetched as a wheel.
COPY rust/insightsql/parser rust/insightsql/parser/
RUN --mount=type=cache,id=uv-libxmlsec1.2.37-3,target=/root/.cache/uv \
    uv sync --locked --no-dev --no-install-project --no-binary-package lxml --no-binary-package xmlsec

ENV PATH=/python-runtime/bin:$PATH \
    PYTHONPATH=/python-runtime

# Add in Django deps
COPY manage.py manage.py
COPY common/esbuilder common/esbuilder
COPY common/scriptvm common/scriptvm/
COPY common/migration_utils common/migration_utils/
COPY insights insights/
COPY products/ products/

# Copy the built frontend assets and also the products.json file
COPY --from=frontend-build /code/frontend/dist /code/frontend/dist
COPY --from=frontend-build /code/frontend/src/products.json /code/frontend/src/products.json

# Make sure we build the static files
RUN SKIP_SERVICE_VERSION_REQUIREMENTS=1 STATIC_COLLECTION=1 DATABASE_URL='postgres:///' REDIS_URL='redis:///' python manage.py collectstatic --noinput



#
# ---------------------------------------------------------
#
FROM debian:bookworm-slim AS fetch-geoip-db
WORKDIR /code
SHELL ["/bin/bash", "-e", "-o", "pipefail", "-c"]

# Fetch a GeoIP City database for IP geolocation within Django.
# Uses DB-IP City Lite (free, compatible with MaxMind GeoLite2 format).
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    "ca-certificates" \
    "curl" \
    "gzip" \
    && \
    rm -rf /var/lib/apt/lists/* && \
    mkdir share && \
    DBIP_MONTH=$(date +%Y-%m) && \
    curl -sS -L "https://download.db-ip.com/free/dbip-city-lite-${DBIP_MONTH}.mmdb.gz" | \
    gunzip > ./share/GeoLite2-City.mmdb && \
    chmod -R 755 ./share/GeoLite2-City.mmdb


#
# ---------------------------------------------------------
#
# NOTE: v1.32 is running bullseye, v1.33 and v1.34 are running bookworm
#
# The python3.N suffix must match the build stage's minor version: Unit embeds
# its own libpython and imports the venv copied from that stage, so a 3.12
# module cannot load a 3.13 site-packages. The patch levels differ on purpose
# and are safe to differ — this tag carries 3.13.8 against a venv built on
# 3.13.13 — because CPython holds the ABI and the lib/python3.13 path stable
# across a minor series. This is the pairing upstream runs.
FROM unit:1.34.2-python3.13
WORKDIR /code
SHELL ["/bin/bash", "-e", "-o", "pipefail", "-c"]
ENV PYTHONUNBUFFERED 1

# Install OS runtime dependencies.
# Note: please add in this stage runtime dependences only!
RUN apt-get update && \
    apt-get install -y --no-install-recommends --allow-downgrades \
    "chromium" \
    "chromium-driver" \
    "gettext-base" \
    "libpq-dev" \
    "libxmlsec1" \
    "libxmlsec1-dev" \
    "libxml2" \
    "ffmpeg" \
    "libssl-dev" \
    "libssl3" \
    "libjemalloc2" \
    && \
    rm -rf /var/lib/apt/lists/*

# Install MS SQL dependencies
RUN curl https://packages.microsoft.com/keys/microsoft.asc | tee /etc/apt/trusted.gpg.d/microsoft.asc && \
    curl https://packages.microsoft.com/config/debian/11/prod.list | tee /etc/apt/sources.list.d/mssql-release.list && \
    apt-get update && \
    ACCEPT_EULA=Y apt-get install -y msodbcsql18 && \
    rm -rf /var/lib/apt/lists/*

# Install Node.js 24.13.0 for standalone scripts with architecture detection and verification
ENV NODE_VERSION 24.13.0

RUN ARCH= && dpkgArch="$(dpkg --print-architecture)" \
    && case "${dpkgArch##*-}" in \
    amd64) ARCH='x64';; \
    ppc64el) ARCH='ppc64le';; \
    s390x) ARCH='s390x';; \
    arm64) ARCH='arm64';; \
    armhf) ARCH='armv7l';; \
    i386) ARCH='x86';; \
    *) echo "unsupported architecture"; exit 1 ;; \
    esac \
    && export GNUPGHOME="$(mktemp -d)" \
    && set -ex \
    && for key in \
    5BE8A3F6C8A5C01D106C0AD820B1A390B168D356 \
    C0D6248439F1D5604AAFFB4021D900FFDB233756 \
    DD792F5973C6DE52C432CBDAC77ABFA00DDBF2B7 \
    CC68F5A3106FF448322E48ED27F5E38D5B0A215F \
    8FCCA13FEF1D0C2E91008E09770F7A9A5AE15600 \
    890C08DB8579162FEE0DF9DB8BEAB4DFCF555EF4 \
    C82FA3AE1CBEDC6BE46B9360C43CEC45C17AB93C \
    108F52B48DB57BB0CC439B2997B01419BD92F80A \
    A363A499291CBBC940DD62E41F10027AF002F8B0 \
    ; do \
    { gpg --batch --keyserver hkps://keys.openpgp.org --recv-keys "$key" && gpg --batch --fingerprint "$key"; } || \
    { gpg --batch --keyserver keyserver.ubuntu.com --recv-keys "$key" && gpg --batch --fingerprint "$key"; } ; \
    done \
    && curl -fsSLO --compressed "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-$ARCH.tar.xz" \
    && curl -fsSLO --compressed "https://nodejs.org/dist/v$NODE_VERSION/SHASUMS256.txt.asc" \
    && gpg --batch --decrypt --output SHASUMS256.txt SHASUMS256.txt.asc \
    && gpgconf --kill all \
    && rm -rf "$GNUPGHOME" \
    && grep " node-v$NODE_VERSION-linux-$ARCH.tar.xz\$" SHASUMS256.txt | sha256sum -c - \
    && tar -xJf "node-v$NODE_VERSION-linux-$ARCH.tar.xz" -C /usr/local --strip-components=1 --no-same-owner \
    && rm "node-v$NODE_VERSION-linux-$ARCH.tar.xz" SHASUMS256.txt.asc SHASUMS256.txt \
    && ln -s /usr/local/bin/node /usr/local/bin/nodejs \
    && node --version \
    && npm --version \
    && rm -rf /tmp/*

# Copy ANTLR4 C++ runtime shared library (required by insightsql-parser at runtime)
# cmake installs to /usr/lib/x86_64-linux-gnu/ on Debian multiarch
COPY --from=insights-build /usr/lib/x86_64-linux-gnu/libantlr4-runtime.so* /usr/lib/x86_64-linux-gnu/
RUN ldconfig

# Install and use a non-root user.
RUN groupadd -g 1000 insights && \
    useradd -r -g insights insights && \
    chown insights:insights /code
USER insights

# Add the commit hash
ARG COMMIT_HASH
# Quoted with a default so an unpassed build-arg writes "unknown" rather than an
# empty file -- the footer then says so instead of rendering a blank commit.
RUN echo "${COMMIT_HASH:-unknown}" > /code/commit.txt

# Copy the Python dependencies and Django staticfiles from the insights-build stage.
COPY --from=insights-build --chown=insights:insights /code/staticfiles /code/staticfiles
COPY --from=insights-build --chown=insights:insights /python-runtime /python-runtime
ENV PATH=/python-runtime/bin:$PATH \
    PYTHONPATH=/python-runtime

# Install Playwright Chromium browser for video export (as root for system deps)
# Use cache mount for browser binaries to avoid re-downloading on every build
USER root
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN --mount=type=cache,id=playwright-browsers,target=/tmp/playwright-cache \
    PLAYWRIGHT_BROWSERS_PATH=/tmp/playwright-cache \
    /python-runtime/bin/python -m playwright install --with-deps chromium && \
    mkdir -p /ms-playwright && \
    cp -r /tmp/playwright-cache/* /ms-playwright/ && \
    chown -R insights:insights /ms-playwright
USER insights

# Copy the frontend assets from the frontend-build stage.
COPY --from=frontend-build --chown=insights:insights /code/frontend/dist /code/frontend/dist

# Ensure sourcemap-upload stage runs (the file itself is not needed in the final image).
COPY --from=sourcemap-upload /tmp/.sourcemaps-processed /tmp/.sourcemaps-processed

# Copy products.json from the frontend-build stage
COPY --from=frontend-build --chown=insights:insights /code/frontend/src/products.json /code/frontend/src/products.json

# Copy the GeoLite2-City database from the fetch-geoip-db stage.
COPY --from=fetch-geoip-db --chown=insights:insights /code/share/GeoLite2-City.mmdb /code/share/GeoLite2-City.mmdb

# Copy plugin transpiler (used by Django for site destinations/apps).
# pnpm stores packages in node_modules/.pnpm/, workspace node_modules contain symlinks there.
COPY --from=node-scripts-build --chown=insights:insights /code/node_modules /code/node_modules
COPY --from=node-scripts-build --chown=insights:insights /code/common/plugin_transpiler/dist /code/common/plugin_transpiler/dist
COPY --from=node-scripts-build --chown=insights:insights /code/common/plugin_transpiler/node_modules /code/common/plugin_transpiler/node_modules
COPY --from=node-scripts-build --chown=insights:insights /code/common/plugin_transpiler/package.json /code/common/plugin_transpiler/package.json

# Add in custom bin files and Django deps.
COPY --chown=insights:insights ./bin ./bin/
# Persons SQL migration files (read by apply_persons_migrations management command for hobby deploys)
COPY --chown=insights:insights ./rust/persons_migrations ./rust/persons_migrations/
COPY --chown=insights:insights manage.py manage.py
COPY --chown=insights:insights insights insights/
COPY --chown=insights:insights common/scriptvm common/scriptvm/
COPY --chown=insights:insights common/migration_utils common/migration_utils/
COPY --chown=insights:insights products products/

# Validate video export dependencies. The puppeteer half of this check went with
# nodejs/src/scripts — see the node-scripts-build stage — so what is left is
# what this image still carries.
RUN ffmpeg -version
RUN /python-runtime/bin/python -c "import playwright; print('Playwright package imported successfully')"
RUN /python-runtime/bin/python -c "from playwright.sync_api import sync_playwright; print('Playwright sync API available')"

# Setup ENV.
ENV NODE_ENV=production \
    CHROME_BIN=/usr/bin/chromium \
    CHROME_PATH=/usr/lib/chromium/ \
    CHROMEDRIVER_BIN=/usr/bin/chromedriver \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Expose container port and run entry point script.
EXPOSE 8000

# Expose the port from which we serve OpenMetrics data.
EXPOSE 8001
COPY unit.json.tpl /docker-entrypoint.d/unit.json.tpl
# nosemgrep: dockerfile.security.last-user-is-root.last-user-is-root
USER root
CMD ["./bin/docker"]
