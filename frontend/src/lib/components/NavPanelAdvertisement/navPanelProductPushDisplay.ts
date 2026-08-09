import { pngHoggie } from 'lib/brand/hoggies'

import { ProductKey } from '~/queries/schema/schema-general'

import type { ProductPushDisplay } from './navPanelAdShared'

const MascotChart = pngHoggie()
const MascotCodeBubble = pngHoggie()
const MascotCursor = pngHoggie()
const MascotDirector = pngHoggie()
const MascotExperiment = pngHoggie()
const MascotJudge = pngHoggie()
const MascotMegaphone = pngHoggie()
const MascotNoir = pngHoggie()
const MascotPanic = pngHoggie()
const MascotPhoneCall = pngHoggie()
const MascotPuzzle = pngHoggie()
const MascotRobot = pngHoggie()
const MascotTrafficController = pngHoggie()
const MascotWizard = pngHoggie()
const MascotWorkflows = pngHoggie()

export const DEFAULT_PRODUCT_PUSH_DISPLAY: ProductPushDisplay = {
    Hoggie: MascotMegaphone,
    accentColor: 'var(--color-accent)',
    tagline:
        "We think your organization would get a lot out of this product - it works with the data you're already sending. Give it a try!",
}

// One entry per pushable product (see BLESSED_PRODUCT_ORDER / FALLBACK_PRODUCT_ORDER in
// products/growth/backend/product_push/selection.py). Products missing here fall back to
// DEFAULT_PRODUCT_PUSH_DISPLAY, so TAM-scheduled pushes of unlisted products still render.
export const PRODUCT_PUSH_DISPLAY: Partial<Record<ProductKey, ProductPushDisplay>> = {
    [ProductKey.PRODUCT_ANALYTICS]: {
        Hoggie: MascotChart,
        accentColor: 'var(--color-product-product-analytics-light)',
        tagline:
            'Insights, funnels, trends, and retention - understand exactly what users do in your product, with the events you already send.',
    },
    [ProductKey.WEB_ANALYTICS]: {
        Hoggie: MascotCursor,
        accentColor: 'var(--color-product-web-analytics-light)',
        tagline:
            'Visitors, pageviews, and conversions on one simple dashboard. Like GA, without the pain - and no extra setup, ready for you to use.',
    },
    [ProductKey.SESSION_REPLAY]: {
        Hoggie: MascotDirector,
        accentColor: 'var(--color-product-session-replay-light)',
        tagline:
            'Lights, camera, action - watch real users move through your product and see exactly where they get stuck.',
    },
    [ProductKey.ERROR_TRACKING]: {
        Hoggie: MascotPanic,
        accentColor: 'var(--color-product-error-tracking-light)',
        tagline:
            'Catch exceptions before your users tweet about them - errors grouped, triaged, and linked to the sessions that hit them.',
    },
    [ProductKey.FEATURE_FLAGS]: {
        Hoggie: MascotTrafficController,
        accentColor: 'var(--color-product-feature-flags-light)',
        tagline: 'Ship to 1% before you ship to everyone. Roll out, target, and roll back - no redeploys needed.',
    },
    [ProductKey.EXPERIMENTS]: {
        Hoggie: MascotExperiment,
        accentColor: 'var(--color-product-experiments-light)',
        tagline: 'Stop debating, start testing. Run A/B tests on real users and let the data settle the argument.',
    },
    [ProductKey.CONVERSATIONS]: {
        Hoggie: MascotPhoneCall,
        accentColor: 'var(--color-product-support-light)',
        tagline:
            'Talk to users right inside your product, with their session and event history next to every conversation.',
    },
    [ProductKey.DATA_WAREHOUSE]: {
        Hoggie: MascotCodeBubble,
        accentColor: 'var(--color-product-data-warehouse-light)',
        tagline:
            'Query everything with SQL - your product events plus warehouse sources like Stripe, HubSpot, and Postgres.',
    },
    [ProductKey.AI_OBSERVABILITY]: {
        Hoggie: MascotRobot,
        accentColor: 'var(--color-product-llm-analytics-light)',
        tagline:
            "Traces, costs, and latency for every LLM call - know what your AI is doing, and what it's costing you.",
    },
    [ProductKey.LLM_CLUSTERS]: {
        Hoggie: MascotPuzzle,
        accentColor: 'var(--color-product-llm-clusters-light)',
        tagline: 'Thousands of AI conversations, automatically grouped into patterns you can actually act on.',
    },
    [ProductKey.LLM_EVALUATIONS]: {
        Hoggie: MascotJudge,
        accentColor: 'var(--color-product-llm-evaluations-light)',
        tagline: 'Grade your LLM outputs at scale and catch regressions before your users do.',
    },
    [ProductKey.LLM_PROMPTS]: {
        Hoggie: MascotWizard,
        accentColor: 'var(--color-product-llm-analytics-light)',
        tagline: 'Version, test, and ship prompt changes without redeploying your app. A little magic, fully tracked.',
    },
    [ProductKey.LOGS]: {
        Hoggie: MascotNoir,
        accentColor: 'var(--color-product-logs-light)',
        tagline: 'Search every log line alongside your product data - no mystery goes unsolved.',
    },
    [ProductKey.WORKFLOWS]: {
        Hoggie: MascotWorkflows,
        accentColor: 'var(--color-product-workflows-light)',
        tagline: 'Automate messages and actions triggered by what users actually do in your product.',
    },
}

export function getProductPushDisplay(productKey: string): ProductPushDisplay {
    return PRODUCT_PUSH_DISPLAY[productKey as ProductKey] ?? DEFAULT_PRODUCT_PUSH_DISPLAY
}
