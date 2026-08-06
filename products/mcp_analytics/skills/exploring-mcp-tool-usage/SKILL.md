---
name: exploring-mcp-tool-usage
description: >
  Starting point for exploring how a Insights MCP server's tools are used —
  routes a broad question to the typed tool that answers it. Use when the user
  asks "how is my MCP doing?", "what should I look at?", "explore my tool
  calls", "who uses my MCP tools?", "what are agents doing with the MCP?", or
  pastes an MCP analytics URL without a specific question. Offers a menu of
  questions, each backed by a query tool, then hands off to the focused skill.
---

# Exploring MCP tool usage

Any MCP server instrumented with the `@hanzo/mcp` SDK emits a `$mcp_tool_call`
event every time an agent invokes a tool. This skill is the **front door** for a
user who knows they want to look at their MCP tool usage but hasn't picked a
specific question. Offer the menu below, then route to the tool — or the focused
skill — that answers what they choose.

Every per-tool tool here is gated behind the `mcp-analytics` flag, takes a
`toolName` (the effective tool name — resolved server-side, so pass the name the
agent actually invokes — **except `insights:query-mcp-tool-failures`**, which
matches `$exception` events and so takes the raw registered `$mcp_tool_name`)
plus a `dateRange`, and runs the same query runner the tool-detail UI uses. So
results match the UI, and you never hand-write the InsightsQL.

## Suggested questions

Lead with these when the user is unsure what to ask:

| Ask the user…                                     | Answered by                                                                                     |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| "Which tools fail most, or are slowest?"          | `exploring-mcp-tool-quality` (ranks all tools), then `insights:query-mcp-tool-stats` to drill in |
| "How is tool X doing overall?"                    | `insights:query-mcp-tool-stats` — calls, errors, p50/p95, users, sessions, intents               |
| "How has tool X trended?"                         | `insights:query-mcp-tool-daily-stats` — day-by-day series                                        |
| "Why is tool X failing?"                          | `insights:query-mcp-tool-failures` — top error messages, by harness (raw tool name)              |
| "Who uses tool X the most?"                       | `insights:query-mcp-tool-top-users` — top callers (incl. person email/name)                      |
| "What gets called right before/after tool X?"     | `insights:query-mcp-tool-neighbors` (`neighborDirection: before`/`after`)                        |
| "What are agents trying to do with tool X?"       | `insights:query-mcp-tool-sample-intents` — recent agent intents                                  |
| "What description is tool X registered with?"     | `insights:query-mcp-tool-descriptions` — distinct descriptions seen                              |
| "Which harnesses use my MCP, how reliably?"       | `insights:query-mcp-harness-breakdown` — calls/errors/sessions per client                        |
| "What are agents trying to do, across all tools?" | `exploring-mcp-intent-clusters` — semantic goal clusters                                        |
| "Who is connecting, and how active are they?"     | `insights:mcp-analytics-sessions-list` — one row per session, with client and person             |
| "What did this one session do?"                   | `exploring-mcp-sessions` — a single agent run's tool sequence                                   |

## Finding the tool name

The per-tool tools need a `toolName`. If the user named a tool, pass it. If they
asked a broad "which tool…" question, start with `exploring-mcp-tool-quality` to
rank the tools, pick the one that stands out, then drill in with the per-tool
tools above. The name to pass is the **effective** tool name (the inner tool for
single-exec wrapper calls) — the same string the tool-quality ranking returns.
The one exception is `insights:query-mcp-tool-failures`, which matches `$exception`
events by the raw registered `$mcp_tool_name`, not the effective inner tool.

## How to use a per-tool tool

Call it with the tool name and a window, e.g. for the headline numbers of a tool:

```text
insights:query-mcp-tool-stats  { "toolName": "<tool>", "dateRange": { "date_from": "-7d" } }
```

Then offer a natural follow-up from the menu — e.g. after
`insights:query-mcp-tool-stats` shows a high error rate, reach for
`insights:query-mcp-tool-failures`; after it shows broad reach, reach for
`insights:query-mcp-tool-top-users` or `insights:query-mcp-tool-neighbors`.

## When to drop to SQL

**Covered by a typed tool — don't hand-write SQL for these:**

| Question                           | Tool                                        |
| ---------------------------------- | ------------------------------------------- |
| One tool's headline numbers        | `insights:query-mcp-tool-stats`              |
| One tool's day-by-day trend        | `insights:query-mcp-tool-daily-stats`        |
| One tool's top errors              | `insights:query-mcp-tool-failures`           |
| One tool's top callers             | `insights:query-mcp-tool-top-users`          |
| Tools called before/after one tool | `insights:query-mcp-tool-neighbors`          |
| One tool's recent agent intents    | `insights:query-mcp-tool-sample-intents`     |
| One tool's registered descriptions | `insights:query-mcp-tool-descriptions`       |
| Usage split by client harness      | `insights:query-mcp-harness-breakdown`       |
| List sessions                      | `insights:mcp-analytics-sessions-list`       |
| One session's tool calls           | `insights:mcp-analytics-sessions-tool-calls` |

**Not covered — use `insights:execute-sql`:**

- Cross-tool rankings (the tool-quality matrix — "which tool errors most?")
- Errored-session filtering (the session list has no error filter or error count)
- Effective tool names inside a session (`insights:mcp-analytics-sessions-tool-calls`
  returns the raw `$mcp_tool_name`, not the inner tool of a wrapper call)
- Any custom breakdown

`insights:execute-sql` is also the fallback when the `mcp-analytics` flag is off —
every tool in the table above is gated behind it, `execute-sql` is not. Query
`$mcp_tool_call` directly; the schema and recipes are in
[`models-mcp.md`](../../../insights_ai/skills/querying-insights-data/references/models-mcp.md).

## Related skills

- [`exploring-mcp-tool-quality`](../exploring-mcp-tool-quality/SKILL.md) — rank
  tools by error rate / latency / reach, then drill in
- [`exploring-mcp-sessions`](../exploring-mcp-sessions/SKILL.md) — a single agent
  run and its tool sequence
- [`exploring-mcp-intent-clusters`](../exploring-mcp-intent-clusters/SKILL.md) —
  agent goals grouped by semantic similarity
