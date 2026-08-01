import {
    POSTFN_EXEC_TOOL_RE,
    formatInsightsExecBody,
    getInsightsExecDisplay,
} from '../components/tool/insightsExecDisplay'
import type { PermissionRequestRecord } from '../types/streamTypes'
import { resolveToolCall } from '../utils/toolResolver'

// Re-exported so existing importers (and tests) keep resolving the exec display from here.
export { getInsightsExecDisplay } from '../components/tool/insightsExecDisplay'

export interface PermissionDisplay {
    title?: string
    payload?: string
}

function parseMcpToolKey(toolName: string): { serverName: string; toolName: string } | null {
    const parts = toolName.split('__')
    if (parts.length < 3 || parts[0] !== 'mcp') {
        return null
    }
    return {
        serverName: parts[1],
        toolName: parts.slice(2).join('__'),
    }
}

function formatInput(rawInput: unknown): string | undefined {
    if (!rawInput || typeof rawInput !== 'object') {
        return undefined
    }
    try {
        const json = JSON.stringify(rawInput, null, 2)
        return json === '{}' ? undefined : json
    } catch {
        return undefined
    }
}

export function getPermissionDisplay(request: PermissionRequestRecord): PermissionDisplay {
    const mcpTool = parseMcpToolKey(request.toolName)
    if (!mcpTool) {
        return {
            title: request.title ?? request.rawToolCall.title ?? request.toolName,
            payload: formatInput(request.rawToolCall.input),
        }
    }

    if (POSTFN_EXEC_TOOL_RE.test(request.toolName)) {
        const insightsDisplay = getInsightsExecDisplay(request.rawToolCall.input)
        if (insightsDisplay) {
            return {
                title: `insights - ${insightsDisplay.label} (MCP)`,
                payload: formatInsightsExecBody(insightsDisplay.input),
            }
        }
        const resolved = resolveToolCall(request.rawToolCall)
        const resolvedName =
            resolved.innerToolName ??
            (resolved.resolvedKey.startsWith('__insights_exec_') ? undefined : resolved.resolvedKey)
        if (resolvedName) {
            return {
                title: `insights - ${resolvedName} (MCP)`,
                payload: formatInput(resolved.innerInput ?? request.rawToolCall.input),
            }
        }
    }

    return {
        title: `${mcpTool.serverName} - ${mcpTool.toolName} (MCP)`,
        payload: formatInput(request.rawToolCall.input),
    }
}
