"use strict";
const posthog = require('posthog-node');

class Insights extends posthog.PostHog {}

module.exports = { ...posthog, Insights, PostHog: posthog.PostHog };
