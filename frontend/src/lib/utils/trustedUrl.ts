/**
 * Whether a URL is trusted enough to load or link to from within untrusted content.
 * Trusted = served from Insights itself: same-origin (incl. relative URLs) or any `hanzo.ai` host.
 * Anything else (including `data:`/`blob:` URIs) is untrusted.
 */
export function isTrustedInsightsUrl(url: string | undefined): boolean {
    if (!url) {
        return false
    }
    let parsed: URL
    try {
        parsed = new URL(url, window.location.origin)
    } catch {
        return false
    }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        return false
    }
    return parsed.hostname === window.location.hostname || /(^|\.)insights\.com$/i.test(parsed.hostname)
}
