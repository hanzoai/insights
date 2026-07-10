# Hanzo Insights — server-side feature-flag evaluation (Rust)

High-performance, Kafka-free server-side flag evaluation, vendored from the
**MIT-licensed** PostHog `rust/feature-flags` service and adapted to the Hanzo stack.
Serves `/flags`, `/decide`, `/flags/definitions`, `/api/feature_flag/local_evaluation`
with full property matching, sha1 rollout hashing, static + dynamic + behavioral
cohorts, holdouts, and hashkey overrides.

## Provenance & license

- Source: `~/work/posthog/posthog/rust` (PostHog OSS). License: **MIT**
  (`rust/LICENSE`, root `LICENSE`). **Nothing** was taken from `ee/`.
- MIT headers/attribution left intact. Copyright notice preserved in `rust/LICENSE`.
- Registry policy: builds/publishes under `ghcr.io/hanzoai/*` (Hanzo), never mixed.

## What was vendored (this pass)

Scoped as **FOUNDATION**: get the eval hot path building + serving + unit-tested.
The fork's `rust/` workspace `members` list is pruned to exactly this subgraph; the
legacy PostHog-port crates remain on disk but are excluded from the active build until
they too are adapted. This keeps ONE internally-consistent version graph (all from a
single upstream snapshot) with zero skew against the legacy port.

Members (18): `feature-flags`, `hypercache-server`, and `common/{alloc, cache,
compression, continuous_profiling, cookieless, database, geoip, health, hypercache,
lifecycle, limiters, liveness, metrics, redis, s3, types}`.

Hot request path is **Kafka-free**: persons from Postgres, config from HyperCache
(Redis → S3 fallback), auth from a Redis-cached token.

## Stack adaptations

1. **S3 → hanzoai/s3** (SeaweedFS, S3-compatible). No code change required — the seam
   was already abstracted. `OBJECT_STORAGE_ENDPOINT` (`config.object_storage_endpoint`)
   flows into `HyperCacheConfig.s3_endpoint`, which sets the aws-sdk-s3 `endpoint_url`
   **and** `force_path_style(true)` (`common/hypercache/src/lib.rs::HyperCacheReader::new`).
   Point it at the hanzoai/s3 endpoint + `OBJECT_STORAGE_BUCKET` / `OBJECT_STORAGE_REGION`.
2. **Creds → Hanzo KMS.** The aws-sdk default credential chain reads
   `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` from the process env. In the Hanzo K8s
   stack these are injected from KMS (never hardcoded). No code change — deploy-time
   env injection from KMS → default chain. ADC is the fallback when unset.
3. **Personal-API-key validation → Hanzo IAM** (`src/api/hanzo_iam.rs`, new). Config-gated
   by `PERSONAL_API_KEY_BACKEND` (`postgres` default = upstream behavior; `iam` = Hanzo).
   The `iam` path validates via RFC 7662 introspection at
   `POST {HANZO_IAM_URL}/v1/iam/oauth/introspect` (Hanzo IAM `controllers.IntrospectToken`)
   and maps the response onto the same `TokenAuthData::Personal` the Postgres loader
   produces, so the downstream scope/org checks are identical for both backends. The
   single swap point is `api::auth::validate_personal_api_key_with_scopes_for_team`.
   **Project (secret `phs_*`) tokens are untouched** — they stay Redis-cached team lookups.

## Kafka removed (intentional, per scope)

- Deleted `src/bin/flags_cache_builder.rs`; removed the `flags-cache-builder` feature +
  `[[bin]]`; dropped `common-kafka` / `rdkafka` / optional `tokio-util` deps.
- `flags-consumer` crate NOT vendored.
- The library + server default build is fully kafka-free; the only remaining cfg-gated
  path (`cache_writer.rs`) is now gated on `warm-flags-cache` alone.

## Build / test status

- `cargo build --workspace`: **GREEN** (only 5 pre-existing upstream `tokio_retry::spawn`
  deprecation warnings, none from Hanzo changes).
- `cargo build -p feature-flags --features warm-flags-cache`: **GREEN** (S3 warmer bin).
- Unit tests **GREEN** (no infra):
  - `feature-flags` parity: 89 passed / 0 failed — property matching (regex, lookahead,
    backtracking-limit, exact/relative date), relative-date parsing, sha1 `calculate_hash`
    rollout, and the 4 new `hanzo_iam` mapping tests. These prove sha1 rollout parity.
  - support crates: `common-hypercache` 48, `limiters` 50, `common-cache` 24,
    `common-cookieless` 20, `common-compression` 18, `health` 10, `common-metrics` 4,
    `common-s3` 3 — all 0 failed.
- **Infra-gated** (vendored intact; run in CI with the compose stack, NOT a regression):
  - `tests/` integration + DB-backed `--lib` tests → need Postgres + Redis + the Insights
    schema (upstream uses Django `setup_test_environment`).
  - `common-s3` / `common-hypercache` `integration_tests` → need a real S3/MinIO endpoint.
  - `common-geoip` tests → need `GeoLite2-City.mmdb` (MaxMind, license-restricted, absent
    upstream too, CI-downloaded).

## Follow-on (not in this pass)

- **Definitions materializer**: replace the Kafka `flags-cache-builder` with a materializer
  that builds flag/cohort definitions from Insights Postgres (+ Hanzo IAM for org scoping)
  and writes them into HyperCache (Redis + hanzoai/s3). The gated `warm-flags-cache` S3
  writer is the reusable half of this.
- **NatsSink over hanzoai/stream**: cache invalidation + incremental rebuild driven by
  hanzoai/stream (NATS over hanzoai/pubsub) instead of raw Kafka CDC.
- **IAM identity mapping**: `hanzo_iam::stable_user_id` is a deterministic placeholder
  (`sha256(sub)` low 31 bits) used only for PAK last-used debounce + log correlation, never
  for authorization. Real IAM-subject → Insights-user mapping, and reconciling the IAM
  `aud` org identifier with `team.organization_id`, are still open.
- Live-IAM integration test for the `iam` backend (mapping fn is unit-tested; the HTTP
  round-trip is not exercised against a running IAM).

## Attack surface (for red)

- **IAM introspection (`api::hanzo_iam`)**: fail-closed on transport/status/decode errors
  (returns `FlagError::Internal` → not treated as a valid key). Confirm: no way to coerce
  `active:true` with an empty/insufficient `scope` past `validate_personal_key_metadata`
  (an empty scope list is an explicit deny; wildcard `*` grants). Confirm the org check —
  `org_ids` come from introspection `aud`; until `aud` ↔ `team.organization_id` are
  reconciled, an `iam`-backend deployment could over- or under-scope local_evaluation. It
  is **off by default** (`postgres`), so no live surface changes unless opted in.
- **`stable_user_id` collisions**: 31-bit space → birthday collisions possible; it is not
  security-load-bearing (authz is scope + org), but confirm nothing downstream treats it as
  a unique principal.
- **Cache poisoning**: the auth-token read-through cache is keyed on `sha256(key)` and is
  shared by both backends; a backend flip reuses cached entries — flush the auth-token
  Redis namespace on cutover.
- **S3 path-style / endpoint**: with `OBJECT_STORAGE_ENDPOINT` set, `force_path_style(true)`
  is forced; verify SSRF posture (endpoint is operator-config, not request-derived).
- Kafka removal means the cache is only as fresh as whatever materializes HyperCache; with
  no materializer yet, stale/empty definitions degrade to the Postgres fallback path.
