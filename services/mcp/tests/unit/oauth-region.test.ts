import { describe, expect, it } from 'vitest'

import { getAuthorizationServerUrl, getBaseUrlForRegion, toCloudRegion } from '@/lib/constants'

describe('OAuth Region Routing', () => {
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
            expect(getBaseUrlForRegion('eu')).toBe('https://insights.hanzo.ai')
        })

        it('returns US URL for us region', () => {
            expect(getBaseUrlForRegion('us')).toBe('https://insights.hanzo.ai')
        })
    })

    describe('getAuthorizationServerUrl', () => {
        it('returns EU URL when region is eu', () => {
            expect(getAuthorizationServerUrl('eu')).toBe('https://insights.hanzo.ai')
        })

        it('returns EU URL when region is EU (case insensitive)', () => {
            expect(getAuthorizationServerUrl('EU')).toBe('https://insights.hanzo.ai')
        })

        it('returns US URL when region is us', () => {
            expect(getAuthorizationServerUrl('us')).toBe('https://insights.hanzo.ai')
        })

        it('returns US URL when region is null', () => {
            expect(getAuthorizationServerUrl(null)).toBe('https://insights.hanzo.ai')
        })

        it('returns US URL for unknown region', () => {
            expect(getAuthorizationServerUrl('unknown')).toBe('https://insights.hanzo.ai')
        })
    })

    describe('Protected Resource Metadata', () => {
        const testCases = [
            {
                name: 'defaults to US when no region param',
                params: '',
                expectedServer: 'https://insights.hanzo.ai',
            },
            {
                name: 'returns EU server when region=eu',
                params: '?region=eu',
                expectedServer: 'https://insights.hanzo.ai',
            },
            {
                name: 'returns EU server when region=EU (case insensitive)',
                params: '?region=EU',
                expectedServer: 'https://insights.hanzo.ai',
            },
            {
                name: 'returns US server when region=us',
                params: '?region=us',
                expectedServer: 'https://insights.hanzo.ai',
            },
            {
                name: 'defaults to US for unknown region',
                params: '?region=unknown',
                expectedServer: 'https://insights.hanzo.ai',
            },
        ]

        it.each(testCases)('$name', ({ params, expectedServer }) => {
            const url = new URL(`https://mcp.hanzo.ai/.well-known/oauth-protected-resource${params}`)
            const regionParam = url.searchParams.get('region')

            // Uses actual helpers from constants.ts
            const authorizationServer = getBaseUrlForRegion(toCloudRegion(regionParam))

            expect(authorizationServer).toBe(expectedServer)
        })
    })

    describe('401 Response Metadata URL (RFC 9728)', () => {
        // Per RFC 9728, the well-known URL is constructed by inserting the well-known path
        // between the host and the resource path:
        // - Resource /mcp → metadata at /.well-known/oauth-protected-resource/mcp
        // - Resource /sse → metadata at /.well-known/oauth-protected-resource/sse
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
                name: 'includes resource path /sse for SSE endpoint',
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
