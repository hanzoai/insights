---
name: verify-insights-instrumentation
description: >
  Use this skill to verify that Insights instrumentation is firing correctly on
  a website. Drives a real browser at one or more URLs, observes which Insights
  events actually arrive, and reports a pass/fail summary. Use after installing
  the Insights SDK on a site, after a deploy that touches tracking code, or when
  events appear missing in the Insights dashboard.
---

# Verify Insights instrumentation

End-to-end check that the Insights SDK is loaded and emitting events as expected.
This skill orchestrates the three traffic-sim tools to give a complete picture
of a site's instrumentation health.

## When to use

- After running `npx @hanzo/wizard` to confirm the install actually works.
- After a deploy that touches analytics, tracking, or layout code.
- When a customer reports "I'm not seeing events in Insights" — to disambiguate
  between snippet issues, network issues, or filtering issues.
- As a smoke test before launching a new site or marketing page.

## Workflow

### Step 1 — Confirm the snippet is loaded everywhere

Run the `check_insights_loading` MCP tool against the URLs you care about
(homepage, key product pages, login, checkout, marketing pages). It returns
which pages have Insights initialized, the load method (head_snippet / snippet
/ array_js_only), and the init config.

Look for:

- Pages where `loaded: false` — Insights is missing from those pages.
- Inconsistent `api_key` values across pages — multiple projects in use.
- Inconsistent `api_host` values across pages — events going to different ingestion endpoints.

### Step 2 — Send synthetic traffic and confirm events arrive

Pick one URL where Step 1 confirmed Insights is loaded. Call:

- `simulate_new_user` — a few fresh-browser visits. Confirms `$pageview`
  fires for first-time visitors and that an anonymous distinct_id is assigned.
- `simulate_returning_user` — a few page views in a single session. Confirms
  cookies persist and `$pageview` keeps firing across navigations.

The tools return `verified: true` when at least one `$pageview` was captured
and there were no errors.

### Step 3 — Cross-check in Insights

If Steps 1 and 2 pass but events don't show up in the Insights UI, the issue
is downstream of the snippet:

- Check for ingestion lag (events can take ~30s to appear).
- Check that the `api_host` matches the project's ingestion host.
- Check feature flag and ingestion warnings in the Insights UI.

## What "verified" means in this skill

A site is verified when:

1. `check_insights_loading` reports `loaded: true` on every URL we expect.
2. `simulate_new_user` and `simulate_returning_user` both return at least one
   `$pageview` event per visit, with no errors.
3. (Optional) The events appear in the Insights UI within 1-2 minutes.

## What this skill does not check

- Whether your custom events (e.g. `signup_completed`) are being sent —
  the tool watches for any Insights event, but you'd need to drive the actual
  user flow to see custom events fire. Use it as a starting point, then add
  user-flow simulation on top.
- Server-side ingestion. The tool only sees what the browser SDK sends.
- Session recording quality. The tool reports whether recording is enabled
  in the init config but doesn't validate the recording itself.
