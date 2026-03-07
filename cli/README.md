# The Insights CLI

```bash
> insights-cli --help
The command line interface for Insights 🦔

Usage: insights-cli [OPTIONS] <COMMAND>

Commands:
  login      Interactively authenticate with Insights, storing a personal API token locally. You can also use the environment variables `INSIGHTS_CLI_API_KEY`, `INSIGHTS_CLI_PROJECT_ID` and `INSIGHTS_CLI_HOST`
  query      Run a SQL query against any data you have in insights. This is mostly for fun, and subject to change
  sourcemap  Upload a directory of bundled chunks to Insights
  exp        Contains a set of experimental commands
  help       Print this message or the help of the given subcommand(s)

Options:
      --host <HOST>  The Insights host to connect to [default: https://insights.hanzo.ai]
  -h, --help         Print help
  -V, --version      Print version
```

## Env-based Authentication

You can authenticate with Insights interactively for using the CLI locally, but if you'd like to use it in a CI/CD pipeline, we recommend using these environment variables:

- `INSIGHTS_CLI_HOST`: The Insights host to connect to [default: https://insights.hanzo.ai]
- `INSIGHTS_CLI_API_KEY`: [A insights personal API key.](https://hanzo.ai/docs/api#private-endpoint-authentication) (also accepts `INSIGHTS_CLI_TOKEN` for backward compatibility)
- `INSIGHTS_CLI_PROJECT_ID`: The ID number of the project/environment to connect to. E.g. the "2" in `https://insights.hanzo.ai/project/2` (also accepts `INSIGHTS_CLI_ENV_ID` for backward compatibility)

### Personal API key scopes

Commands require different API scopes. Make sure to set these scopes on your personal API key:

| Command                       | Required Scopes                            |
| ----------------------------- | ------------------------------------------ |
| `query`                       | `query:read`                               |
| `sourcemap`                   | `error_tracking:write`                     |
| `exp endpoints list/get/pull` | `endpoint:read`                            |
| `exp endpoints push`          | `endpoint:write`, `insight_variable:write` |
| `exp endpoints run`           | `query:read`                               |
| `exp tasks`                   | `task:read`                                |
