import { afterEach, describe, expect, it } from 'vitest'

import {
    getAuthorizationServerUrl,
    getBaseUrlForRegion,
    getPublicBaseUrl,
    isCloudApi,
    isLocalApi,
    toCloudRegion,
} from '@/lib/constants'

describe('OAuth Region Routing', () => {
    const originalEnv = { ...process.env }

    afterEach(() => {
        process.env = { ...originalEnv }
    })

    describe('isLocalApi', () => {
        it('returns true when POSTFN_API_BASE_URL is localhost', () => {
            process.env.POSTFN_API_BASE_URL = 'http://localhost:8010'
            expect(isLocalApi()).toBe(true)
        })

        it('returns false when POSTFN_API_BASE_URL is a cloud URL', () => {
            process.env.POSTFN_API_BASE_URL = 'https://us.hanzo.ai'
            expect(isLocalApi()).toBe(false)
        })

        it('returns false when POSTFN_API_BASE_URL is not set', () => {
            delete process.env.POSTFN_API_BASE_URL
            expect(isLocalApi()).toBe(false)
        })
    })

    describe('isCloudApi', () => {
        it('returns true when POSTFN_API_BASE_URL is not set', () => {
            delete process.env.POSTFN_API_BASE_URL
            expect(isCloudApi()).toBe(true)
        })

        it('returns true for us.hanzo.ai', () => {
            process.env.POSTFN_API_BASE_URL = 'https://us.hanzo.ai'
            expect(isCloudApi()).toBe(true)
        })

        it('returns true for eu.hanzo.ai', () => {
            process.env.POSTFN_API_BASE_URL = 'https://eu.hanzo.ai'
            expect(isCloudApi()).toBe(true)
        })

        it('returns true for internal cluster URL', () => {
            process.env.POSTFN_API_BASE_URL = 'http://insights-web-django.insights.svc.cluster.local:8000'
            expect(isCloudApi()).toBe(true)
        })

        it('returns false for self-hosted domain', () => {
            process.env.POSTFN_API_BASE_URL = 'https://insights.example.com'
            expect(isCloudApi()).toBe(false)
        })

        it('returns false for localhost', () => {
            process.env.POSTFN_API_BASE_URL = 'http://localhost:8010'
            expect(isCloudApi()).toBe(false)
        })
    })

    describe('toCloudRegion', () => {
        it.each([
            { input: 'eu', expected: 'eu' },
            { input: 'EU', expected: 'eu' },
            { input: 'Eu', expected: 'eu' },
            { input: 'us', expected: 'us' },
            { input: 'US', expected: 'us' },
            { input: 'unknown', expected: 'us' },
            { input: '', expected: 'us' },
            { input: null, expected: 'us' },
            { input: undefined, expected: 'us' },
        ])('toCloudRegion($input) returns $expected', ({ input, expected }) => {
            expect(toCloudRegion(input)).toBe(expected)
        })
    })

    describe('getBaseUrlForRegion', () => {
        it('returns EU URL for eu region', () => {
            expect(getBaseUrlForRegion('eu')).toBe('https://eu.hanzo.ai')
        })

        it('returns US URL for us region', () => {
            expect(getBaseUrlForRegion('us')).toBe('https://us.hanzo.ai')
        })
    })

    describe('getPublicBaseUrl', () => {
        it('returns POSTFN_PUBLIC_URL when set', () => {
            process.env.POSTFN_API_BASE_URL = 'http://insights-web-django.insights.svc.cluster.local:8000'
            process.env.POSTFN_PUBLIC_URL = 'https://us.hanzo.ai'
            expect(getPublicBaseUrl()).toBe('https://us.hanzo.ai')
        })

        it('falls back to POSTFN_API_BASE_URL when POSTFN_PUBLIC_URL is not set', () => {
            process.env.POSTFN_API_BASE_URL = 'http://localhost:8010'
            delete process.env.POSTFN_PUBLIC_URL
            expect(getPublicBaseUrl()).toBe('http://localhost:8010')
        })

        it('returns undefined when neither is set', () => {
            delete process.env.POSTFN_API_BASE_URL
            delete process.env.POSTFN_PUBLIC_URL
            expect(getPublicBaseUrl()).toBeUndefined()
        })
    })

    describe('getAuthorizationServerUrl', () => {
        it('returns localhost when POSTFN_API_BASE_URL is localhost', () => {
            process.env.POSTFN_API_BASE_URL = 'http://localhost:8010'
            expect(getAuthorizationServerUrl()).toBe('http://localhost:8010')
        })

        it('returns oauth proxy URL when POSTFN_API_BASE_URL is a cloud URL', () => {
            process.env.POSTFN_API_BASE_URL = 'https://us.hanzo.ai'
            expect(getAuthorizationServerUrl()).toBe('https://oauth.hanzo.ai')
        })

        it('returns oauth proxy URL when POSTFN_API_BASE_URL is an internal cluster URL', () => {
            process.env.POSTFN_API_BASE_URL = 'http://insights-web-django.insights.svc.cluster.local:8000'
            expect(getAuthorizationServerUrl()).toBe('https://oauth.hanzo.ai')
        })

        it('returns self-hosted URL when POSTFN_API_BASE_URL is a custom domain', () => {
            process.env.POSTFN_API_BASE_URL = 'https://insights.example.com'
            expect(getAuthorizationServerUrl()).toBe('https://insights.example.com')
        })

        it('returns oauth proxy URL when not set', () => {
            delete process.env.POSTFN_API_BASE_URL
            expect(getAuthorizationServerUrl()).toBe('https://oauth.hanzo.ai')
        })
    })

    describe('401 Response Metadata URL (RFC 9728)', () => {
        // Per RFC 9728, the well-known URL is constructed by inserting the well-known path
        // between the host and the resource path:
        // - Resource /mcp → metadata at /.well-known/oauth-protected-resource/mcp
        // - Resource /sse → metadata at /.well-known/oauth-protected-resource/sse
        //   (the /sse endpoint itself is deprecated and redirects to /mcp, but the
        //   metadata generator stays generic so cached metadata for /sse remains valid)
        const testCases = [
            {
                name: 'includes region param and resource path /mcp in metadata URL',
                requestUrl: 'https://mcp.hanzo.ai/mcp?region=eu',
                expectedMetadataUrl: 'https://mcp.hanzo.ai/.well-known/oauth-protected-resource/mcp?region=eu',
            },
            {
                name: 'includes resource path /mcp when no region param',
                requestUrl: 'https://mcp.hanzo.ai/mcp',
                expectedMetadataUrl: 'https://mcp.hanzo.ai/.well-known/oauth-protected-resource/mcp',
            },
            {
                name: 'includes resource path /sse for legacy SSE endpoint',
                requestUrl: 'https://mcp.hanzo.ai/sse',
                expectedMetadataUrl: 'https://mcp.hanzo.ai/.well-known/oauth-protected-resource/sse',
            },
            {
                name: 'preserves region param with resource path',
                requestUrl: 'https://mcp.hanzo.ai/mcp?features=flags&region=eu',
                expectedMetadataUrl: 'https://mcp.hanzo.ai/.well-known/oauth-protected-resource/mcp?region=eu',
            },
            {
                name: 'normalizes uppercase region to lowercase for consistency',
                requestUrl: 'https://mcp.hanzo.ai/mcp?region=EU',
                expectedMetadataUrl: 'https://mcp.hanzo.ai/.well-known/oauth-protected-resource/mcp?region=eu',
            },
        ]

        it.each(testCases)('$name', ({ requestUrl, expectedMetadataUrl }) => {
            const url = new URL(requestUrl)
            // Matches actual behavior: normalize to lowercase and include if present
            const regionParam = url.searchParams.get('region')?.toLowerCase()

            // Per RFC 9728: insert well-known path between host and resource path
            const metadataUrl = new URL(requestUrl)
            metadataUrl.pathname = `/.well-known/oauth-protected-resource${url.pathname}`
            metadataUrl.search = ''
            if (regionParam) {
                metadataUrl.searchParams.set('region', regionParam)
            }

            expect(metadataUrl.toString()).toBe(expectedMetadataUrl)
        })
    })

    describe('Protected Resource Metadata endpoint (RFC 9728)', () => {
        // Per RFC 9728, the well-known endpoint extracts the resource path from the URL
        // e.g., /.well-known/oauth-protected-resource/mcp → resource is /mcp
        const testCases = [
            {
                name: 'extracts /mcp resource from well-known path',
                wellKnownUrl: 'https://mcp.hanzo.ai/.well-known/oauth-protected-resource/mcp',
                expectedResource: 'https://mcp.hanzo.ai/mcp',
            },
            {
                name: 'extracts /sse resource from well-known path',
                wellKnownUrl: 'https://mcp.hanzo.ai/.well-known/oauth-protected-resource/sse',
                expectedResource: 'https://mcp.hanzo.ai/sse',
            },
            {
                name: 'returns root for well-known without path suffix',
                wellKnownUrl: 'https://mcp.hanzo.ai/.well-known/oauth-protected-resource',
                expectedResource: 'https://mcp.hanzo.ai',
            },
        ]

        it.each(testCases)('$name', ({ wellKnownUrl, expectedResource }) => {
            const wellKnownPrefix = '/.well-known/oauth-protected-resource'
            const url = new URL(wellKnownUrl)
            const resourcePath = url.pathname.slice(wellKnownPrefix.length) || '/'

            const resourceUrl = new URL(wellKnownUrl)
            resourceUrl.pathname = resourcePath
            resourceUrl.search = ''

            expect(resourceUrl.toString().replace(/\/$/, '')).toBe(expectedResource)
        })
    })
})
