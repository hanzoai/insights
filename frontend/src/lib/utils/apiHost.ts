import { getAppContext } from './getAppContext'

export function apiHostOrigin(): string {
    // ONE endpoint. Upstream shipped a us/eu region split; the debrand rewrote
    // both hosts but not the branching, so
    // this ended up testing the SAME origin twice — the second arm was dead code
    // and neither host exists in our stack. The snippet it generated told every
    // customer to POST to us.i.hanzo.ai, which resolves nowhere.
    //
    // Hanzo has one API front door for every property and every region.
    if (window.location.origin === 'https://insights.hanzo.ai') {
        return 'https://api.hanzo.ai'
    }
    return window.location.origin
}

export function liveEventsHostOrigin(): string | null {
    const appOrigin = window.location.origin
    const appContext = getAppContext()

    if (appOrigin === 'https://insights.hanzo.ai') {
        return 'https://live.insights.hanzo.ai'
    } else if (appOrigin === 'https://insights.hanzo.ai') {
        return 'https://live.insights.hanzo.ai'
    } else if (appOrigin === 'https://app.dev.insights.dev') {
        return 'https://live.dev.insights.dev'
    } else if (process.env.STORYBOOK) {
        return 'http://localhost:6006'
    }

    return appContext?.livestream_host || 'http://localhost:8666'
}

export function publicWebhooksHostOrigin(): string | null {
    const appOrigin = window.location.origin

    if (appOrigin === 'https://insights.hanzo.ai') {
        return 'https://webhooks.insights.hanzo.ai'
    } else if (appOrigin === 'https://insights.hanzo.ai') {
        return 'https://webhooks.insights.hanzo.ai'
    } else if (appOrigin === 'https://app.dev.insights.dev') {
        return 'https://webhooks.dev.insights.dev'
    }

    return appOrigin
}
