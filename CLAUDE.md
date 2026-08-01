# Hanzo Insights — served Django monolith (RESTORED) + native Go observability

## Status

The served **Django** monolith is **RESTORED** and published to
`ghcr.io/hanzoai/insights` for the `insights.hanzo.ai` deploy (K8s pulls ghcr).
`manage.py` + `bin/docker*` serve again (real management + server/worker/migrate
startup), IAM-OIDC login is wired, and the surface is Hanzo-branded. It runs on
Hanzo SQL (`insights-sql`), Hanzo KV (`KV_URL`, RESP wire — never `REDIS_URL`;
`data_stores.py` normalizes kv://→RESP at the driver boundary), the
`hanzoai/stream` Kafka-shim over NATS, and Hanzo Datastore (Datastore).

Alongside it, the native-Go `hanzoai/cloud` binary serves the observability API:

- **`/v1/evals/*`** — datasets, dataset-items, evaluators, score-configs,
  scores, **traces**, runs. Org-scoped by the IAM `owner` claim (one tenancy).
  LIVE: `GET https://api.hanzo.ai/v1/evals/health` → `200`; unauth
  `/v1/evals/datasets` → `403` (org-gated). Source: `hanzoai/cloud/clients/eval`.
- **`/v1/analytics/*`** — the LLM/product analytics lens (overview, timeseries,
  realtime, top/*, llm/*). Read-only per-org Datastore warehouse. Consumed by
  `console2` `AnalyticsModule`. Backend `cloud/clients/analytics` — see GAP below.

LLM telemetry (traces / observations / scores) is written by the **AI gateway**
(`hanzoai/ai` → `object/observability.go`) into the Datastore warehouse
(`hanzo.traces`, `hanzo.observations`, `hanzo.scores`) and read
back through `/v1/evals` + `/v1/analytics`.

The Django `manage.py` and every serving entrypoint (`bin/docker`,
`bin/docker-server`, `bin/docker-worker`, `bin/docker-worker-celery`,
`bin/docker-migrate`) run for real again (restored from pre-`175eace7b`). The
retirement of the served surface (`175eace7b`) is reversed; the ghcr publisher
(`.github/workflows/container-images-cd.yml`, deleted in `657c5fbcef`) is
restored so CI builds the monolith `Dockerfile` and pushes to
`ghcr.io/hanzoai/insights`.

## Django → Go observability map (both planes live)

| Django surface | Go replacement | Status |
|---|---|---|
| LLM analytics (`products/llm_analytics`, `api/llm_proxy`) | `/v1/evals/*` + `/v1/analytics/llm/*` | **evals LIVE**; analytics/llm backend = GAP (below) |
| Evals / datasets / scores | `/v1/evals/{datasets,dataset-items,evaluators,score-configs,scores,traces,runs}` | **LIVE** (`cloud/clients/eval`) |
| Trace/observation query | `/v1/evals/traces` (+ `hanzo.traces`/`hanzo.observations`) | **LIVE** |
| Product / web / revenue / marketing / customer analytics, insights, dashboards, funnels, retention, trends | `/v1/analytics/{overview,timeseries,realtime,top/*}` | **GAP** — backend not shipped (below) |
| Org / user / project / `personal_api_keys` / `login` | **Hanzo IAM** (`hanzo.id`, OIDC `owner`) + `/v1/projects` | covered by IAM (auth/tenancy, not observability) |
| Data warehouse / data_modeling / batch_exports | Datastore warehouse (`hanzoai/datastore`) direct | substrate retained |
| Feature flags, early access, surveys, experiments, product tours, error tracking, CDP, notebooks, groups, user interviews | — | **SUNSET** — not ported; distinct products, not "observability". Were already dead in prod (Django `502`). Do NOT silently assume replaced. |
| Session replay | — | **NOT sunset.** The ingest→S3→warehouse→playback pipeline is live and proven; only the write and read doors are unwired. See the replay section below before touching it. |

### Honest GAPs (must port before claiming full parity)
1. **`cloud/clients/analytics` is NOT shipped.** `console2` allow-lists and calls
   `/v1/analytics/{overview,timeseries,realtime,llm/overview}` but the cloud
   subsystem does not exist → `GET /v1/analytics/health` → `404`. The LLM-lens
   read path is therefore not yet live. This is a **pre-existing** gap (Django
   product-analytics was already `502`), owned by the cloud lane — not created by
   this retirement. Until it lands, only `/v1/evals/*` serves observability reads.
2. **Legacy product-analytics / flags / surveys / experiments** are formally
   **sunset**, not migrated. If any is still required, it must be re-platformed
   deliberately. Session replay is NOT in this list — see below.

## Ingest is NATIVE for analytics — the replay tier is alive, not gone

`insights-capture`, `insights-kafka` and `insights-kv` are gone. **`insights-plugin`
is NOT** — it is running, and it is the session-replay blob ingester. Analytics
events are ingested by the **cloud Go binary**, not by the Rust capture service:

```
insights.hanzo.ai/{e,/e/,v1/e,/v1/e/,batch,capture}   (ingress prio 150)
  → middleware insights-cloud-ingest-rewrite (fixed replacePath)
  → service api-hanzo-ai → cloud.hanzo.svc:8000
  → POST /v1/insights/e → cloud/clients/analytics insightsIngest → hanzo.events
```

Tenant is resolved SERVER-SIDE by `captureTenant`, in this order: validated
principal → presented project key (`cloud.OrgForKey`) → brand host. It fails
**CLOSED** on a presented-but-unresolvable key, and deliberately does NOT fall
back to the brand host in that case, so a bogus key cannot borrow the host's
org. Consequence when testing: verify anonymously (no `api_key`) to exercise the
brand-host path, or a valid-looking key will make a working route look broken.

`/v1/e` was NOT on this router until 2026-07-26 — it fell to the Django
catch-all, which answers **403 HTML**, so every event sent to the path our own
SDK posts to was discarded silently. When debugging a 403 here, read the BODY:
Django answers HTML, cloud answers
`{"status":403,"error":"valid bearer or a recognized brand host required"}`.

`POST /v1/ai` is likewise unrouted and falls through to Django.

### Session replay: the pipeline is LIVE. Only the two doors are missing.

Earlier revisions of this file said replay "has never worked", that
`session_replay_events` has 0 rows, that `kafka:9092` does not resolve and that
`POST /v1/s` 502s off a dead capture service. **All four are false**, and
believing them costs hours. Re-probed and reproduced twice, independently:

- `kafka:9092` resolves. `Service kafka/hanzo` selects
  `app.kubernetes.io/name=cloud`; the endpoint is the cloud pod, which mounts
  `hanzoai/kafka` `protocol.Broker` over embedded JetStream. `preflight.kafka` is
  **true**, and so are datastore/db/object_storage.
- The chain runs end to end: produce to `session_recording_snapshot_item_events`
  → `blob_ingester_consumer_v2` in **insights-plugin** → snappy block in S3 →
  `datastore_session_replay_events` → `kafka_session_replay_events` →
  `session_replay_events_mv` → sharded → Distributed → list and playback. Proven
  by producing a message and reading its rrweb back out of the block.
- `/v1/s` does not 502. There is **no `/v1/s` router**, no `insights-capture`
  Service, Deployment or App CR. `/s`, `/s/`, `/v1/s` and `/v1/s/` all answer
  **403 from the Django catch-all** — same data loss, different mechanism.
- 24 Kafka-engine tables, not 23. The "Temporarily pause scheduling" lines are
  idle-topic backoff, not failure.

Two doors are missing, and neither is a bug in the pipeline:

**Write door (a product decision).** Nothing accepts the browser's POST. The
canonical producer is `rust/capture` in `CaptureMode::Recordings` —
`rust/capture/src/router.rs` serves `/v1/s` and `events/recordings.rs` emits
exactly the format the ingester consumes. It is not built (no job in
`.hanzo/workflows/`) and has no image, workload or route. Reviving it is the
cheap option; folding replay into cloud is ~715 LoC of `$snapshot` →
`$snapshot_items` transform that `apps/analytics` does not have; writing to the
ingestion topic from Django is cheap now and wrong forever — `api/capture.py`
says so itself.

**Read door (config).** `RECORDING_API_URL` is empty on insights-web, so
`insights/storage/recordings/block_storage.py:317` raises `RuntimeError` and
playback fails even though the data exists. insights-plugin also has no Service.
Both are universe changes.

**Before giving insights-plugin a Service, know what it exposes.** It serves the
recording API: block reads, `DELETE .../recordings/:session_id` and
`POST .../recordings/bulk_delete`, with `team_id` read straight from the path and
never verified. Those routes now refuse a caller that does not present
`INTERNAL_API_SECRET` (an empty secret denies), so a Service must ship **with the
secret provisioned from KMS on both insights-plugin and insights-web**, or
playback 401s. Keep it ClusterIP; that is not a boundary against other pods, but
it should not be an Ingress either.

The `ingress-routes` CM hot-reloads via file-provider fsnotify — NEVER
`rollout restart deploy/ingress` (ACME/TLS outage). Routes live in
`universe infra/k8s/ingress/routes.yaml`; change them by pushing to universe
main, never by `kubectl patch` (Hanzo CD selfHeal reverts within ~90s).

## `/` is the marketing landing page when signed out

Anonymous `/` used to bounce straight to SSO, so the product had no public face.
`insights/urls.py:root` now branches: `home` (the SPA, unchanged) for an
authenticated user, `templates/landing.html` for everyone else.

Its CTAs point OUT to `hanzo.ai/pricing` on purpose — **`GET /api/billing` is
404 in this deployment**, so an in-app upgrade funnel would dead-end. There is
also no Insights SKU in `@hanzo/plans` (its 11 tiers are compute), so no plan
copy is written in the template; minting that SKU is a pricing decision, not a
template edit. Tests in `insights/test/test_landing.py` fail the build if
`/api/billing` or any third-party asset host reappears on the page (prod refuses
third-party CDNs and fails SILENTLY).

## `preflight.cloud` is FALSE here — and that drove a real bug

`is_cloud()` is `CLOUD_DEPLOYMENT in (EU, US, DEV, E2E)`, an upstream
multi-region SaaS concept we do not have, so it reads false on our own hosted
deploy. Upstream's `move-to-cloud` PayGateMini variant keys off exactly that, so
insights.hanzo.ai advertised "Move to Insights Cloud" **to its own paying
users**. That variant is deleted: the paywall now has one path
(add-card / contact-sales) regardless of who hosts. Before adding any behaviour
behind `is_cloud()`, check it is not this same trap.

### Clean single-`insights_` table names (double `insights_insights*` dropped)

The debrand left three CDP tables double-named (`insights_insightsfunction`,
`insights_insightsflow`, `insights_insightsfunctiontemplate`). Migration
`1019_rename_insights_tables_clean` (`AlterModelTable`, runs LAST so it's safe
for fresh + live) + `Meta.db_table` on the 3 models renamed them to
`insights_function` / `insights_flow` / `insights_function_template`. Plugin SQL
queries the clean names (`plugin sha-fe74083`). NOTE: `manage.py migrate` is a
SEPARATE step — `bin/docker-server` (web) does NOT migrate on boot; run
`manage.py migrate` in the web pod after a schema bump.

## Live deploy (do-sfo3-hanzo-k8s / ns hanzo)

- `ghcr.io/hanzoai/insights:<FULL-40-CHAR-SHA>` — built by the NATIVE pipeline
  in `.hanzo/workflows/deploy.yml` (git.hanzo.ai push → in-cluster act_runner →
  docker build → GHCR), tagged by **commit sha only**, never semver: a re-pushed
  tag means two digests behind one name. `container-images-cd.yml` is
  neutralized; GitHub Actions is a mirror and builds nothing.
- `insights-web` (Django) + `insights-worker` (Celery) — **LIVE** on
  `insights.hanzo.ai`. Operator App CRs in `hanzoai/universe`
  (`infra/k8s/operator/crs/insights-*`, `infra/k8s/ingress/routes.yaml`) pin the
  sha. Env: `DATABASE_URL` (`insights-sql`), `KV_URL` (`kv://kv.hanzo.svc:6379`
  — the SHARED fleet KV; the dedicated `insights-kv` is gone), the
  `hanzoai/stream` shim, Datastore (`DATASTORE_DATABASE=insights`). Probes are
  `tcpSocket:8000` (Django rejects kubelet `httpGet` Host under restricted
  `ALLOWED_HOSTS`; the CRD probe schema has no `httpHeaders`).
- The insights workloads are `insights-web`, `insights-worker`, `insights-sql`,
  **`insights-plugin`** and `insights-livestream`. The `insights-capture` /
  `-kafka` / `-kv` CRs were deleted; `-plugin` was not. Earlier revisions of this
  file claimed only three exist and told you not to go looking for the plugin —
  that is wrong, and it is the ingester replay depends on. Enumerate the
  namespace rather than trusting this list.
- Rollout is verified BY IMAGE, never by `readyReplicas` alone: gate on
  `updatedReplicas == replicas` with the old ReplicaSet at zero, and exec a pod
  selected by its image. Reading a pod mid-rollout returns the OLD build and
  makes a shipped fix look absent (or an absent one look shipped).

## Auth / tenancy

Tenancy is the IAM `owner` claim = the org (one tenancy). All Go observability
(`/v1/evals`, `/v1/analytics`) scopes exclusively by `c.Org()`; secrets via KMS.

## Django migrations — squashed to a clean baseline (v1.52.0)

The Postgres/Django migrations were **squashed to a fresh `0001_initial` per app**
(v1.52.0, `6e3d624ac4`). ~1050 upstream-era migrations across 21 apps collapsed to
one initial each — no customers, forward-only. This ended the old
"never-rewrite-migration-internals / double `insights_insightsfunction` names are
correct plumbing" era: table names are now clean natively (`insights_function`),
there is no doubled-name history, and `makemigrations` is the source of truth.

Three insights migrations carry what `makemigrations` can't express (all captured
verbatim from the live DB so a fresh migrate hits EXACT schema parity):

- `0001_initial` — 5 pg extensions (`pg_trgm`, `btree_gin`, `btree_gist`,
  `ltree`, `intarray`) prepended; `atomic = False` (custom
  `UniqueConstraintByExpression` emits `CREATE INDEX CONCURRENTLY`).
- `0002_managed_tables` — the 18 `managed=False` tables (`Person`/`Group`/
  `PersonOverride`/`CohortPeople`/`Role` families + task/workflow) via `RunSQL`;
  depends on all app leaves so FK targets exist.
- `0003_special_indexes` — 15 `RunSQL`-added feature columns + 20 special indexes
  (GIN jsonb, partial `WHERE`, unique-partial integrity), all `IF NOT EXISTS`.

Helper modules inside migration dirs (`insights/rbac/migrations/rbac_*_migration.py`)
are imported by app code — they are NOT migrations; never delete them in a squash
(the delete filter must match `class Migration` only). Datastore
(`insights/datastore/migrations/`, 225 files) and async migrations
(`insights/async_migrations/migrations/`, 11) are SEPARATE systems — untouched by
the squash.

### Guard + adoption
- **Fresh install / CI guard**: `manage.py migrate` from zero on a scratch
  Postgres must reach head clean (validated: 246/246 tables, 0 missing columns,
  index parity).
- **Adoption on an EXISTING DB (e.g. live `insights.hanzo.ai`)**: the squash does
  NOT change the schema, so do NOT re-migrate destructively. Run a **`--fake`
  adoption** when moving that DB to a squash-containing image:
  `manage.py migrate <app> zero --fake` for each app (clears records, keeps
  tables) then `manage.py migrate --fake` (re-records the new initials as
  applied). Live intentionally stays on `1.51.10` (identical schema, old history);
  the operator CR pins an explicit tag so it won't auto-move to a squash image
  without this step.
