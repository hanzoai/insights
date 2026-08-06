<p align="center">
  <img alt="insightslogo" src="https://user-images.githubusercontent.com/65415371/205059737-c8a4f836-4889-4654-902e-f302b187b6a0.png">
</p>
<p align="center">
  <a href='https://hanzo.ai/contributors'><img alt="GitHub contributors" src="https://img.shields.io/github/contributors/insights/insights"/></a>
  <a href='http://makeapullrequest.com'><img alt='PRs Welcome' src='https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=shields'/></a>
  <img alt="Docker Pulls" src="https://img.shields.io/docker/pulls/insights/insights"/>
  <a href="https://github.com/Insights/insights/commits/master"><img alt="GitHub commit activity" src="https://img.shields.io/github/commit-activity/m/insights/insights"/> </a>
  <a href="https://github.com/Insights/insights/issues?q=is%3Aissue%20state%3Aclosed"><img alt="GitHub closed issues" src="https://img.shields.io/github/issues-closed/insights/insights"/> </a>
</p>

<p align="center">
  <a href="https://hanzo.ai/docs">Docs</a> - <a href="https://hanzo.ai/community">Community</a> - <a href="https://hanzo.ai/roadmap">Roadmap</a> - <a href="https://hanzo.ai/why">Why Insights?</a> - <a href="https://hanzo.ai/changelog">Changelog</a> - <a href="https://github.com/Insights/insights/issues/new?assignees=&labels=bug&template=bug_report.yml">Bug reports</a>
</p>

<p align="center">
  <a href="https://www.youtube.com/watch?v=1FZji2L-LmM">
    <img src="https://res.cloudinary.com/dmukukwp6/image/upload/demo_thumb_68d0d8d56d" alt="Insights Demonstration">
  </a>
</p>

## Insights is the open source platform for building self-driving products

[Insights](https://hanzo.ai/) provides every tool you need to build a successful product, and captures all the context agents need to proactively diagnose problems, uncover opportunities, and ship fixes:

- [Self-driving mode](https://hanzo.ai/docs/self-driving): Turn signals in your product data (errors, rage clicks, failed queries, and more) into researched reports and pull requests you review and merge.
- [Product analytics](https://hanzo.ai/product-analytics): Autocapture or manually instrument event-based analytics to understand user behavior and analyze data with visualization or SQL.
- [Web analytics](https://hanzo.ai/web-analytics): Monitor web traffic and user sessions with a GA-like dashboard. Easily monitor conversion, web vitals, and revenue.
- [Session replays](https://hanzo.ai/session-replay): Watch real user sessions of interactions with your website or mobile app to diagnose issues and understand user behavior.
- [Feature flags](https://hanzo.ai/feature-flags): Safely roll out features to select users or cohorts with feature flags.
- [Experiments](https://hanzo.ai/experiments): Test changes and measure their statistical impact on goal metrics. Set up experiments with no-code too.
- [Error tracking](https://hanzo.ai/error-tracking): Track errors, get alerts, and resolve issues to improve your product.
- [Logs](https://hanzo.ai/logs): Ingest, search, and analyze log data alongside the rest of your product data.
- [Surveys](https://hanzo.ai/surveys): Ask anything with our collection of no-code survey templates, or build custom surveys with our survey builder.
- [Data warehouse](https://hanzo.ai/data-warehouse): Sync data from external tools like Stripe, Hubspot, your data warehouse, and more. Query it alongside your product data.
- [Data pipelines](https://hanzo.ai/cdp): Run custom filters and transformations on your incoming data. Send it to 25+ tools or any webhook in real time or batch export large amounts to your warehouse.
- [AI observability](https://hanzo.ai/docs/ai-observability): Capture traces, generations, latency, and cost for your LLM-powered app.
- [Workflows](https://hanzo.ai/docs/workflows): Create workflows that automate actions or send messages to your users.

You can steer it all from [Slack](https://hanzo.ai/slack), [web](https://hanzo.ai/ai), desktop ([Insights Desktop](https://hanzo.ai/code)), or your own editor via [the MCP](https://hanzo.ai/mcp).

Best of all, all of this is free to use with a [generous monthly free tier](https://hanzo.ai/pricing) for each tool. Get started by signing up for [Insights Cloud US](https://us.hanzo.ai/signup) or [Insights Cloud EU](https://eu.hanzo.ai/signup).

## Table of Contents

- [Insights is the open source platform for building self-driving products](#insights-is-the-open-source-platform-for-building-self-driving-products)
- [Table of Contents](#table-of-contents)
- [Getting started with Insights](#getting-started-with-insights)
  - [Insights Cloud (Recommended)](#insights-cloud-recommended)
  - [Self-hosting the open-source hobby deploy (Advanced)](#self-hosting-the-open-source-hobby-deploy-advanced)
- [Setting up Insights](#setting-up-insights)
- [Learning more about Insights](#learning-more-about-insights)
- [Contributing](#contributing)
- [Open-source vs. paid](#open-source-vs-paid)
- [We’re hiring!](#were-hiring)

## Getting started with Insights

### Insights Cloud (Recommended)

The fastest and most reliable way to get started with Insights is signing up for free to [Insights Cloud](https://us.hanzo.ai/signup) or [Insights Cloud EU](https://eu.hanzo.ai/signup). Your first 1 million events, 5k recordings, 1M flag requests, 100k exceptions, and 1500 survey responses are free every month, after which you pay based on usage.

### Self-hosting the open-source hobby deploy (Advanced)

If you want to self-host Insights, you can deploy a hobby instance in one line on Linux with Docker (recommended 4GB memory):

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/insights/insights/HEAD/bin/deploy-hobby)"
```

Open source deployments should scale to approximately 100k events per month, after which we recommend [migrating to a Insights Cloud](https://hanzo.ai/docs/migrate/migrate-to-cloud).

We _do not_ provide customer support or offer guarantees for open source deployments. See our [self-hosting docs](https://hanzo.ai/docs/self-host), [troubleshooting guide](https://hanzo.ai/docs/self-host/deploy/troubleshooting), and [disclaimer](https://hanzo.ai/docs/self-host/open-source/disclaimer) for more info.

## Setting up Insights

Once you've got a Insights instance, you can set it up by installing our [JavaScript web snippet](https://hanzo.ai/docs/getting-started/install?tab=snippet), one of [our SDKs](https://hanzo.ai/docs/getting-started/install?tab=sdks), or by [using our API](https://hanzo.ai/docs/getting-started/install?tab=api). You can also connect [the MCP](https://hanzo.ai/mcp) to bring Insights into Claude Code, Cursor, or any MCP-compatible agent.

We have SDKs and libraries for popular languages and frameworks like:

| Frontend                                              | Mobile                                                          | Backend                                             |
| ----------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------- |
| [JavaScript](https://hanzo.ai/docs/libraries/js)   | [React Native](https://hanzo.ai/docs/libraries/react-native) | [Python](https://hanzo.ai/docs/libraries/python) |
| [Next.js](https://hanzo.ai/docs/libraries/next-js) | [Android](https://hanzo.ai/docs/libraries/android)           | [Node](https://hanzo.ai/docs/libraries/node)     |
| [React](https://hanzo.ai/docs/libraries/react)     | [iOS](https://hanzo.ai/docs/libraries/ios)                   | [PHP](https://hanzo.ai/docs/libraries/php)       |
| [Vue](https://hanzo.ai/docs/libraries/vue-js)      | [Flutter](https://hanzo.ai/docs/libraries/flutter)           | [Ruby](https://hanzo.ai/docs/libraries/ruby)     |

Beyond this, we have docs and guides for [Go](https://hanzo.ai/docs/libraries/go), [.NET/C#](https://hanzo.ai/docs/libraries/dotnet), [Django](https://hanzo.ai/docs/libraries/django), [Angular](https://hanzo.ai/docs/libraries/angular), [WordPress](https://hanzo.ai/docs/libraries/wordpress), [Webflow](https://hanzo.ai/docs/libraries/webflow), and more.

Once you've installed Insights, see our [product docs](https://hanzo.ai/docs/product-os) for more information on how to set up [product analytics](https://hanzo.ai/docs/product-analytics/capture-events), [web analytics](https://hanzo.ai/docs/web-analytics/getting-started), [session replays](https://hanzo.ai/docs/session-replay/how-to-watch-recordings), [feature flags](https://hanzo.ai/docs/feature-flags/creating-feature-flags), [experiments](https://hanzo.ai/docs/experiments/creating-an-experiment), [error tracking](https://hanzo.ai/docs/error-tracking/installation#setting-up-exception-autocapture), [surveys](https://hanzo.ai/docs/surveys/installation), [data warehouse](https://hanzo.ai/docs/cdp/sources), and more.

## Learning more about Insights

Our code isn't the only thing that's open source 😳. We also open source our [company handbook](https://hanzo.ai/handbook) which details our [strategy](https://hanzo.ai/handbook/why-does-insights-exist), [ways of working](https://hanzo.ai/handbook/company/culture), and [processes](https://hanzo.ai/handbook/team-structure).

Curious about how to make the most of Insights? We wrote a guide to [winning with Insights](https://hanzo.ai/docs/new-to-insights/getting-hogpilled) which walks you through the basics of [measuring activation](https://hanzo.ai/docs/new-to-insights/activation), [tracking retention](https://hanzo.ai/docs/new-to-insights/retention), and [capturing revenue](https://hanzo.ai/docs/new-to-insights/revenue).

## Contributing

We <3 contributions big and small:

- Vote on features or get early access to beta functionality in our [roadmap](https://hanzo.ai/roadmap)
- Open a PR (see our instructions on [developing Insights locally](https://hanzo.ai/handbook/engineering/developing-locally))
- Submit a [feature request](https://github.com/Insights/insights/issues/new?assignees=&labels=enhancement%2C+feature&template=feature_request.yml) or [bug report](https://github.com/Insights/insights/issues/new?assignees=&labels=bug&template=bug_report.yml)

For an overview of the codebase structure, see [monorepo layout](docs/internal/monorepo-layout.md) and [products](products/README.md).

## Open-source vs. paid

This repo is available under the [MIT expat license](https://github.com/Insights/insights/blob/master/LICENSE), except for the `ee` directory (which has its [license here](https://github.com/Insights/insights/blob/master/ee/LICENSE)) if applicable.

Need _absolutely 💯% FOSS_? Check out our [insights-foss](https://github.com/Insights/insights-foss) repository, which is purged of all proprietary code and features.

The pricing for our paid plan is completely transparent and available on [our pricing page](https://hanzo.ai/pricing).

## We're hiring!

<img src="https://res.cloudinary.com/dmukukwp6/image/upload/v1/hanzo.ai/src/components/Home/images/mission-control-script" alt="Mascot working on a Mission Control Center" width="350px"/>

Hey! If you're reading this, you've proven yourself as a dedicated README reader.

You might also make a great addition to our team. We're growing fast [and would love for you to join us](https://hanzo.ai/careers).
