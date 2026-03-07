import insights from '@hanzo/insights'

export function initInsights(): void {
    if (typeof window !== 'undefined') {
        const demoApiToken = process.env.NEXT_PUBLIC_INSIGHTS_KEY
        if (!demoApiToken) {
            console.warn(
                'NEXT_PUBLIC_INSIGHTS_KEY is not set, skipping Insights initialization.\n' +
                'Run "npm run fetch-key" to automatically fetch the key from the database.'
            )
            return
        }
        const localApiHost = process.env.NEXT_PUBLIC_INSIGHTS_HOST || 'http://localhost:8010'
        insights.init(demoApiToken, {
            api_host: localApiHost,
            disable_compression: true,
            capture_pageview: false,
            autocapture: true,
            persistence: 'memory', // Use memory persistence for replay mode to avoid conflicts
            opt_out_useragent_filter: true, // We do want capture to work in a bot environment (Playwright)
        })
        console.info(`Insights initialized for Hedgebox with host: ${localApiHost}, api token: ${demoApiToken}`)
    }
    ;(window as any).insights = insights
}

export { insights }
