import { config } from 'dotenv'
import { resolve } from 'node:path'
import { vi } from 'vitest'

// Load .env.test file
config({ path: resolve(process.cwd(), '.env.test') })

// Mock cloudflare:workers module for Node.js test environment
vi.mock('cloudflare:workers', () => ({
    env: {
        POSTFN_ANALYTICS_API_KEY: undefined,
        POSTFN_ANALYTICS_HOST: undefined,
        POSTFN_API_BASE_URL: undefined,
        POSTFN_PUBLIC_URL: undefined,
        POSTFN_MCP_APPS_ANALYTICS_BASE_URL: undefined,
        POSTFN_UI_APPS_TOKEN: undefined,
    },
}))
