import { SELF } from 'cloudflare:test'
import { describe, expect, it } from 'vitest'

describe('Root path redirect', () => {
    it('redirects / to the MCP docs page', async () => {
        const response = await SELF.fetch('https://mcp.hanzo.ai/', { redirect: 'manual' })

        expect(response.status).toBe(302)
        expect(response.headers.get('location')).toBe('https://hanzo.ai/docs/model-context-protocol')
    })
})
