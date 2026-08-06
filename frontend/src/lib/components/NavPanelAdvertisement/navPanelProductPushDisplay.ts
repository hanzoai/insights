import * as chart from '@hanzo/brand/hoggies/png/chart'
import * as codeBubble from '@hanzo/brand/hoggies/png/code-bubble'
import * as cursor from '@hanzo/brand/hoggies/png/cursor'
import * as director from '@hanzo/brand/hoggies/png/director'
import * as experiment from '@hanzo/brand/hoggies/png/experiment'
import * as judge from '@hanzo/brand/hoggies/png/judge'
import * as megaphone from '@hanzo/brand/hoggies/png/megaphone'
import * as noir from '@hanzo/brand/hoggies/png/noir-1'
import * as panic from '@hanzo/brand/hoggies/png/panic'
import * as phoneCall from '@hanzo/brand/hoggies/png/phone-call'
import * as puzzle from '@hanzo/brand/hoggies/png/puzzle'
import * as robot from '@hanzo/brand/hoggies/png/robot'
import * as trafficController from '@hanzo/brand/hoggies/png/traffic-controller'
import * as wizard from '@hanzo/brand/hoggies/png/wizard-1'
import * as workflows from '@hanzo/brand/hoggies/png/workflows'

import { pngHoggie } from 'lib/brand/hoggies'

import { ProductKey } from '~/queries/schema/schema-general'

import type { ProductPushDisplay } from './navPanelAdShared'

const MascotChart = pngHoggie(chart)
const MascotCodeBubble = pngHoggie(codeBubble)
const MascotCursor = pngHoggie(cursor)
const MascotDirector = pngHoggie(director)
const MascotExperiment = pngHoggie(experiment)
const MascotJudge = pngHoggie(judge)
const MascotMegaphone = pngHoggie(megaphone)
const MascotNoir = pngHoggie(noir)
const MascotPanic = pngHoggie(panic)
const MascotPhoneCall = pngHoggie(phoneCall)
const MascotPuzzle = pngHoggie(puzzle)
const MascotRobot = pngHoggie(robot)
const MascotTrafficController = pngHoggie(trafficController)
const MascotWizard = pngHoggie(wizard)
const MascotWorkflows = pngHoggie(workflows)

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
        accentColor: 'var(--color-product-llm-prompts-light)',
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
