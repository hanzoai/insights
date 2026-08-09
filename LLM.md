# Hanzo Insights — the converged tree (upstream fa1a9a60 + the live line)

## Status

`main` is the grand convergence: the live production lineage merged with
`converge/final` (the 2026-08-01 upstream rebase + ee deletion + red fixes),
the ONE sessions model (`sessions_v1/v2/v3` collapsed; resolver tags
`events_to_sessions` + `replay_to_sessions`; no `sessionTableVersion`
anywhere), `names/retire-version-suffix`, `schema/event-fact`, and upstream
master `fa1a9a60` (2026-08-06) re-derived through `bin/debrand`. The tag for
this state is v1.53.0.

ONE ingest door: `POST https://api.hanzo.ai/v1/event` (cloud binary), and ONE
authority that mints the key it accepts: cloud, at `POST /v1/projects`. Every
SDK wire path (`/e`, `/batch`, `/capture`, `/i/v0/e`, `/v1/e`) on
insights/analytics/sentry hosts rewrites to it at the ingress. Cloud also
serves the Sentry wires (`/v1/event/:project/envelope|store`), the tag script
(`GET /v1/event.js`), the sentry read surface (`/v1/sentry/*` for
sentry.hanzo.ai's embedded console), and projects error + gen_ai span signals
into o11y (sentry lens + LLM lens; kill switches CLOUD_SENTRY_LENS /
CLOUD_LLM_LENS). o11y.hanzo.ai emits its SDK events to insights.hanzo.ai —
no separate ingest route exists or is needed.

Branding: zero upstream art. Workflow template cards, choosers, auth
wallpaper, previews and fixtures carry no posthog cloudinary; the CSP does
not allow that host; the mascot easter egg is deleted with its sprite
package; `insights-js` resolves to `@hanzo/insights` for every consumer.
The react wrapper is our own `@hanzo/insights-react`, whose peer is
`@hanzo/insights` by name, so it needs no shim standing in for an upstream
peer and its exports are `Insights*` — the aliased `PostHog*` import names,
and the allowlist entries that excused them, are gone.

Known debt, deliberate: ~85 type-level errors under `tsgo --noEmit`
(size-prop enums, generated deep-relative imports in a few products,
stories typing) — the production esbuild bundle and the Django image build
are the shipping gates and both are green; the tsc debt is tracked for a
follow-up pass. The prune's closure keeps 21 upstream products the new core
imports; they are inert (not in INSTALLED_APPS).

## Django → Go observability map (both planes live)

| Django surface                                                                                                                            | Go replacement                                                                   | Status                                                                                                                                      |
| ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| LLM analytics (`products/llm_analytics`, `api/llm_proxy`)                                                                                 | `/v1/evals/*` + `/v1/analytics/llm/*`                                            | **evals LIVE**; analytics/llm backend = GAP (below)                                                                                         |
| Evals / datasets / scores                                                                                                                 | `/v1/evals/{datasets,dataset-items,evaluators,score-configs,scores,traces,runs}` | **LIVE** (`cloud/clients/eval`)                                                                                                             |
| Trace/observation query                                                                                                                   | `/v1/evals/traces` (+ `hanzo.traces`/`hanzo.observations`)                       | **LIVE**                                                                                                                                    |
| Product / web / revenue / marketing / customer analytics, insights, dashboards, funnels, retention, trends                                | `/v1/analytics/{overview,timeseries,realtime,top/*}`                             | **GAP** — backend not shipped (below)                                                                                                       |
| Org / user / project / `personal_api_keys` / `login`                                                                                      | **Hanzo IAM** (`hanzo.id`, OIDC `owner`) + `/v1/projects`                        | covered by IAM (auth/tenancy, not observability)                                                                                            |
| Data warehouse / data_modeling / batch_exports                                                                                            | Datastore warehouse (`hanzoai/datastore`) direct                                 | substrate retained                                                                                                                          |
| Feature flags, early access, surveys, experiments, product tours, session replay, error tracking, CDP, notebooks, groups, user interviews | —                                                                                | **SUNSET** — not ported; distinct products, not "observability". Were already dead in prod (Django `502`). Do NOT silently assume replaced. |

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

## Ingest is NATIVE — events go to cloud, replay goes through the plugin

Events are ingested by the **cloud Go binary**, not by the Rust capture service:

```text
{insights,analytics,sentry}.hanzo.ai/{e,/v1/e,/batch,/capture,/i/v0/e,/v1/event}
  → middleware insights-cloud-ingest-rewrite (replacePath /v1/event)
  → service api-hanzo-ai → cloud.hanzo.svc:8000
  → POST /v1/event → cloud apps/analytics → JetStream → event.fact
```

CLOUD IS THE ONE AUTHORITY THAT MINTS AN INGEST KEY, and this deployment mints
none. A team's `api_token` HOLDS the key cloud minted at `POST /v1/projects`;
`insights/ingest.py` is the only place it is obtained and `Team.objects.create`
the only place it is stored. `generate_random_token_project` raises — a locally
minted key names no cloud project, so the door refuses it and the events are
gone. The three teams map to cloud projects `hanzo/insights`, `lux/insights`,
`zoo/insights`.

Tenant is resolved SERVER-SIDE by `eventTenant` (cloud `apps/analytics/event.go`),
in this order: validated IAM bearer → a `pk-` on `Authorization` /
`x-hanzo-ingest-key` / `?ingest_key=` → `?api_key=` / `x-api-key` / the PostHog
body field `api_key` → a Hanzo Team workspace token. **There is no brand-host
fallback any more** — a request Host names no tenant on any door. Earlier notes
here described `captureTenant` and a brand-host path; both are gone, and testing
anonymously now proves nothing except that the door refuses anonymous writes.

Read the refusal BODY, it names the cause exactly (measured 2026-08-09):

```text
no credential          401 ingest_key_required   "create a project (POST /v1/projects)…"
key naming no project  403 ingest_key_unknown    "this ingest key names no project…"
accepted               200 {"accepted":N,"dropped":M}
```

A 200 means published to JetStream, not yet in the table — a separate consumer
inserts into `event.fact`. Prove a landing by querying it, never by the status
code: `SELECT org, product, name, time FROM event.fact WHERE distinct_id = …`.
`product` holds the cloud project slug, stamped server-side by `attributeProject`.

`POST /v1/ai` is likewise unrouted and falls through to Django.

### Session replay writes again — measure it, do not assume it (2026-08-02)

The paragraph that used to sit here said replay had never worked, that
`session_replay_events` had 0 rows, that `insights-plugin` and the Kafka tier no
longer existed, and that `kafka:9092` did not resolve. Every one of those is now
false, so re-measure before repeating any of it:

- `insights-plugin` IS running, with `OBJECT_STORAGE_ENABLED=true` and bucket
  `hanzo-sessions` — it is the blob ingester.
- `kafka` resolves (`kafka.hanzo.svc.cluster.local`). `KAFKA_HOSTS` is UNSET on
  both web and plugin, so everything runs on the `kafka:9092` fallback in
  `settings/kafka.py`. That file's comment claims prod always sets
  `KAFKA_DEFAULT_HOSTS`; here it does not, and the fallback is load-bearing.
- `insights.session_replay_events` holds real sessions, most recently written
  2026-08-01 19:46. The 24 Kafka-engine tables are being served, not erroring
  into the void.
- Live workloads are `insights-web`, `insights-worker`, `insights-sql`,
  `insights-plugin`, `insights-livestream`, against services `kafka`, `kv`,
  `datastore`, `s3`.

What is still absent is a _dedicated_ write door. `rust/capture` has
`CaptureMode::Recordings` in source but NO workflow builds it — `.hanzo/workflows`
builds exactly three images (`insights`, `insights-plugin`, `insights-livestream`).
`/v1/s` no longer 502s at a retired capture service; it falls through to the
Django catch-all. So the standing warning still holds, for the original reason:
**do not point `/v1/s` at something that returns 200 with no producer wired** —
that loses recordings more quietly than a visible failure.

`RECORDING_API_URL` is empty on `insights-web`, and that is CORRECT. It belongs
to session-replay **v2**, a separate `recording-api` service we do not run and do
not build; its client raises `RuntimeError("RECORDING_API_URL is not configured")`
rather than degrading. v2 stays off by itself — `SESSION_RECORDING_V2_S3_ENABLED`
defaults to False outside DEBUG — so convergence does not silently switch to it.
Leave the variable empty until a recorder exists to point it at.

The `ingress-routes` CM hot-reloads via file-provider fsnotify — NEVER
`rollout restart deploy/ingress` (ACME/TLS outage). Routes live in
`universe infra/k8s/ingress/routes.yaml`; change them by pushing to universe
main, never by `kubectl patch` (Hanzo CD selfHeal reverts within ~90s).

## `/` is the marketing landing page when signed out

Anonymous `/` used to bounce straight to SSO, so the product had no public face.
`insights/urls.py:root` now branches: `home` (the SPA, unchanged) for an
authenticated user, `templates/landing.html` for everyone else.

Its CTAs point OUT to `hanzo.ai/pricing` on purpose — **`GET /v1/billing` is
404 in this deployment**, so an in-app upgrade funnel would dead-end. There is
also no Insights SKU in `@hanzo/plans` (its 11 tiers are compute), so no plan
copy is written in the template; minting that SKU is a pricing decision, not a
template edit. Tests in `insights/test/test_landing.py` fail the build if
`/v1/billing` or any third-party asset host reappears on the page (prod refuses
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

- `ghcr.io/hanzoai/insights:<semver>` — built by the NATIVE pipeline in
  `.hanzo/workflows/deploy.yml` (git.hanzo.ai push → in-cluster act_runner →
  docker build → GHCR), tagged **semver, never sha**. This file said the
  opposite for a while; the pipeline's own header explains the reversal. The
  hazard behind the old sha-only rule was real — a RE-PUSHED tag leaves two
  digests behind one name — but that is caused by mutating a tag, not by
  readable names, and the workflow now refuses to push a tag that already
  exists. The next patch is derived from the REGISTRY, not from `git tag`,
  because those two disagree here. The commit rides the image as
  `org.opencontainers.image.revision`. `container-images-cd.yml` is
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

## `/static/*` is served from an object origin, not from the pods

A content-hashed filename is a claim about bytes: `index-W7FGYMJN.js` names one
byte sequence and only ever that one. Those files used to live only inside the
pod that built them — WhiteNoise reading each pod's own `STATIC_ROOT` out of the
image — so an asset died when its pod did. This repo ships every few minutes and
rolls with `maxSurge: 1`, so two builds serve simultaneously for most of the day
(measured: 11 ReplicaSets in two hours, three of them live). A browser therefore
took `index.html` from one build and had roughly half its chunk requests answered
by another that had never heard of that hash — **one url, 15 requests, 200×7 and
404×8**. That was the "Insights failed to load. Reload the page to try again."

So the tree is mirrored to `s3://cdn/insights/static/` and `insights.hanzo.ai`
serves `/static/*` from there, via the ingress `staticFiles` middleware
(`hanzoai/universe`, `infra/k8s/ingress/routes.yaml`, the `insights-static-*`
middlewares). Rollout tweaks cannot substitute: `maxSurge`/session affinity only
narrow the window, and a client still holding the old shell breaks _after_ the
rollout finishes.

- **The origin is flat and shared by every build**, which is only correct because
  the names are content-addressed. Two builds emitting the same chunk write
  identical bytes; two that differ emit different names. Collisions are
  impossible by construction, which is also what makes retaining old builds
  nearly free. `bin/publish-static` writes a hashed key ONCE and never rewrites
  it, so a build uploads only what it changed — the 2.7 GB first publish is the
  floor, not the per-build cost.
- **1795 of the 12887 published names carry no hash**, and 129 of those are
  `.js`. They are not incidental: `array.js`, `toolbar.js`, the recorders,
  `surveys.js` are the SDK bundles customers load from their own pages by that
  exact url, plus `staticfiles.json` and the hashless `index.js`/`index.css`
  aliases `common/esbuilder/utils.mjs` re-emits every build. They keep
  overwriting and must never be marked immutable — a year-long `immutable` on
  `array.js` pins every customer's SDK with no way to recall it.
- **Two routers, one origin.** `cacheControl` is keyed by EXTENSION, so "hashed
  names are immutable" cannot be said in one map. The router discriminates
  instead, on a `PathRegexp` of the two hash shapes the build emits — Django's
  `name.<12 hex>.ext` and esbuild's `name-<8 base32>.ext`. A name the regex does
  not recognise falls to the short-lived router, so the failure direction is
  under-caching, never a permanently-stuck asset.
- **The CORS header had to be restated.** `/static/*` answers
  `Access-Control-Allow-Origin: *` from Django's corsheaders; serving from the
  object store goes around Django and the header went with it. Set it with
  `customResponseHeaders`, NOT `accessControlAllowOriginList` — the CORS branch
  applies headers from a response modifier in the proxy's return path, which a
  terminal middleware never reaches. `curl` reported 200 throughout; only loading
  a font in a real browser surfaced it, as a bare `NetworkError`.
- **`staticFiles` is terminal** — a key it cannot find is a 404, not a
  fall-through to the pod. So the publish runs BETWEEN the build and the pin in
  `deploy.yml`. Pin first and there is a window where pods serve a build whose
  chunks nobody has published.
- **A pin can still move without a publish, by hand, and that is now a
  foot-gun.** `charts/app/pin.sh` checks semver, registry pullability, the
  repository, and monotonicity — it does NOT check that the build's manifest
  exists. `PIN_ROLLBACK=1` and a direct edit to
  `charts/app/values/hanzo/insights-web.yaml` both bypass the workflow. That
  used to be harmless because the image carried its own `STATIC_ROOT`; it is not
  any more, because the ingress never reads the pod. **Rolling back to a build
  older than the 30-day horizon will find its unique chunks pruned.** Check
  `s3://cdn/insights-builds/` for that version before pinning backwards.
- **Retention is 30 days**, held by `bin/prune-static` (weekly, in
  `.hanzo/workflows/prune-static.yml`) and read from the per-build manifests in
  `s3://cdn/insights-builds/`, never from object age: a chunk unchanged across
  two hundred builds has the OLDEST `LastModified` in the bucket precisely
  because it is the most stable thing in it, so an S3 lifecycle rule would delete
  the load-bearing assets first and leave the churn.
- **The prune deletes unattended, so it carries four guards** — all covered by
  `bin/test/test_static_origin.py`, which runs in `ci-python`. A publish writes
  its objects first and its manifest last, so a build finishing between the
  manifest listing and the object listing looked present and unclaimed, and the
  prune would delete the very build the pin was about to move to. Manifests are
  re-read AFTER the object listing; nothing younger than a day is ever deleted
  (age PROTECTS, never condemns); a floor of ten builds survives a wrong runner
  clock; and an orphan set over a quarter of the tree refuses rather than
  deletes. Do not remove one because the others look sufficient — the first two
  cover different halves of the same race.
- **The manifests are a SIBLING prefix, not `insights/.builds/`.** A
  percent-encoded `../` reaches out of `static/` inside the middleware
  (`/static/%2e%2e%2f.builds/<v>.txt` returned one, 200). It cannot climb past
  the middleware's root, so only public filenames were ever reachable — but a
  record of the tree does not belong inside the tree, and a sibling prefix puts
  it out of reach by construction rather than by a path-cleaning rule.
- **A version string does not name a tree.** Both forge mirrors run the deploy
  workflow, the concurrency group is per-repo, and two builds routinely compute
  the same next patch and push that tag with different digests — measured on
  1.52.116 (`2453b673` ran while the registry resolved the tag to `81c09eaf`);
  universe records the same for the plugin image. Manifests are therefore keyed
  `<version>-<sha12 of the list>`, so two trees write two manifests instead of
  one erasing the other's record and stranding its files for the prune.
- **`analytics.hanzo.ai` and `sentry.hanzo.ai` are NOT part of this.** They share
  the cloud _ingest_ routers with insights, but their `/static/` goes to entirely
  different backends (`analytics.hanzo.svc` and `cloud-api-hanzo-ai`). Carving
  `/static` on those hosts would hijack paths they serve themselves.
- WhiteNoise is still in `MIDDLEWARE` and still serves the tree inside the pod.
  It is the fallback, and leaving it is the safer order — remove it only as its
  own change.

## Warehouse table names: no version suffixes, and a gate that can see them

A `_v2` is a confession — two tables are the same thing and nobody deleted one.
The fork brought nine into the `insights` database:

| name                                        | disposition                                                    |
| ------------------------------------------- | -------------------------------------------------------------- |
| `query_log_archive_v2`                      | **retired** by `0230` — renamed to `retired.query_log_archive` |
| `kafka_log_entries_v3`, `log_entries_v3_mv` | **retired** by `0230` — the clean pair takes over              |
| the six `raw_sessions_v3*`                  | **held** — the sessions rewrite is mid-flight                  |

`bin/tables` is the gate. `--check` reads source and is stdlib-only (no Django,
no warehouse, no services, runs in `env -i`); `--live` reads `system.tables`.
Both consult one LEDGER, in `bin/tables` itself, which names every versioned
table with a disposition and a reason. A name not on that list fails the build;
a ledger row matching nothing also fails, so the list can only shrink.

**The measured lesson.** The predecessor guard was a Go test doing
`os.ReadDir(".")` over `cloud/apps/analytics/*.go`. Its own comment named
`raw_sessions_v3` as the thing it existed to prevent — and it could not see it,
because the nine live in Python, in migrations, and in the database. Before
writing a name rule, check what it can REACH; a rule that cannot see the names
it forbids is indistinguishable from no rule.

**Why a ledger and not a ban.** This repo self-deploys, so a rule that fails on
a clean checkout blocks every deploy — worse than the rot. The set is closed
instead of empty. `.hanzo/workflows/names.yml` runs it off the deploy path
(judgement turns a branch red, never wedges production — same split
`bin/debrand` draws).

**A DROP is the remedy, not the offence.** The gate reads CREATE positions only.
`0201` drops eleven versioned tables and `0230` two more; counting those would
make writing the cleanup down the thing that fails the build.

**`0230` never drops a row.** `query_log_archive_v2` holds 575 rows, so it is
MOVED — a cross-database `RENAME` between Atomic databases is metadata-only.
The version distinction becomes a NAMESPACE distinction, which is the rule
itself: `retired.query_log_archive` needs no number. The two log*entries objects
dropped are a Kafka table and a view, neither of which stores anything. Note
`max_table_size_to_drop = 0` (used in `0201`) \_disables* the size guard — it is
not a safety rail.

**The duplicate consumer, found on the way.** `kafka_log_entries` and
`kafka_log_entries_v3` both read the topic `log_entries` under different groups
(`group1` and `datastore_log_entries`) into the same `sharded_log_entries` — so
every log was consumed and written twice, deduplicated only because the
destination is a ReplacingMergeTree. Retiring the name and the duplicate is one
act. The survivor keeps the `_v3` group name, so it resumes from already
committed offsets: no replay, no gap.

**Declared and live disagree, and that is where sprawl hides.** `schema.py`
declares `log_entries` as a MergeTree; production has it as a Distributed table
(a migration replaced it), and `query_log_archive_v2` exists in the warehouse
with no CREATE anywhere in the tree. This is why `--live` exists and why `0230`
deliberately does NOT move the MV's destination — that drift is real, is not a
naming problem, and is not fixed here.

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

| view            | writes                                  | fact                      |
| --------------- | --------------------------------------- | ------------------------- |
| `event_mv`      | `writable_events`                       | this event happened       |
| `user_mv`       | `writable_person`                       | this user exists          |
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
`transform(org, …)` over the routing table. Re-route an org that already has
events and the old rows stay under the old project.

That is live here, and it is the plane's one known inconsistency. `0220` was
applied on 2026-08-01 — it had never run, so the view still defaulted unrouted
orgs to project 1 for days after the source said otherwise — and it moved
`$public` to project 0 without re-projecting what `event_mv` had already written
under project 1. So **94.6% of project 1's events point at users project 1
cannot see** (7,713 of 8,151, measured after the fix). The users are right; the
events are stale. Reconciling them is the deliberate operator delete `0221`
spells out, not a backfill.

**A committed migration is not an applied one.** That gap is what made this
whole class of bug survivable in the first place: the source read `toInt64(0)`
while the warehouse ran `toInt64(1)`, and nothing reconciles the two but running
`manage.py migrate_datastore`. Check the warehouse, not the file:

```sql
SELECT extract(create_table_query, 'toInt64\([0-9]+\)') FROM system.tables
WHERE database = 'insights' AND name = 'event_mv'
```

### Routing is derived, and `route_orgs` is its only writer

Which project an org's events land in is **not** written by hand and **not**
seeded by a migration any more. `Organization.slug` is the same value the
envelope carries as `org`, and the org's first project is the project, so
`manage.py route_orgs` publishes that mapping from the app's own records. A
hand-written second copy is what routed `maxpower` — a separate funded org —
into Hanzo's project 1.

Run it after `migrate_datastore` whenever an org gains or loses a project;
`--dry-run` reports without writing, and it is a no-op when nothing changed. An
org it has never routed is UNATTRIBUTED (project 0, an id `insights_team_id_seq`
cannot mint), so it is invisible rather than someone else's — the safe way to be
wrong. It is deliberate rather than scheduled because re-routing an org strands
its existing events under the old project, which is the same sort-key hazard
above; the command prints how many rows that would be.

The tenant is the ORG. `team_id` is the fork's physical column, inside
`sharded_events`' sort key, so it cannot be renamed without rebuilding the
events table — the two words meet at ONE boundary in `plane.py` (where `person`
and `user` already meet), and nothing above it says `team`.

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
  applied). NOTE: live has since moved past this — it runs `1.52.51`, and the DB
  shows the adoption was only half-done. `migrate <app> zero --fake` was never
  run (all 924 historical records are still there); the squash's `0002`-`0004`
  were simply recorded alongside them, and `0001_initial` counts as applied only
  by NAME collision with upstream's 2020 `0001_initial`. The end state is
  correct — state matches schema, `migrate` is a no-op — but it was reached by
  coincidence, so verify `django_migrations` rather than assuming the documented
  procedure ran.

### Converging on upstream: the schema gap is the ship gate (measured 2026-08-02)

Read this before merging an upstream convergence to `main`. `main` auto-deploys.

The live DB's `django_migrations` is the only authority on applied state, and it
disagrees with the tree: the tree carries 4 migrations, the DB carries **924**
`insights` records. Both are correct. The historical upstream chain is recorded
in full and complete to **1017**, then two fork-authored migrations —
`1018_rename_legacy_app_label` and `1019_rename_insights_tables_clean`, which
gave us the physical `insights_*` table names — sit on numbers upstream also
uses. The squash's `0001_initial` counts as applied only because it collides by
NAME with upstream's 2020 `0001_initial`. So `manage.py migrate` is a no-op for
this app, and convergence cannot detonate the DB on its own.

The danger is the opposite of a bad migration: **models that outrun the schema.**
Upstream master reaches 1280, so the tree ships models 262 migrations ahead of
the database, and `bin/debrand` drops `posthog/migrations` — there are no files
to close the gap with. Measured against the live DB, the converged models expect
**26 tables and 162 columns that do not exist**, and 25 of those columns sit on
`insights_user`, `_team`, `_organization`, `_project`. Django SELECTs every
concrete field, so this is not degraded features — `select id, ui_configuration
from insights_user` already fails on the live DB, which means the first
authenticated request 500s. **Migrate the database BEFORE the converged image
ships, not after.**

The 262-migration gap is safe to cross. Every `RemoveField` (156) and every
`DeleteModel` (79) in it is wrapped in `SeparateDatabaseAndState` with empty
`database_operations` — upstream extracting models into `products/*`, no DDL.
Only 7 operations touch the database (3 `RemoveConstraint`, 2
`AlterUniqueTogether`, 2 `RemoveIndex`), each on a table upstream itself
introduces and each paired with a replacement `AddConstraint`. Upstream's own
policy forbids dropping a column in the release that stops reading it, so the
gap contains **zero column drops and zero table drops**.

Generating the delta is the remediation, but do NOT run a bare
`makemigrations && migrate`: it emits at least one real `DROP COLUMN`.
`Organization.default_role_id_legacy` is the known case — upstream's applied
`0829` added `default_role_id` as a uuid FK to `ee_role`; the fork, having
dropped `ee`, remodelled it as a plain `IntegerField` with
`db_column="default_role_id"`; upstream master has no such field, so the
autodetector wants it gone:

```sql
ALTER TABLE "insights_organization" DROP COLUMN "default_role_id";
```

Low risk today (the column is entirely NULL) but irreversible, so make it
state-only (`SeparateDatabaseAndState(state_operations=[RemoveField(...)],
database_operations=[])`) and keep the column, exactly as upstream does.

Operator procedure, in order:

1. Build the converged image (Django + deps only resolve there).
2. In that image, `manage.py makemigrations insights` → `0005_*`.
3. Read every operation. Additive only. Any `RemoveField`/`DeleteModel`/
   `RenameField` becomes state-only or stops the release.
4. Apply to a RESTORED SNAPSHOT of prod and run the app against it. A migration
   that has only ever run on an empty database has not been tested.
5. Only then apply to prod, and only then merge the converged tree.

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

```bash
CI=1 pnpm --filter=@hanzo/frontend... install --no-frozen-lockfile
```

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

## The upstream logo: five surfaces fixed here, one bigger one is NOT

The hedgehog and its wordmark were still drawn under our product's name. Five
surfaces are fixed in this repo — the product-tour footer preview, both toolbar
authorize screens, the survey error page, and the MCP link mark — all now the
HANZO wordmark in `currentColor`.

**Search by path data, not by colour.** Two of those five drew the mark with
`var(--ph-brand-*)` rather than a literal `#1D4AFF`, so a hex grep finds the
templates and misses the survey page. The path strings are the reliable tell:
`M55.383 75.225` and `5.77226 8.02931` (hedgehog), `M303.32 114.86` and
`M29.375 11.6667` (wordmark).

**The wordmark asset was itself wrong.** `frontend/public/hanzo-logo.svg` had
five glyphs reading H, N, A, N, S — a duplicated N, no Z, no O. It rendered
HNANS on the login page. `insights-logo-cloud.svg` and `insights-logo-demo.svg`
were byte-identical copies with no referrer and are deleted. Render an SVG
before believing it; nothing in CI reads letterforms.

**What is NOT fixed, and it is the widest surface of the lot.** The browser SDK
still ships the upstream mark, and we serve it:

```text
https://insights.hanzo.ai/static/array.full.js   200, contains the upstream mark
```

It comes from `@hanzo/insights` (1.358.1), copied into `frontend/dist` by
`frontend/bin/copy-insights-js`, and it renders `Tour by <mark>` and
`Survey by <mark>` — 20 dist files carry it. That is the widget on our
CUSTOMERS' websites, seen by their end users, so it is a wider audience than
every surface fixed here combined. Fixing it means fixing the `@hanzo/insights`
fork and publishing; it cannot be done from this repo.

Note the distinction that makes this easy to get wrong: the file fixed here,
`scenes/product-tours/editor/FooterPreview.tsx`, is the EDITOR'S PREVIEW of the
widget. The widget itself is the SDK. Fixing the preview alone changes what the
tour author sees and nothing about what their users see.

## One icon set, two package names

`@hanzo/icons` resolves through a `pnpm.overrides` alias in the root
`package.json` to `@hanzo/insights-icons`. The shadowed name is real and
published: `@hanzo/icons@0.36.6` is a 301-byte stub whose only content is a
dependency on the upstream `@posthog/icons`. Drop the alias and the upstream
package returns silently, with no install error.

1,073 files import `@hanzo/icons`, so the fix is at the package, not the
imports: publish the fork's content as `@hanzo/icons` and delete the alias.
Note before doing it that `insights-hosts` aliases the SAME name to
`@hanzo/insights-icons@0.36.6` and is pre-rename (its SCSS has no `.Icon`
rules), so it must keep its own pin.

Until then the guard is `frontend/src/lib/elements/icons/icons.test.ts`, which
renders every icon and asserts `class="Icon"`. Verified both ways: 318/318 pass
on 0.36.7, and 318/318 fail on 0.36.6 — so it catches the drift rather than
merely documenting it.

## The Python SDK is pinned to the FORGE, and it lags the app tree

`hanzo_insights` (our fork of `posthog-python`) resolves from
`git.hanzo.ai/hanzoai/insights-python`, not from github.com. Two independent
reasons, and the second is the one that will waste your afternoon:

1. `github.com/hanzoai/insights-python` is ARCHIVED — read-only, frozen at
   `5525a17`. Nothing can be pushed there. Unarchiving needs GitHub admin.
2. uv resolves a github.com git dependency through the **GitHub REST API**, not
   through git. Its own log says so: `Attempting GitHub fast path` →
   `https://api.github.com/repos/.../commits/main`. So a
   `url.insteadOf` redirect — the trick `cloud/Dockerfile` uses to point
   `github.com/hanzoai/*` at the forge — **cannot reach past it**. The build
   keeps resolving the archived repo's stale commit and says nothing. Naming the
   forge directly is the only address that answers with the code that exists.

The forge serves nothing anonymously (401 on every repo, not just this one), so
the image build needs a credential: `FORGE_TOKEN`, mounted as a BuildKit secret
and applied through `GIT_CONFIG_*` in the one `uv sync` command's environment —
never written to `/root/.gitconfig`, so it cannot survive into a later layer.
`bin/check-forge-credential` asks the question in two seconds, before a
30-60 minute build spends the hour, and names exactly what to seal if the
answer is no. Same reason `check-imports-are-committed` runs at the top of the
job.

### The fork is BEHIND the app tree — this is a live class of bug

The 2026-08 rebase moved the app onto an upstream that expects a much newer
posthog-python than the fork's 7.9.x. That is what crash-looped 1.52.84: every
web pod died on `from hanzo_insights.metrics_capture import InsightsMetrics`,
which the fork did not have. Find the rest of the drift with an AST sweep rather
than by waiting for the next pod to die — collect every `from hanzo_insights…`
and `hanzo_insights.<attr>` in the tree and check each against the installed
package. Known remaining gaps, all runtime rather than import-time, so the web
boot check does not see them:

- `Client.__init__` takes neither `_use_ai_lane` nor `_enable_multimodal_capture`,
  which `insights/ph_client.py:get_client` passes → `TypeError` on every
  `ph_scoped_capture` / `ph_background_capture` call (61 non-test sites).
  Upstream backs these with a multi-lane queue architecture; the fork has one
  queue, so this is a real port, not a signature change.
- `Client.flush` takes no `timeout_seconds`, which `ScopedCapture.flush` passes.
- `hanzo_insights.flag_definition_cache_provider` does not exist as a module
  global and `setup()` never forwards it, so `insights/apps.py` assigning it at
  boot is a silent no-op and local flag evaluation runs without its cache.

## An `ee` import is a build failure

`bin/check-imports-are-committed` refuses the name `ee` outright. It does not
ask whether the import resolves: `FIRST_PARTY` answers "is this committed", and
`ee` is not missing, it is refused. Counting it as first-party instead made the
verdict depend on resolution, so a committed `ee/` would have satisfied the
check and re-opened the hole — measured, with `ee/anything.py` staged and a file
importing it, the resolution form exits 0 on the very tree the refusal form
exits 1 on. Left out of both it read as somebody else's package and passed
silently, which is how `from ee.hogai…` sat in a module the temporal graph loads
eagerly and took down every web pod.

The gate reports the two mistakes separately because they want different fixes:
a named-but-uncommitted module wants committing, an `ee` import wants the
missing thing ported natively or the dead path deleted. Never shim it, and never
`try/except ImportError` around it — a fork that pretends to have the enterprise
tree is worse than one that admits it does not.

Two things the gate cannot see, so do not rely on it alone. Dotted paths in
strings — `mock.patch("ee.billing…")`, backend names in `LOGIN_METHODS`,
`CELERY_IMPORTS` entries, `to="ee.role"` in a migration — are not `ast.Import`
nodes, so they fail at run time or never. And migration dependencies: `("ee",
"0041_…")` is a graph node, not an import. Grep for `"ee\.` and `("ee",` as well.

A dropped `("ee", …)` dependency is not free. It also carried ordering: those
migrations came after the ee migration that created the roles, so removing it
without a replacement made a fresh database fail on `relation "ee_role" does not
exist`. They now depend on `insights.0002_managed_tables`, which is what creates
those tables here.

## Why login 500s: the migration graph, and how to ask it what is wrong

`POST /v1/login` returns 500 on `column django_session.user_id does not exist`.
That column comes from `insights_session`'s 0002/0003, and they have never
applied — because `migrate` builds the WHOLE graph before running anything, so
one unsatisfiable dependency anywhere blocks every migration in the tree.

Do not grep for this. Ask Django, which is authoritative about app labels (the
session app's label is `insights_session`, not `session`, so a filesystem guess
reports false positives):

```python
l = MigrationLoader(None, ignore_no_migrations=True, load=False); l.load_disk()
have = set(l.disk_migrations)
[ (k, d) for k, m in l.disk_migrations.items() for d in m.dependencies
  if d[0] != "__setting__" and d[1] != "__first__" and d not in have ]
```

Then walk the plan, because the defects come in three layers and each one hides
the next — the same shape as the boot-import loop:

1. **Graph build** — a dependency naming a migration or an app that is not
   there. Fixed: twelve numbered-but-renamed nodes, seven `('ee', …)` on the
   deleted enterprise app, plus `desktop_recordings` and `sessions`, which this
   fork does not install.
2. **State mutation** (`mig.mutate_state`) — `model_name=` naming a model no
   migration creates. This is where the debrand shows: the rename moved
   `HogFunction`→`InsightsFunction` and `HogFlow*`→`InsightsFlow*` without the
   references. Watch for `hanzo.aiment`, which is `posthog.comment` with the
   domain rewrite `posthog.com`→`hanzo.ai` driven through the middle of it.
3. **Model rendering** (`state.apps`) — lazy `to="app.model"` strings, which the
   first two layers never evaluate.

Fix model references only. `db_table` and constraint-name strings name objects
that exist in the database under those names; renaming them points the migration
at tables that are not there.

STILL BROKEN, and it is a different defect from all of the above:
`insights.userintegration` and `insights.userpushtoken` are real managed models
(`insights/models/user_integration.py`, `user_push_token.py`) that NO migration
creates, so the `tasks` FKs pointing at them cannot resolve. They want a
CreateModel, not a rename. Until that lands, `migrate` still cannot run and
login stays down.
