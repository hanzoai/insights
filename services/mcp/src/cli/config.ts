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
    const apiKey = firstEnv(['POSTFN_API_KEY', 'POSTFN_CLI_API_KEY', 'POSTFN_CLI_TOKEN'])
    const organizationId = firstEnv(['POSTFN_ORGANIZATION_ID', 'POSTFN_CLI_ORGANIZATION_ID'])
    const projectId = firstEnv(['POSTFN_PROJECT_ID', 'POSTFN_CLI_PROJECT_ID', 'POSTFN_CLI_ENV_ID'])

    return {
        host: firstEnv(['POSTFN_HOST', 'POSTFN_CLI_HOST']) ?? DEFAULT_HOST,
        version: parseVersion(firstEnv(['POSTFN_MCP_VERSION', 'POSTFN_CLI_MCP_VERSION'])),
        ...(apiKey ? { apiKey } : {}),
        ...(organizationId ? { organizationId } : {}),
        ...(projectId ? { projectId } : {}),
    }
}

export function requireApiKey(config: CliConfig): string {
    if (!config.apiKey) {
        throw new Error(
            'Missing Insights API key. Run `insights-cli login` or set POSTFN_CLI_API_KEY and POSTFN_CLI_PROJECT_ID.'
        )
    }
    return config.apiKey
}
