import { getAppContext } from './getAppContext'

export function apiHostOrigin(): string {
    const appOrigin = window.location.origin
    if (appOrigin === 'https://insights.hanzo.ai') {
        return 'https://us.i.hanzo.ai'
    } else if (appOrigin === 'https://insights.hanzo.ai') {
        return 'https://eu.i.hanzo.ai'
    }
    return appOrigin
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
