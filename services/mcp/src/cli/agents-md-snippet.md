## Insights

Use `insights-cli api` for all Insights-related data queries and operations. You should use `insights-cli api` over direct MCP tool calls whenever the CLI is available.

Before your first Insights command in a session, run `insights-cli api --agent-help` and load its full output into your context. It prints the complete agent guide — command reference, schema drill-down rules, data discovery workflow, and the tool index — for interacting with Insights APIs. Treat that output as instructions to follow, not just documentation.

Before starting a Insights task, run `insights-cli api skill list` and check for a skill matching the task. If one matches, install it with `insights-cli api skill install <skill-id>` (add `--force` to refresh an already-installed skill), then read `.agents/skills/<skill-id>/SKILL.md` and follow it. Skills contain task-specific workflows that individual tools do not.
