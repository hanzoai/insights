export interface CliConfig {
    apiKey?: string
    host: string
    organizationId?: string
    projectId?: string
    version: number
}

const DEFAULT_HOST = 'https://us.hanzo.ai'

function firstEnv(names: string[]): string | undefined {
    for (const name of names) {
        const value = process.env[name]
        if (value) {
            return value
        }
    }
    return undefined
}

function parseVersion(value: string | undefined): number {
    if (!value) {
        return 2
    }
    const parsed = Number(value)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 2
}

export function resolveCliConfig(): CliConfig {
    const apiKey = firstEnv(['INSIGHTS_API_KEY', 'INSIGHTS_CLI_API_KEY', 'INSIGHTS_CLI_TOKEN'])
    const organizationId = firstEnv(['INSIGHTS_ORGANIZATION_ID', 'INSIGHTS_CLI_ORGANIZATION_ID'])
    const projectId = firstEnv(['INSIGHTS_PROJECT_ID', 'INSIGHTS_CLI_PROJECT_ID', 'INSIGHTS_CLI_ENV_ID'])

    return {
        host: firstEnv(['INSIGHTS_HOST', 'INSIGHTS_CLI_HOST']) ?? DEFAULT_HOST,
        version: parseVersion(firstEnv(['INSIGHTS_MCP_VERSION', 'INSIGHTS_CLI_MCP_VERSION'])),
        ...(apiKey ? { apiKey } : {}),
        ...(organizationId ? { organizationId } : {}),
        ...(projectId ? { projectId } : {}),
    }
}

export function requireApiKey(config: CliConfig): string {
    if (!config.apiKey) {
        throw new Error(
            'Missing Insights API key. Run `insights-cli login` or set INSIGHTS_CLI_API_KEY and INSIGHTS_CLI_PROJECT_ID.'
        )
    }
    return config.apiKey
}
