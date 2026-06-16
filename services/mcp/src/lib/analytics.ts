import { Insights } from '@hanzo/insights-node'

let _client: Insights | undefined

export enum AnalyticsEvent {
    MCP_TOOL_CALL = 'mcp tool call',
    MCP_TOOL_RESPONSE = 'mcp tool response',
}

export const getInsightsClient = (): Insights => {
    if (!_client) {
        _client = new Insights('sTMFPsFhdP1Ssg', {
            host: 'https://us.i.hanzo.ai',
            flushAt: 1,
            flushInterval: 0,
        })
    }

    return _client
}
