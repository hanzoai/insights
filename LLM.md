# Hanzo Insights — served Django monolith (RESTORED) + native Go observability

## Status

The served **Django** monolith is **RESTORED** and published to
`ghcr.io/hanzoai/insights` for the `insights.hanzo.ai` deploy (K8s pulls ghcr).
`manage.py` + `bin/docker*` serve again (real management + server/worker/migrate
startup), IAM-OIDC login is wired, and the surface is Hanzo-branded. It runs on
a real Postgres (`insights-sql`), Valkey (`REDIS_URL`), Kafka and ClickHouse.

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
- `insights-web` (Django) + `insights-worker` (Celery) — Service CRs to be
  restored in `hanzoai/universe` (`infra/k8s/operator/crs/insights-*`,
  `infra/k8s/ingress/routes.yaml`) pointing at the ghcr image. Needs
  `DATABASE_URL` (`insights-sql`), `REDIS_URL` (`insights-kv`/Valkey), Kafka,
  ClickHouse, and Django `migrate` (`bin/docker` runs it on boot). Deploy is
  gated — not applied by this change.
- Retained operator `Service` CRs: `insights-capture`, `insights-kafka`,
  `insights-kv`, `insights-plugin`, `insights-sql`.

## Auth / tenancy

Tenancy is the IAM `owner` claim = the org (one tenancy). All Go observability
(`/v1/evals`, `/v1/analytics`) scopes exclusively by `c.Org()`; secrets via KMS.
