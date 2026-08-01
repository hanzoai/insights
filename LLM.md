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

## Ingest is NATIVE — the capture/kafka tier is GONE (verified 2026-07-26)

Do not go looking for `insights-capture`, `insights-plugin`, `insights-kafka` or
`insights-kv`. **Those CRs and pods no longer exist.** The only insights
workloads in ns `hanzo` are `insights-web`, `insights-worker`, `insights-sql`.
Events are ingested by the **cloud Go binary**, not by the Rust capture service:

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

**`POST /v1/s` (session recordings) is BROKEN and losing data.** It still points
at `insights-hanzo-ai-capture` → `insights-capture.hanzo.svc`, which has no
pods, so it 502s — ~16 real posts per 3h are being dropped.
`insights.session_replay_events` has **0 rows**; replay has never worked in this
deploy. Reviving it is a project, not a config fix: that Distributed table is
fed by `kafka_session_replay_events` + `session_replay_events_mv`, and with the
Kafka tier deleted **nothing can write the index** even if snapshot blobs landed
in S3. It needs a new writer path in cloud, or the Kafka tier back. Do not "fix"
the route alone — pointing it somewhere that returns 200 would only lose the
data more quietly.

Relatedly, `insights` still carries **23 Kafka-engine tables** pointing at
`kafka:9092`, which does not resolve. They error in the background forever and
are why `preflight.kafka` is `false`.

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
- **Only three insights workloads exist**: `insights-web`, `insights-worker`,
  `insights-sql`. The `insights-capture` / `-kafka` / `-kv` / `-plugin` CRs were
  deleted — earlier revisions of this file listed them as retained, which is no
  longer true. See the ingest section above.
- Rollout is verified BY IMAGE, never by `readyReplicas` alone: gate on
  `updatedReplicas == replicas` with the old ReplicaSet at zero, and exec a pod
  selected by its image. Reading a pod mid-rollout returns the OLD build and
  makes a shipped fix look absent (or an absent one look shipped).

## Auth / tenancy

Tenancy is the IAM `owner` claim = the org (one tenancy). All Go observability
(`/v1/evals`, `/v1/analytics`) scopes exclusively by `c.Org()`; secrets via KMS.

## Identity: a user is their IAM `sub`, and `person` is only a column name

**The id is the IAM `sub`** — every Hanzo property sends the same one for the
same human. It is IAM's single derivation of identity (`subjectOf`,
`iam/internal/oidc/token.go`): the stable opaque user id, with `owner/name` only
a legacy fallback for pre-cutover rows. `owner/name` is a display path that moves
when a user or org is renamed, and it is a different id space from the one Cloud
stamps server-side on a reduced principal — so a property sending it counts one
human as two.

**A property that does not attach its bearer has no identity at all.** Cloud's
anonymous lane (`apps/analytics/public.go`) admits only pageview and error, files
them under the `$public` tenant, and DROPS `identify` with a 200 receipt. That is
deliberate and must not be widened. The fix is always the caller's own token, not
a baked publishable key — one console image serves three brands and a `pk-` maps
to exactly one org.

**`user` above the projection, `person` below it.** `person_id` is a physical
column in `sharded_events`' sort key and the whole `insightsql` engine compiles
against it; renaming it is a live-column migration whose backfill would
double-count. So the vocabulary boundary is `insights/models/event/plane.py`:
expressions are named for what they mean to us, written into the columns the fork
reads. What a reader is SHOWN is ours — "0 users", "Users & groups".

**Three views, one source.** `event_mv`, `user_mv` and `user_alias_mv` all
project `event.event` through the same identity expressions:

| view | writes | fact |
|---|---|---|
| `event_mv` | `writable_events` | this event happened |
| `user_mv` | `writable_person` | this user exists |
| `user_alias_mv` | `writable_person_distinct_id_overrides` | this visitor IS that user |

The alias is what makes signing up non-destructive: a visitor's pageviews are
written under a browser-minted id and everything after sign-in under their IAM
subject, so without it a user's history ends exactly when it starts being worth
having. `@hanzo/event` already sends the pre-login id beside the subject and
Cloud stores it as `anonymous_id` — the alias just writes the join down where the
query engine reads it.

**A version is a PRECEDENCE, not a clock.** A ReplacingMergeTree keeps the
largest `version`, so that column decides which row is true. It is banded —
`BAND = 1 << 61`, anonymous < identified < override — and the clock inside a
band is `ingested_at`, a column DEFAULT (`now64(3)`) that nothing on the wire can
reach. Two consequences worth knowing before editing it:

- **Identification outranks time**, so a user we have ever known by name stays
  known. It has to: the reduced lane stamps the subject into `distinct_id` and
  leaves `person_id` empty, and a caller may send any `distinct_id` it likes, so
  rows CAN share a key and disagree about `is_identified`. Per-row derivation is
  not enough; the band is what settles it.
- **The top band is reserved and the plane never writes it.** A projected row
  whose version is a function of its own event is otherwise immortal — no
  tombstone, no richer source, no correction can bid higher. The first cut
  anchored at the top of the UInt64 and the only way to fix it was to delete
  1348 rows (`0222`).

Never use `time` here. It is the caller's — `clampTS` only pulls the future back
— and under a first-wins rule a back-dated row outranks every genuine one forever.

**Deleting a projected user needs `retire_projected_users`.** The fork's
`delete_person` is driven by a Django instance and its tombstone travels by
Kafka; a projected user has no Postgres row and this deployment runs no Kafka, so
that path finds nothing and lands nothing — `bulk_delete` used to answer 202
having deleted nothing. Projected users are retired in the override band, which
is what makes the deletion survive the next backfill.

`user_mv`/`user_alias_mv` backfills are safe to re-run **for as long as the
routing is unchanged**; `event_mv`'s is never. `person` collapses on
`(team_id, id)` and the overrides on `(team_id, distinct_id)` — the same shape as
`sharded_events`, so the difference is not the collapse key alone: `team_id` is
`transform(org, …)` over `org_team`, the table `0220` exists to mutate. Re-route
an org that already has events and the old rows stay under the old team.

That is live here, and it is the plane's one known inconsistency: `0220` moved
`$public` to team 0 after `event_mv` had written its events under team 1, so
**~92% of team 1's events point at users team 1 cannot see** (4791 of 5191). The
users are right; the events are stale. Reconciling them is the deliberate
operator delete `0221` spells out, not a backfill.

An MV over `event.event` runs inside Cloud's INSERT, so **an expression that can
throw takes down fleet-wide ingest.** Every expression in the projection is total
over any input — including a negative clock, which is why the band clamps at zero.
Confirm ingest by watching real traffic land (`event.event` growing, new rows in
the live bands); do NOT send probe events. A probe is a real user row in a real
tenant, and four of them ended up bound to an actual customer's account.

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

## What the Ship-it step needs, and how it failed silently for a day

The step below is right, but it depended on three things nobody had checked, and
missing any one of them makes a build publish an image and pin nothing — while
every dashboard stays green, because the BUILD succeeded:

 1. `KMS_CLIENT_ID` / `KMS_CLIENT_SECRET` as ORG-level forge action secrets.
    They were absent. `hanzo` had `GHCR_TOKEN`, `GHCR_USER`, `GH_PAT`, `OCI_*`
    and nothing else — which is exactly why builds worked and deploys did not.
    Repo-level secrets on `hanzo/insights` are empty; everything is inherited.
    Check with: `GET /v1/orgs/hanzo/actions/secrets` (names only, never values).
 2. A VALID `UNIVERSE_PIN_TOKEN` in KMS. The one provisioned there matched no
    live token in the forge and answered 401 on every username, so even a
    successful KMS login could not have pushed.
 3. The token must be able to push to `hanzo/universe`. Verify without pushing:
    `curl -o /dev/null -w '%{http_code}' -u "z:$TOKEN" \
      https://git.hanzo.ai/hanzo/universe/info/refs?service=git-receive-pack`
    200 means yes; 401 means the token is dead; 403 means the repo is a PULL
    MIRROR and cannot be pushed to at all (several `hanzoai/*` repos are).

The lesson worth keeping: `1.52.37`, `.38` and `.39` all built and published
while production sat on `.36`. A green build is not a deploy, and the only
honest check is the pin — `git log charts/app/values/` in universe.

Which is why pin.sh stamps `Pinned-by: ci run <id>` or `Pinned-by: hand`. The
commit author is always `hanzo-ci` whoever runs it, so authorship cannot tell
you whether the automation works. Twice a hand-run pin was read back as proof
the pipeline was healthy.

## The build ships itself now — and the trap that hid it

A push to `main` builds the next patch semver and pins it in `hanzoai/universe`;
cd.hanzo.ai reconciles from there. `.hanzo/workflows/deploy.yml` ends in a
"Ship it" step that calls `charts/app/pin.sh` in universe with a forge token read
from KMS (`orgs/hanzo/secrets/deploy/UNIVERSE_PIN_TOKEN?env=prod`). There is no
manual step, and no second mechanism: pin.sh is the one place a deploy is
decided, and it refuses a non-semver version, an image the registry cannot serve,
a version older than the current pin, and a repository the caller chose rather
than the one the values file declares.

**`@hanzo/elements` must be `workspace:*`, never `"*"`.** Three products under
`products/` depend on the design system. A plain `"*"` range makes pnpm resolve
it against the npm REGISTRY, and `@hanzo/elements` is not published there — so
`pnpm --filter=@hanzo/frontend... install` fails with `ERR_PNPM_FETCH_404` and
the image never builds. This is easy to reintroduce and hard to spot, for two
reasons: the failure is silent from the repo's point of view (a build that never
ran looks the same as a build nobody pushed), and it survived undetected for
years because the OLD name, `@hanzo/lemon-ui`, IS published to npm — so `"*"`
resolved from the registry by accident. Renaming the package did not break the
link; it revealed there had never been one.

`pnpm-workspace.yaml` must also list `frontend/@hanzo/*` under `packages:`.
Listing `frontend` alone does not include packages nested inside it.

Before changing either, run the exact line the Dockerfile runs:

    CI=1 pnpm --filter=@hanzo/frontend... install --no-frozen-lockfile

## Verify a deploy by the POD image, never the Deployment spec

`kubectl get deploy ... -o jsonpath='{.spec.template...image}'` reports the
DESIRED image. It updates the instant a pin lands and says nothing about whether
the image pulled or the container started — an unpullable or crash-looping image
looks identical to success. Read `.status.containerStatuses[].image` on the pods,
and note that a multi-container pod may carry sidecars pinned to other versions,
so `containerStatuses[0]` is not necessarily the app.

Registry tag lists are paginated: `/tags/list?n=10000` can return nothing at all.
To ask whether a specific version exists, probe its manifest — 200 or 404 — which
is also the only way to catch a phantom tag (listed, but with no image behind it).
