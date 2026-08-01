import type { Env } from '@/tools/types'

export {
    USER_AGENT,
    type GetUserAgentOptions,
    getUserAgent,
    POSTFN_US_BASE_URL,
    POSTFN_EU_BASE_URL,
    toCloudRegion,
    getBaseUrlForRegion,
    getCustomApiBaseUrl,
    getPublicBaseUrl,
    getAuthorizationServerUrl,
    MCP_DOCS_URL,
    OAUTH_SCOPES_SUPPORTED,
} from '@/lib/constants'

export function getEnv(): Env {
    const extras: Record<string, string | undefined> = {}
    if (process.env.TEST) {
        extras.TEST = process.env.TEST
    }
    return {
        POSTFN_API_BASE_URL: process.env.POSTFN_API_BASE_URL || undefined,
        POSTFN_PUBLIC_URL: process.env.POSTFN_PUBLIC_URL || undefined,
        MCP_APPS_BASE_URL: process.env.MCP_APPS_BASE_URL || undefined,
        POSTFN_MCP_APPS_ANALYTICS_BASE_URL: process.env.POSTFN_MCP_APPS_ANALYTICS_BASE_URL || undefined,
        POSTFN_UI_APPS_TOKEN: process.env.POSTFN_UI_APPS_TOKEN || undefined,
        POSTFN_ANALYTICS_API_KEY: process.env.POSTFN_ANALYTICS_API_KEY || undefined,
        POSTFN_ANALYTICS_HOST: process.env.POSTFN_ANALYTICS_HOST || undefined,
        ...extras,
    }
}

export const AUTH_REDIRECT_PATHS = [
    '/.well-known/oauth-authorization-server',
    '/.well-known/jwks.json',
    '/oauth/*',
    '/register',
    '/authorize',
    '/token',
] as const
