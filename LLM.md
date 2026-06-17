# Hanzo Insights

## Overview

Product analytics and feature flags. Multi-tenant IAM integration.

**Upstream**: [PostHog](https://github.com/PostHog/posthog) (MIT). Branded as **Hanzo Insights**.

## Tech Stack

- **Backend**: Python (Django), Rust (capture service), Node.js (plugin server)
- **Frontend**: TypeScript (React)
- **Database**: PostgreSQL, ClickHouse (via hanzoai/datastore), Valkey (Redis)
- **Streaming**: Kafka (via hanzoai/stream)
- **Auth**: Hanzo IAM (hanzo.id) OIDC SSO via social-auth

## Build & Run

```bash
# Frontend
pnpm install && pnpm build

# Backend
uv sync && python manage.py runserver
```

## Multi-Tenant Architecture

- IAM OIDC login extracts `owner` claim from userinfo (Casdoor format)
- `insights/api/iam_org_pipeline.py` maps org slug -> Insights Organization
- Auto-creates Organization, default Team, and OrganizationMembership on login
- All data (events, dashboards, insights, flags) scoped to Organization->Team
- `MULTI_ORG_ENABLED=true` required in deployment for multi-org support

## Key Integration Points

- **IAM pipeline**: `insights/api/iam_org_pipeline.py` -- social-auth pipeline step for org assignment
- **Social auth settings**: `insights/settings/web.py` -- SOCIAL_AUTH_PIPELINE with iam_org_assign
- **Commerce billing**: `insights/tasks/commerce_billing.py` -- hourly Celery task reporting per-org event counts
- **Scheduled tasks**: `insights/tasks/scheduled.py` -- all periodic task registration

## K8s Workloads (deployment.yaml)

- `insights-web` -- Django web server (port 8000)
- `insights-worker` -- Celery worker
- `insights-plugin` -- Node.js plugin server (Kafka consumer)
- `insights-capture` -- Rust event ingestion (port 3000)
- `insights-sql` -- PostgreSQL
- `insights-kv` -- Valkey/Redis
- `insights-kafka` -- Kafka-compatible stream gateway
- `datastore` -- ClickHouse OLAP engine (StatefulSet)

## Shared Client Config

- ConfigMap `insights-client-config`: `INSIGHTS_HOST`, `NEXT_PUBLIC_INSIGHTS_HOST`
- KMSSecret `insights-client-kms-sync`: `API_KEY` for other services to send events

## K8s Environment Variables (insights-web)

- `DATABASE_URL`, `SECRET_KEY` -- from KMS via `insights-secrets`
- `SOCIAL_AUTH_OIDC_*` -- Hanzo IAM OIDC SSO
- `MULTI_ORG_ENABLED=true` -- enable multi-tenant org creation
- `COMMERCE_API_URL`, `COMMERCE_TOKEN` -- billing metering
- `DATASTORE_*` -- ClickHouse connection
- `KAFKA_HOSTS` -- Kafka broker for event ingestion
