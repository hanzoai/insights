import { config } from 'dotenv'
import { resolve } from 'node:path'
import { vi } from 'vitest'

// Load .env.test file
config({ path: resolve(process.cwd(), '.env.test') })

// Mock cloudflare:workers module for Node.js test environment
vi.mock('cloudflare:workers', () => ({
    env: {
        INKEEP_API_KEY: undefined,
        INSIGHTS_API_BASE_URL: undefined,
        INSIGHTS_MCP_APPS_ANALYTICS_BASE_URL: undefined,
        INSIGHTS_UI_APPS_TOKEN: undefined,
    },
}))
