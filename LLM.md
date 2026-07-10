# Hanzo Insights — RETIRED (Django decommissioned)

## Status

The legacy **Django** served surface is **RETIRED**. There is now
exactly **ONE observability way**, served natively (Go) by the `hanzoai/cloud`
binary:

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

The Django `manage.py` and every Django serving entrypoint (`bin/docker`,
`bin/docker-server`, `bin/docker-worker`, `bin/docker-worker-celery`) are
neutered — they refuse to run and point here. No backwards compat.

## Django → Go retire map (no capability dropped silently)

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

## Live deploy (do-sfo3-hanzo-k8s / ns hanzo) — post-retire

- `insights-web` (Django) — **removed** (Service CR `NotFound`; host `502`).
- `insights-worker` (Celery) — **removed** (Service CR `NotFound`).
- Retained operator `Service` CRs: `insights-capture`, `insights-kafka`,
  `insights-kv`, `insights-plugin`, `insights-sql`.
- Declared state persisted in `hanzoai/universe` (`infra/k8s/insights/*`,
  `infra/k8s/operator/crs/insights-*`, `infra/k8s/ingress/routes.yaml`,
  `infra/k8s/monitoring/insights-servicemonitor.yaml`) with the web/worker/route
  entries deleted so the operator never resurrects Django.

## Auth / tenancy

Tenancy is the IAM `owner` claim = the org (one tenancy). All Go observability
(`/v1/evals`, `/v1/analytics`) scopes exclusively by `c.Org()`; secrets via KMS.

## Feature flags (Rust)

Server-side feature-flag **evaluation** service, vendored MIT from PostHog
`rust/feature-flags` and adapted to the Hanzo stack (hanzoai/s3, Hanzo KMS creds,
Hanzo IAM personal-key validation; Kafka cache-builder deferred). Serves `/flags`,
`/decide`, `/flags/definitions`, `/api/feature_flag/local_evaluation`. Authoritative
record — what was vendored, the adaptation seams, build/test status, follow-on, and
attack surface — lives in **`rust/feature-flags/LLM.md`**.
