# Insights Stripe App

A [Stripe App](https://docs.stripe.com/stripe-apps) that surfaces Insights product analytics data
directly inside the Stripe Dashboard.

## Architecture

### Double OAuth flow

Connecting Insights to Stripe requires **two** OAuth exchanges in sequence:

1. **Stripe OAuth** (Stripe → Insights):
   the user clicks "Connect" in Insights,
   which redirects them to `marketplace.stripe.com/oauth/v2/authorize`.
   Stripe asks the user to grant Insights access to their Stripe account.
   On success Stripe redirects back to Insights with an authorization code
   that Insights exchanges for a Stripe access token.
   This token is stored in the Insights `Integration` model (`sensitive_config.access_token`)
   and is used server-side for data imports and for writing secrets to Stripe.

2. **Insights OAuth** (Insights → Stripe Secret Store):
   immediately after the Stripe token exchange,
   the Insights backend creates a Insights OAuth access + refresh token pair
   (scoped to the team) and writes them — along with the region (`us`/`eu`) —
   into Stripe's Secret Store via the Stripe API.
   The Stripe App reads these secrets at runtime to call Insights APIs.

The three secrets stored in Stripe are:

| Secret name             | Value                 |
| ----------------------- | --------------------- |
| `insights_region`        | `us` or `eu`          |
| `insights_access_token`  | Insights OAuth token   |
| `insights_refresh_token` | Insights OAuth refresh |

### Insights backend

Key files:

- `insights/models/integration.py` — `StripeIntegration` class: writes and clears secrets in Stripe
- `insights/api/integration.py` — triggers `write_insights_secrets()` after Stripe OAuth callback
- `insights/settings/integrations.py` — env vars (`STRIPE_APP_CLIENT_ID`, `STRIPE_APP_SECRET_KEY`,
  `STRIPE_POSTFN_OAUTH_CLIENT_ID`, `STRIPE_APP_OVERRIDE_AUTHORIZE_URL`)

### Stripe App (this directory)

- `src/insights/auth.ts` — reads/writes/clears credentials in Stripe's Secret Store
- `src/insights/client.ts` — authenticated HTTP client for Insights APIs
- `src/components/InsightsConnect.tsx` — connection status UI + dev-mode token entry
- `src/views/` — Stripe Dashboard view entry points (Home, FullPage, Settings, Onboarding)
- `src/fullPage/` — tabs, data fetching, and helper components for the full-page view
- `src/constants.ts` — typed access to manifest constants (Insights URLs)

### Full Page view

The full-page view (`stripe.dashboard.fullpage` viewport, entry in `src/views/FullPage.tsx`)
renders a five-tab Insights dashboard inside Stripe: Overview, Events, Experiments,
Feature flags, Sessions. Overview shows web-analytics-style stat cards (visitors / views /
sessions / bounce rate) wired to the Insights `WebOverviewQuery`, plus trends/funnel/lists.
Experiments and Feature flags are wired to real Insights API endpoints; Events and Sessions
are mock fixtures that can be swapped for real data later.

This viewport is part of Stripe's **alpha**-stage Full Page Apps feature and is gated per
`app_id` + `account_id`. If the dashboard redirects to home when visiting
`/app/com.insights.stripe`, ask Stripe to enable the feature flag for your merchant account.

Real data paths require two things in Stripe's Secret Store:

| Secret name          | Value                                         |
| -------------------- | --------------------------------------------- |
| `insights_project_id` | Numeric Insights project ID used for API calls |

…in addition to the OAuth credentials above. The Insights backend writes `insights_project_id`
alongside the tokens. When missing, the Experiments / Feature flags tabs render a "not linked"
banner and the Overview falls back to mock summaries.

In dev mode, open the Stripe Dashboard and navigate to `/app/com.insights.stripe` (append a
tab id like `/app/com.insights.stripe/overview` to deep-link directly into a tab).

### Manifest files

- `stripe-app.json` — production manifest: Insights URLs, permissions, CSP
- `stripe-app.dev.json` — extends the production manifest, overrides URLs to `localhost:8010`

## Development

### Prerequisites

- [Stripe CLI](https://docs.stripe.com/stripe-cli) installed and authenticated (`stripe login`)
- Insights running locally on `localhost:8010`

### Running the app locally

You can configure phrocs to include the stripe app in your configuration when running `insightscli dev:setup`. If you don't wanna change your phrocs setup, however, you can run it manually

```bash
# Via insightscli (recommended — also starts via phrocs)
insightscli start:stripe:app

# Or directly
pnpm --filter=@hanzo/stripe dev
```

This runs `stripe apps start --manifest stripe-app.dev.json`,
which serves the app UI inside the Stripe Dashboard in test mode.

### Connecting to Insights locally

There are two approaches depending on whether you need to test the OAuth flow itself.

#### Quick approach: paste tokens from the startup logs

The dev server automatically generates Insights OAuth tokens on startup
(via `manage.py generate_stripe_app_tokens`).
You'll see the tokens printed in the logs when the server starts — no manual command needed.

The tokens are reused across restarts as long as they haven't expired (24 hours).
If you need fresh ones, run the command manually with `--force`:

```bash
python manage.py generate_stripe_app_tokens --team-id=1 --force
```

On first run, if `STRIPE_POSTFN_OAUTH_CLIENT_ID` is not set,
the command will automatically create an `OAuthApplication`
and write its `client_id` to your `.env`.

To connect the app:

1. Look for the token output in the dev server logs (or phrocs `stripe-app` pane).
2. In the Stripe Dashboard, navigate to the Insights app
   (it runs in test mode when started via `stripe apps start`).
   The "Not connected" screen shows a **Dev mode** section at the bottom
   with fields for region, access token, and refresh token.
3. Paste the values and click **Save tokens**.

The app stores them in Stripe's Secret Store just like the production flow would,
and the connection is established.

By default the startup script uses team ID 1.
Pass a different ID as an argument: `bin/start-stripe-app 42`.

#### Full approach: test the complete OAuth flow

If you need to test the actual double OAuth exchange end-to-end,
you need to work around the fact that Stripe's OAuth redirect cannot target `localhost`.
The trick is to temporarily route through a production URL and then redirect back locally.

1. **Set up environment variables** in your `.env`:

   ```bash
   STRIPE_APP_CLIENT_ID=ca_...           # from Stripe Apps dashboard
   STRIPE_APP_SECRET_KEY=sk_test_...     # from Stripe API keys
   STRIPE_POSTFN_OAUTH_CLIENT_ID=...   # auto-created by the management command, or create manually
   STRIPE_APP_OVERRIDE_AUTHORIZE_URL=https://marketplace.stripe.com/oauth/v2/chnlink_.../authorize
   ```

   The `STRIPE_APP_OVERRIDE_AUTHORIZE_URL` must be a channel link URL
   (not the standard marketplace URL) because channel links allow
   non-published app versions to be installed.

2. **Start the OAuth flow** from Insights (localhost:8010).
   Insights redirects to Stripe's authorize page.

3. **Stripe redirects back** to the `redirect_uri` — which is derived from `SITE_URL`
   and will be `https://localhost:8010/integrations/stripe/callback`
   (or `https://us.hanzo.ai/...` if that's your `SITE_URL`).

   Since Stripe requires HTTPS redirect URIs,
   and `localhost` doesn't have a valid HTTPS certificate,
   you have two options:

   a. **Temporarily set `SITE_URL` to a production URL** (e.g. `https://us.hanzo.ai`),
   start the OAuth flow, then once Stripe redirects to that production URL,
   copy the callback URL from the browser, change the host to `localhost:8010`,
   and paste it into your browser to complete the flow locally.

   b. **Use a tunnel** (e.g. ngrok, Cloudflare Tunnel) to expose your local Insights
   on a public HTTPS URL and set `SITE_URL` to that URL.

4. **Insights completes the exchange**: exchanges the authorization code for a Stripe access token,
   creates Insights OAuth tokens, and writes all three secrets to Stripe's Secret Store.

The full approach is more involved but tests the entire production flow.
For day-to-day development, the quick approach is recommended.

### Uploading

**You must bump the version in `stripe-app.json` before uploading.**
Stripe rejects uploads with an already-published version number.
Use semver: bump the patch for fixes, minor for new fields/features, major for breaking changes.

```bash
# 1. Bump "version" in stripe-app.json
# 2. Upload
cd services/stripe-app
pnpm run upload
```

This creates a `package-lock.json` (required by Stripe) and uploads the app.

## Environment variables

| Variable                            | Description                                                               |
| ----------------------------------- | ------------------------------------------------------------------------- |
| `STRIPE_APP_CLIENT_ID`              | Stripe App OAuth client ID (from Stripe Apps dashboard)                   |
| `STRIPE_APP_SECRET_KEY`             | Stripe API secret key for token exchange                                  |
| `STRIPE_POSTFN_OAUTH_CLIENT_ID`    | Client ID of the Insights OAuthApplication used by the Stripe App          |
| `STRIPE_APP_OVERRIDE_AUTHORIZE_URL` | Channel link authorize URL (required for non-published app installations) |
