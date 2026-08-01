import { describe, expect, it, vi } from 'vitest'

import { buildAgentHelp, toCliSyntax } from '@/cli/agent-help'
import { getCliTools } from '@/cli/tools'

describe('CLI agent help', () => {
    it('rewrites exec invocations to CLI syntax', () => {
        expect(toCliSyntax('insights:exec({ "command": "search dashboard" })')).toBe('insights-cli api search dashboard')
        expect(toCliSyntax('insights:exec({ "command": "tools" })')).toBe('insights-cli api tools')
    })

    it('quotes JSON payloads and unescapes embedded quotes', () => {
        expect(
            toCliSyntax(
                'insights:exec({ "command": "call read-data-schema {\\"query\\": {\\"kind\\": \\"events\\"}}" })'
            )
        ).toBe(`insights-cli api call read-data-schema '{"query": {"kind": "events"}}'`)
    })

    it('builds the agent guide from the MCP exec templates', () => {
        const help = buildAgentHelp(getCliTools())

        expect(help).toContain('insights-cli api info <tool_name>')
        expect(help).toContain('SCHEMA DRILL-DOWN RULE')
        expect(help).not.toContain('insights:exec(')
        // Tool-domain index and query-tool catalog come from the bundled registry.
        expect(help).toContain('query-trends')
    })

    it('does not require credentials to build', () => {
        expect(() => buildAgentHelp(getCliTools())).not.toThrow()
    })

    it('skips unavailable tools without stderr warnings', () => {
        const stderrWrite = vi.spyOn(process.stderr, 'write').mockImplementation(() => true)

        try {
            const toolNames = getCliTools().map((tool) => tool.name)

            expect(toolNames).not.toContain('evaluations-get')
            expect(stderrWrite).not.toHaveBeenCalled()
        } finally {
            stderrWrite.mockRestore()
        }
    })

    it('hides AI-consent tools unless consent is confirmed', () => {
        const withoutConsent = getCliTools().map((tool) => tool.name)
        const withConsent = getCliTools({ aiConsentGiven: true }).map((tool) => tool.name)

        expect(withoutConsent).not.toContain('llma-summarization-create')
        expect(withConsent).toContain('llma-summarization-create')
    })
})
