# Hanzo Insights — served Django monolith (RESTORED) + native Go observability

## Status

The served **Django** monolith is **RESTORED** and published to
`ghcr.io/hanzoai/insights` for the `insights.hanzo.ai` deploy (K8s pulls ghcr).
`manage.py` + `bin/docker*` serve again (real management + server/worker/migrate
startup), IAM-OIDC login is wired, and the surface is Hanzo-branded. It runs on
Hanzo SQL (`insights-sql`), Hanzo KV (`KV_URL`, RESP wire — never `REDIS_URL`;
`data_stores.py` normalizes kv://→RESP at the driver boundary), the
`hanzoai/stream` Kafka-shim over NATS, and Hanzo Datastore (ClickHouse).

Alongside it, the native-Go `hanzoai/cloud` binary serves the observability API:

- **`/v1/evals/*`** — datasets, dataset-items, evaluators, score-configs,
  scores, **traces**, runs. Org-scoped by the IAM `owner` claim (one tenancy).
  LIVE: `GET https://api.hanzo.ai/v1/evals/health` → `200`; unauth
  `/v1/evals/datasets` → `403` (org-gated). Source: `hanzoai/cloud/clients/eval`.
- **`/v1/analytics/*`** — the LLM/product analytics lens (overview, timeseries,
  realtime, top/*, llm/*). Read-only per-org ClickHouse warehouse. Consumed by
  `console2` `AnalyticsModule`. Backend `cloud/clients/analytics` — see GAP below.

LLM telemetry (traces / observations / scores) is written by the **AI gateway**
(`hanzoai/ai` → `object/observability.go`) into the ClickHouse warehouse
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
| Data warehouse / data_modeling / batch_exports | ClickHouse warehouse (`hanzoai/datastore`) direct | substrate retained |
| Feature flags, early access, surveys, experiments, product tours, session replay, error tracking, CDP, notebooks, groups, user interviews | — | **SUNSET** — not ported; distinct products, not "observability". Were already dead in prod (Django `502`). Do NOT silently assume replaced. |

### Honest GAPs (must port before claiming full parity)
1. **`cloud/clients/analytics` is NOT shipped.** `console2` allow-lists and calls
   `/v1/analytics/{overview,timeseries,realtime,llm/overview}` but the cloud
   subsystem does not exist → `GET /v1/analytics/health` → `404`. The LLM-lens
   read path is therefore not yet live. This is a **pre-existing** gap (Django
   product-analytics was already `502`), owned by the cloud lane — not created by
   this retirement. Until it lands, only `/v1/evals/*` serves observability reads.
2. **Legacy product-analytics / flags / replay / surveys / experiments** are
   formally **sunset**, not migrated. If any is still required, it must be
   re-platformed deliberately.

## What is retained (NOT Django — separate concerns)

Event **ingestion** substrate is LIVE and proven end-to-end (it is not the
Django app): `insights-capture` (Rust), `insights-plugin` (Node),
`insights-kafka`, `insights-kv`, `insights-sql`, `datastore` (ClickHouse).
Proven path: `POST https://insights.hanzo.ai/v1/e` → `200` → capture → kafka →
plugin → ClickHouse `events`.

### Ingest is clean `/v1/*` — NO PostHog `/i/v0` cruft

We own capture AND the SDK, so ingest is `/v1/*` like every other Hanzo API.
The Rust capture router serves exactly (forward-only; the legacy
`/i/v0/e`,`/e`,`/batch`,`/track`,`/engage`,`/capture`,`/s`,`/i/v0/ai` paths were
REMOVED — do not re-add):

- `POST /v1/e`  — events (single OR batch array; 20MB body limit)
- `POST /v1/s`  — session recordings
- `POST /v1/ai` — AI/LLM events

Ingress: `insights.hanzo.ai` + `insights-app.hanzo.ai` route `PathPrefix(/v1)`
(priority 100) → capture service; catch-all (priority 1) → Django web. ONE
`/v1` router per host in `universe infra/k8s/ingress/routes.yaml` (the old
per-path `-batch`/`-capture`/`-e` routers are gone; a couple of dead *service*
defs may linger at the bottom of routes.yaml — harmless, sweep on next pass).
The `ingress-routes` CM hot-reloads via file-provider fsnotify — NEVER
`rollout restart deploy/ingress` (ACME/TLS outage).

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

- `ghcr.io/hanzoai/insights:<VERSION>` (served monolith) — published by
  `container-images-cd.yml` on a `v*` tag push (e.g. `v1.51.4`), also
  `:sha-<sha>`. Deploy pins `kubernetes.io/arch: amd64`.
- `insights-web` (Django) + `insights-worker` (Celery) — **LIVE** on
  `insights.hanzo.ai` (v1.51.8). Operator App CRs in `hanzoai/universe`
  (`infra/k8s/operator/crs/insights-*`, `infra/k8s/ingress/routes.yaml`) point at
  the ghcr image. Env: `DATABASE_URL` (`insights-sql`), `KV_URL`
  (`kv://insights-kv:6379`, never `REDIS_URL`), the `hanzoai/stream` shim,
  Datastore. Migrations run current on boot (1018/1018 postgres). Probes are
  `tcpSocket:8000` (Django rejects kubelet `httpGet` Host under restricted
  `ALLOWED_HOSTS`; the CRD probe schema has no `httpHeaders`).
- Retained operator `Service` CRs: `insights-capture`, `insights-kafka`,
  `insights-kv`, `insights-plugin`, `insights-sql`.

## Auth / tenancy

Tenancy is the IAM `owner` claim = the org (one tenancy). All Go observability
(`/v1/evals`, `/v1/analytics`) scopes exclusively by `c.Org()`; secrets via KMS.

## Django migrations — squashed to a clean baseline (v1.52.0)

The Postgres/Django migrations were **squashed to a fresh `0001_initial` per app**
(v1.52.0, `6e3d624ac4`). ~1050 PostHog-era migrations across 21 apps collapsed to
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
(the delete filter must match `class Migration` only). ClickHouse
(`insights/clickhouse/migrations/`, 225 files) and async migrations
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
