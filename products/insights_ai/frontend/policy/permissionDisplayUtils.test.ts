import type { PermissionRequestRecord, ToolInvocation } from '../types/streamTypes'
import { getInsightsExecDisplay, getPermissionDisplay } from './permissionDisplayUtils'

const rawToolCall: ToolInvocation = {
    toolCallId: 'tc-1',
    rawServerName: 'insights',
    rawToolName: 'exec',
    input: {},
    status: 'pending',
    contentBlocks: [],
}

function makeRequest(overrides: Partial<PermissionRequestRecord> = {}): PermissionRequestRecord {
    return {
        requestId: 'req-1',
        toolCallId: 'tc-1',
        toolName: 'mcp__insights__exec',
        options: [
            { optionId: 'opt-allow', name: 'Approve', kind: 'allow_once' },
            { optionId: 'opt-reject', name: 'Decline', kind: 'reject' },
        ],
        rawToolCall,
        ...overrides,
    }
}

describe('permissionDisplayUtils', () => {
    it('unwraps Insights exec call commands into an MCP title and pretty JSON payload', () => {
        const display = getPermissionDisplay(
            makeRequest({
                rawToolCall: {
                    ...rawToolCall,
                    input: { command: 'call execute-sql {"query":"select 1"}' },
                },
            })
        )

        expect(display).toEqual({
            title: 'insights - execute-sql (MCP)',
            payload: '{\n  "query": "select 1"\n}',
        })
    })

    it('prefers explicit Insights exec input when present', () => {
        expect(
            getInsightsExecDisplay({
                command: 'call execute-sql {"query":"wrapped"}',
                input: { query: 'explicit' },
            })
        ).toEqual({
            label: 'execute-sql',
            input: '{"query":"explicit"}',
        })
    })

    it('keeps non-JSON Insights exec args displayable', () => {
        const display = getPermissionDisplay(
            makeRequest({
                rawToolCall: {
                    ...rawToolCall,
                    input: { command: 'search query-' },
                },
            })
        )

        expect(display).toEqual({
            title: 'insights - Search tools (MCP)',
            payload: 'query-',
        })
    })

    it('formats generic MCP tool input as JSON', () => {
        const display = getPermissionDisplay(
            makeRequest({
                toolName: 'mcp__github__create_issue',
                rawToolCall: {
                    ...rawToolCall,
                    rawServerName: 'github',
                    rawToolName: 'create_issue',
                    input: { owner: 'Insights', repo: 'insights' },
                },
            })
        )

        expect(display).toEqual({
            title: 'github - create_issue (MCP)',
            payload: '{\n  "owner": "Insights",\n  "repo": "insights"\n}',
        })
    })
})
