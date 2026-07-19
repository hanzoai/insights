# Insights MCP

Documentation: https://hanzo.ai/docs/model-context-protocol

## Use the MCP Server

### Quick install

You can install the MCP server automatically into Cursor, Claude, Claude Code, VS Code and Zed by running the following command:

```bash
npx @hanzo/wizard@latest mcp add
```

### Manual install

1. Obtain a personal API key using the [MCP Server preset](https://insights.hanzo.ai/settings/user-api-keys?preset=mcp_server).

2. Add the MCP configuration to your desktop client (e.g. Cursor, Windsurf, Claude Desktop) and add your personal API key

```json
{
  "mcpServers": {
    "insights": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote@latest",
        "https://mcp.hanzo.ai/mcp", // You can replace this with https://mcp.hanzo.ai/sse if your client does not support Streamable HTTP
        "--header",
        "Authorization:${INSIGHTS_AUTH_HEADER}"
      ],
      "env": {
        "INSIGHTS_AUTH_HEADER": "Bearer {INSERT_YOUR_PERSONAL_API_KEY_HERE}"
      }
    }
  }
}
```

### Minimal Node client (Streamable HTTP)

If you want to call MCP from Node (outside an IDE), use the Model Context Protocol SDK’s **Streamable HTTP** transport.

- **Auth:** Use a **personal** Insights API key and pass it as a Bearer token in `Authorization`.
- **Accept header:** Clients **must** include `Accept: application/json, text/event-stream`.
- **Lifecycle:** MCP requires `initialize` then a client `notifications/initialized`; the SDK performs this during `connect()`.

```js
// tools-list.mjs
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { ListToolsResultSchema } from '@modelcontextprotocol/sdk/types.js'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { URL } from 'node:url'

const AUTH = process.env.INSIGHTS_AUTH_HEADER // "Bearer phx_…"
const MCP_URL = process.env.MCP_URL || 'https://mcp.hanzo.ai/mcp'

if (!AUTH?.startsWith('Bearer ')) {
  console.error('Set INSIGHTS_AUTH_HEADER="Bearer phx_..."')
  process.exit(1)
}

const transport = new StreamableHTTPClientTransport(new URL(MCP_URL), {
  requestInit: {
    headers: {
      Authorization: AUTH,
      // Required for Streamable HTTP (JSON + SSE)
      Accept: 'application/json, text/event-stream',
    },
  },
  serverInfo: { name: 'example-node-client', version: '0.0.1' },
})

const client = new Client({ name: 'example-node-client', version: '0.0.1' })

// Handles initialize + notifications/initialized
await client.connect(transport)

const toolsResp = await client.request({ method: 'tools/list' }, ListToolsResultSchema) // { tools: [...] }
const tools = toolsResp?.tools ?? []
console.log('Tools:', tools.length)

// (Optional) Save the full JSON-RPC envelope to a file (run from repo root)
const envelope = { jsonrpc: '2.0', id: 'list-1', result: toolsResp }
mkdirSync('reports', { recursive: true })
writeFileSync(join('reports', 'tools-list-http.json'), JSON.stringify(envelope, null, 2))
console.log('Saved: reports/tools-list-http.json')

await client.close()
```

**Why these headers & steps?**

- Streamable HTTP requires the `Accept` header to include **both** JSON and SSE.
- After `initialize`, the client must send `notifications/initialized`; the SDK does this for you in `connect()`.

See also the main Insights MCP docs for available tools and setup flows: [https://hanzo.ai/docs/model-context-protocol](https://hanzo.ai/docs/model-context-protocol)

### Docker install

If you prefer to use Docker instead of running npx directly:

1. Build the Docker image:

```bash
pnpm docker:build
# or
docker build -t insights-mcp .
```

2. Configure your MCP client with Docker:

```json
{
  "mcpServers": {
    "insights": {
      "type": "stdio",
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "--env",
        "INSIGHTS_AUTH_HEADER=${INSIGHTS_AUTH_HEADER}",
        "--env",
        "INSIGHTS_REMOTE_MCP_URL=${INSIGHTS_REMOTE_MCP_URL:-https://mcp.hanzo.ai/mcp}",
        "insights-mcp"
      ],
      "env": {
        "INSIGHTS_AUTH_HEADER": "Bearer {INSERT_YOUR_PERSONAL_API_KEY_HERE}",
        "INSIGHTS_REMOTE_MCP_URL": "https://mcp.hanzo.ai/mcp"
      }
    }
  }
}
```

3. Test Docker with MCP Inspector:

```bash
pnpm docker:inspector
# or
npx @modelcontextprotocol/inspector docker run -i --rm --env INSIGHTS_AUTH_HEADER=${INSIGHTS_AUTH_HEADER} insights-mcp
```

**Environment Variables:**

- `INSIGHTS_AUTH_HEADER`: Your Insights API token (required)
- `INSIGHTS_REMOTE_MCP_URL`: The MCP server URL (optional, defaults to `https://mcp.hanzo.ai/mcp`)

This approach allows you to use the Insights MCP server without needing Node.js or npm installed locally.

### Example Prompts

Below are detailed examples showing realistic prompts and expected outputs:

#### Example 1: Feature flag management

**Prompt:** "Create a feature flag called 'new-checkout-flow' that's enabled for 20% of users, and show me the configuration"

**What happens:**

1. The `create-feature-flag` tool creates the flag with a 20% rollout
2. Returns the flag configuration including the key, rollout percentage, and targeting rules

**Expected output:**

```text
Created feature flag 'new-checkout-flow':
- Key: new-checkout-flow
- Active: true
- Rollout: 20% of all users
- URL: https://insights.hanzo.ai/feature_flags/12345
```

#### Example 2: Analytics query

**Prompt:** "How many unique users signed up in the last 7 days, broken down by day?"

**What happens:**

1. The `query-run` tool executes a trends query filtering for `$signup` events
2. Returns daily counts with unique user aggregation

**Expected output:**

```text
Signups over the last 7 days:

| Date       | Unique users |
|------------|--------------|
| 2025-01-17 | 142          |
| 2025-01-18 | 156          |
| 2025-01-19 | 98           |
| ...        | ...          |

Total: 847 unique signups
```

#### Example 3: A/B test creation and monitoring

**Prompt:** "Create an A/B test for our pricing page that measures conversion to the checkout page"

**What happens:**

1. The `experiment-create` tool creates an experiment with control/test variants
2. Sets up a funnel metric: pricing page view → checkout page view
3. Creates an associated feature flag for variant assignment

**Expected output:**

```text
Created experiment 'Pricing page test':
- Feature flag: pricing-page-test
- Variants: control (50%), test (50%)
- Primary metric: Funnel conversion (pricing_page → checkout)
- Status: Draft (ready to launch)
- URL: https://insights.hanzo.ai/experiments/789
```

#### Example 4: Error investigation

**Prompt:** "What are the top 5 errors in my project this week and how many users are affected?"

**What happens:**

1. The `list-errors` tool fetches error groups sorted by occurrence count
2. Returns error details including affected user counts

**Expected output:**

```text
Top 5 errors this week:

1. TypeError: Cannot read property 'id' of undefined
   - Occurrences: 1,247
   - Users affected: 89
   - First seen: 2 days ago

2. NetworkError: Failed to fetch
   - Occurrences: 856
   - Users affected: 234
   - First seen: 5 days ago
...
```

#### Quick prompts

For simpler queries, you can use shorter prompts:

- "What feature flags do I have active?"
- "Show me my LLM costs this week"
- "List my dashboards"
- "What events are being tracked?"

### Feature Filtering

You can limit which tools are available by adding query parameters to the MCP URL:

```text
https://mcp.hanzo.ai/mcp?features=flags,workspace
```

Available features:

- `workspace` - Organization and project management
- `error-tracking` - [Error monitoring and debugging](https://hanzo.ai/docs/errors)
- `dashboards` - [Dashboard creation and management](https://hanzo.ai/docs/product-analytics/dashboards)
- `insights` - [Analytics insights and SQL queries](https://hanzo.ai/docs/product-analytics/insights)
- `experiments` - [A/B testing experiments](https://hanzo.ai/docs/experiments)
- `flags` - [Feature flag management](https://hanzo.ai/docs/feature-flags)
- `llm-analytics` - [LLM usage and cost tracking](https://hanzo.ai/docs/llm-analytics)
- `docs` - Insights documentation search

To view which tools are available per feature, see our [documentation](https://hanzo.ai/docs/model-context-protocol) or alternatively check out `schema/tool-definitions.json`,

### Data processing

The MCP server is hosted on a Cloudflare worker which can be located outside of the EU / US, for this reason the MCP server does not store any sensitive data outside of your cloud region.

### Using self-hosted instances

If you're using a self-hosted instance of Insights, you can specify a custom base URL by adding the `INSIGHTS_BASE_URL` [environment variable](https://developers.cloudflare.com/workers/configuration/environment-variables) when running the MCP server locally or on your own infrastructure, e.g. `INSIGHTS_BASE_URL=https://insights.example.com`

# Development

To run the MCP server locally, run the following command:

```bash
pnpm run dev
```

And replace `https://mcp.hanzo.ai/mcp` with `http://localhost:8787/mcp` in the MCP configuration.

### Developing with local resources

To develop with warm loading for MCP resources (workflows, prompts, examples):

1. Start the [context-mill](https://github.com/hanzoai/context-mill) dev server: `cd ../context-mill && npm run dev`
2. Start the MCP server with local resources: `pnpm run dev:local-resources`

Changes in the examples repo will be reflected on the next request.

## Project Structure

This repository is organized to support multiple language implementations:

- `typescript/` - TypeScript implementation of the MCP server & tools
- `schema/` - Shared schema files generated from TypeScript

### Development Commands

- `pnpm run dev` - Start development server
- `pnpm run schema:build:json` - Generate JSON schema for other language implementations
- `pnpm run lint && pnpm run format` - Format and lint code

### Adding New Tools

See the [tools documentation](typescript/src/tools/README.md) for a guide on adding new tools to the MCP server.

### Environment variables

- Create `.dev.vars` in the root
- Add Inkeep API key to enable `docs-search` tool (see `Inkeep API key - mcp`)

```bash
INKEEP_API_KEY="..."
```

### Configuring the Model Context Protocol Inspector

During development you can directly inspect the MCP tool call results using the [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector).

You can run it using the following command:

```bash
npx @modelcontextprotocol/inspector npx -y mcp-remote@latest http://localhost:8787/mcp --header "\"Authorization: Bearer {INSERT_YOUR_PERSONAL_API_KEY_HERE}\""
```

Alternatively, you can use the following configuration in the MCP Inspector:

Use transport type `STDIO`.

**Command:**

```bash
npx
```

**Arguments:**

```bash
-y mcp-remote@latest http://localhost:8787/mcp --header "Authorization: Bearer {INSERT_YOUR_PERSONAL_API_KEY_HERE}"
```

## Privacy & Support

- **Privacy Policy:** https://hanzo.ai/privacy
- **Terms of Service:** https://hanzo.ai/terms
- **Support:** https://hanzo.ai/questions or email support@hanzo.ai
- **GitHub Issues:** https://github.com/hanzoai/insights/issues

### Data handling

The MCP server acts as a proxy to your Insights instance. It does not store your analytics data - all queries are executed against your Insights project and results are returned directly to your AI client. Session state (active project/organization) is cached temporarily using Cloudflare Durable Objects tied to your API key hash.

For EU users, use the `mcp-insights.hanzo.ai` endpoint to ensure OAuth flows route to the EU Insights instance.
