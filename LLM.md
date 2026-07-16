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

Event **ingestion** substrate stays live (it is not the Django app):
`insights-capture` (Rust), `insights-plugin` (Node), `insights-kafka`,
`insights-kv`, `insights-sql`, `datastore` (ClickHouse). NOTE: with the Django
query layer gone these ingest without a product-analytics reader — a follow-up
decommission decision, out of scope for retiring the Django app.

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

## Debrand / find-replace — NEVER rewrite migration internals

`insights/migrations/` and `insights/clickhouse/migrations/` are OFF-LIMITS to
any `posthog`→`insights` (or any brand) find-replace / debrand pass. Migration
files are immutable, cross-referenced plumbing whose identifiers are NOT
user-facing branding:

- `dependencies` / `run_before` entries key on another migration's **filename**;
- `RunSQL` hardcodes Postgres table / index / constraint names — including
  Django-generated FK/unique constraint names whose 8-hex hash is derived from
  the **table name** (`names_digest(table, *cols)`), so renaming the table part
  of a hardcoded name without recomputing the hash points it at a name that
  never exists on a fresh DB;
- state operations (`AddField`, `AddConstraint`, `RemoveField`, …) key on the
  model **state name**, not the class's brand.

A blanket rename corrupts all three. That is exactly what #52 / `203fdd70b`
("strangle Redis", actually a wholesale `posthog`→`insights` find-replace) did:
a fresh `manage.py migrate` fell from 1018/1018 to hard failures — broken
dependency identifiers, constraint hashes computed for `posthog_*` tables, a
split `HogFunction`→{`InsightsFunction` create, `customfunction` refs,
`insights_function` table} and `HogFlow`→{`InsightsFlow`, `customflow`} rename,
plus a stale `role`/`role_id_legacy` field ref. Fixed on
`fix/migrations-consistency`.

Rule: debrand only user-facing strings (templates, UI, docs, API labels). Leave
every migration identifier alone — migrations only need to be INTERNALLY
consistent with the `insights`-form models, not brand-clean. A migration whose
table is `insights_insightsfunction` or `customflow_templates` is correct; the
name is invisible plumbing.

Guard before shipping migration changes: `manage.py migrate` on a scratch
Postgres must reach the last migration (currently `1018`) clean. Two fast
static checks catch the corruption classes without a full DB run: (1) every
`dependencies`/`run_before` entry resolves to a real migration file; (2) a
state-only `ProjectState` build over all migrations (catches dangling
`model_name`/field refs). NOTE: the debrand-era `posthog/`→`insights/` file
rename (`071e2d369a`) also DELETED `insights/models/exchange_rate/historical.csv`
without re-adding it, so `insights/models/exchange_rate/sql.py` opens a missing
file — the ClickHouse `0101/0102_*_exchange_rates` migrations need it restored
from history (`git show 071e2d369a^:posthog/models/exchange_rate/historical.csv`).
