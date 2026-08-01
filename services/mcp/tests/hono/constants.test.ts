import { afterEach, describe, expect, it } from 'vitest'

import {
    POSTFN_EU_BASE_URL,
    POSTFN_US_BASE_URL,
    USER_AGENT,
    getAuthorizationServerUrl,
    getBaseUrlForRegion,
    getCustomApiBaseUrl,
    getEnv,
    getPublicBaseUrl,
    getUserAgent,
    toCloudRegion,
} from '@/hono/constants'

describe('Hono Constants', () => {
    const originalEnv = { ...process.env }

    afterEach(() => {
        process.env = { ...originalEnv }
    })

    describe('toCloudRegion', () => {
        it.each([
            ['eu', 'eu'],
            ['EU', 'eu'],
            ['Eu', 'eu'],
            ['us', 'us'],
            ['US', 'us'],
            [undefined, 'us'],
            [null, 'us'],
            ['invalid', 'us'],
            ['', 'us'],
        ] as const)('should return %s for input %s', (input, expected) => {
            expect(toCloudRegion(input as string | undefined | null)).toBe(expected)
        })
    })

    describe('getBaseUrlForRegion', () => {
        it('should return EU URL for eu region', () => {
            expect(getBaseUrlForRegion('eu')).toBe(POSTFN_EU_BASE_URL)
        })

        it('should return US URL for us region', () => {
            expect(getBaseUrlForRegion('us')).toBe(POSTFN_US_BASE_URL)
        })
    })

    describe('getCustomApiBaseUrl', () => {
        it('should return undefined when env var not set', () => {
            delete process.env.POSTFN_API_BASE_URL
            expect(getCustomApiBaseUrl()).toBeUndefined()
        })

        it('should return the env var value when set', () => {
            process.env.POSTFN_API_BASE_URL = 'https://custom.hanzo.ai'
            expect(getCustomApiBaseUrl()).toBe('https://custom.hanzo.ai')
        })
    })

    describe('getPublicBaseUrl', () => {
        it('returns POSTFN_PUBLIC_URL when set, even if POSTFN_API_BASE_URL is also set', () => {
            process.env.POSTFN_API_BASE_URL = 'http://insights-web-django.insights.svc.cluster.local:8000'
            process.env.POSTFN_PUBLIC_URL = 'https://us.hanzo.ai'
            expect(getPublicBaseUrl()).toBe('https://us.hanzo.ai')
        })

        it('falls back to POSTFN_API_BASE_URL when POSTFN_PUBLIC_URL is unset', () => {
            process.env.POSTFN_API_BASE_URL = 'https://us.hanzo.ai'
            delete process.env.POSTFN_PUBLIC_URL
            expect(getPublicBaseUrl()).toBe('https://us.hanzo.ai')
        })

        it('returns undefined when neither env var is set', () => {
            delete process.env.POSTFN_API_BASE_URL
            delete process.env.POSTFN_PUBLIC_URL
            expect(getPublicBaseUrl()).toBeUndefined()
        })
    })

    describe('getAuthorizationServerUrl', () => {
        it('should return localhost URL when POSTFN_API_BASE_URL is localhost', () => {
            process.env.POSTFN_API_BASE_URL = 'http://localhost:8010'
            expect(getAuthorizationServerUrl()).toBe('http://localhost:8010')
        })

        it('should return oauth proxy URL when POSTFN_API_BASE_URL is a cloud URL', () => {
            process.env.POSTFN_API_BASE_URL = 'https://us.hanzo.ai'
            expect(getAuthorizationServerUrl()).toBe('https://oauth.hanzo.ai')
        })

        it('should return oauth proxy URL when POSTFN_API_BASE_URL is an internal cluster URL', () => {
            process.env.POSTFN_API_BASE_URL = 'http://insights-web-django.insights.svc.cluster.local:8000'
            expect(getAuthorizationServerUrl()).toBe('https://oauth.hanzo.ai')
        })

        it('should return self-hosted URL when POSTFN_API_BASE_URL is a custom domain', () => {
            process.env.POSTFN_API_BASE_URL = 'https://insights.example.com'
            expect(getAuthorizationServerUrl()).toBe('https://insights.example.com')
        })

        it('should return oauth proxy URL when no custom URL', () => {
            delete process.env.POSTFN_API_BASE_URL
            expect(getAuthorizationServerUrl()).toBe('https://oauth.hanzo.ai')
        })
    })

    describe('getUserAgent', () => {
        it('should return base user agent when no options', () => {
            expect(getUserAgent()).toBe(USER_AGENT)
        })

        it('should append insights client info when present', () => {
            expect(getUserAgent({ clientUserAgent: 'insights/web-client-1.0' })).toContain('for insights/web-client-1')
        })

        it('should return base user agent for non-insights clients', () => {
            expect(getUserAgent({ clientUserAgent: 'Mozilla/5.0' })).toBe(USER_AGENT)
        })

        it('should prepend consumer/client token when mcpConsumer is set', () => {
            const ua = getUserAgent({ mcpConsumer: 'insights-code', mcpClientName: 'claude-code' })
            expect(ua).toMatch(/^insights-code\/claude-code insights\/mcp-server/)
        })

        it('should use "unknown" for mcpClientName when not provided', () => {
            const ua = getUserAgent({ mcpConsumer: 'my-app' })
            expect(ua).toMatch(/^my-app\/unknown insights\/mcp-server/)
        })
    })

    describe('getEnv', () => {
        it('should return env vars from process.env', () => {
            process.env.POSTFN_ANALYTICS_API_KEY = 'test-key'
            const env = getEnv()
            expect(env.POSTFN_ANALYTICS_API_KEY).toBe('test-key')
        })

        it('should return undefined for unset env vars', () => {
            delete process.env.POSTFN_ANALYTICS_API_KEY
            delete process.env.POSTFN_API_BASE_URL
            const env = getEnv()
            expect(env.POSTFN_ANALYTICS_API_KEY).toBeUndefined()
            expect(env.POSTFN_API_BASE_URL).toBeUndefined()
        })

        it('should return all expected fields', () => {
            const env = getEnv()
            expect(env).toHaveProperty('POSTFN_API_BASE_URL')
            expect(env).toHaveProperty('POSTFN_PUBLIC_URL')
            expect(env).toHaveProperty('MCP_APPS_BASE_URL')
            expect(env).toHaveProperty('POSTFN_MCP_APPS_ANALYTICS_BASE_URL')
            expect(env).toHaveProperty('POSTFN_UI_APPS_TOKEN')
            expect(env).toHaveProperty('POSTFN_ANALYTICS_API_KEY')
            expect(env).toHaveProperty('POSTFN_ANALYTICS_HOST')
        })
    })
})
