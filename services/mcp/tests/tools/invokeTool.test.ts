import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { InsightsApiError, InsightsPermissionError, InsightsRateLimitError, InsightsValidationError } from '@/lib/errors'
import { invokeMcpTool } from '@/tools/insightsAiTools/invokeTool'
import type { Context } from '@/tools/types'

function makeContext(): Context {
    return {
        api: {
            baseUrl: 'https://us.hanzo.ai',
            config: { apiToken: 'phx_test' },
        },
        stateManager: {
            getProjectId: vi.fn().mockResolvedValue(2),
        },
    } as unknown as Context
}

describe('invokeMcpTool', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    const stubFetch = (response: Response): void => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))
    }

    it('returns the tool result on success', async () => {
        stubFetch(new Response(JSON.stringify({ success: true, content: 'rows' }), { status: 200 }))

        const result = await invokeMcpTool(makeContext(), 'execute_sql', { query: 'SELECT 1' })

        expect(result).toEqual({ success: true, content: 'rows' })
    })

    it('throws InsightsRateLimitError on a 429 so it is not bucketed as an internal error', async () => {
        stubFetch(
            new Response(JSON.stringify({ detail: 'Request was throttled.' }), {
                status: 429,
                headers: { 'Retry-After': '7' },
            })
        )

        const error = await invokeMcpTool(makeContext(), 'execute_sql', { query: 'SELECT 1' }).catch((e) => e)

        expect(error).toBeInstanceOf(InsightsRateLimitError)
        expect(error).toBeInstanceOf(InsightsApiError)
        expect((error as InsightsRateLimitError).status).toBe(429)
        expect((error as InsightsRateLimitError).retryAfterSeconds).toBe(7)
    })

    it('throws InsightsApiError carrying the status on a 5xx', async () => {
        stubFetch(new Response('upstream exploded', { status: 503, statusText: 'Service Unavailable' }))

        const error = await invokeMcpTool(makeContext(), 'execute_sql', { query: 'SELECT 1' }).catch((e) => e)

        expect(error).toBeInstanceOf(InsightsApiError)
        expect((error as InsightsApiError).status).toBe(503)
    })

    it('throws InsightsPermissionError on a 403 permission_denied', async () => {
        stubFetch(
            new Response(JSON.stringify({ code: 'permission_denied', detail: "required scope 'query:read'" }), {
                status: 403,
            })
        )

        const error = await invokeMcpTool(makeContext(), 'execute_sql', { query: 'SELECT 1' }).catch((e) => e)

        expect(error).toBeInstanceOf(InsightsPermissionError)
        expect((error as InsightsPermissionError).missingScope).toBe('query:read')
    })

    it('throws InsightsValidationError on a validation_error body', async () => {
        stubFetch(
            new Response(JSON.stringify({ type: 'validation_error', detail: 'bad query', attr: 'query' }), {
                status: 400,
            })
        )

        const error = await invokeMcpTool(makeContext(), 'execute_sql', { query: 'SELECT 1' }).catch((e) => e)

        expect(error).toBeInstanceOf(InsightsValidationError)
        expect((error as InsightsValidationError).attr).toBe('query')
    })
})
