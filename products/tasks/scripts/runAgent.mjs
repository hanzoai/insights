#!/usr/bin/env node
import { Agent, PermissionMode } from '@hanzo/agent'

function parseArgs() {
    const args = process.argv.slice(2)
    const parsed = {}

    for (let i = 0; i < args.length; i += 2) {
        const key = args[i].replace(/^--/, '')
        const value = args[i + 1]
        parsed[key] = value
    }

    return parsed
}

export async function runAgent({
    taskId,
    runId,
    repositoryPath,
    insightsApiUrl,
    insightsApiKey,
    insightsProjectId,
    prompt,
    maxTurns,
    createPR,
}) {
    const envOverrides = {
        INSIGHTS_API_KEY: insightsApiKey,
        INSIGHTS_API_HOST: insightsApiUrl,
        INSIGHTS_AUTH_HEADER: `Bearer ${insightsApiKey}`,
        ANTHROPIC_API_KEY: insightsApiKey,
        ANTHROPIC_AUTH_TOKEN: insightsApiKey,
        ANTHROPIC_BASE_URL: `${insightsApiUrl}/api/projects/${parseInt(insightsProjectId, 10)}/llm_gateway`,
    }

    Object.assign(process.env, envOverrides)

    const agent = new Agent({
        workingDirectory: repositoryPath,
        insightsApiUrl,
        insightsApiKey,
        insightsProjectId: parseInt(insightsProjectId, 10),
        debug: true,
    })

    if (prompt) {
        const options = {
            repositoryPath,
            permissionMode: PermissionMode.BYPASS,
            isCloudMode: true,
        }

        if (maxTurns) {
            options.queryOverrides = {
                maxTurns: parseInt(maxTurns, 10),
            }
        }

        await agent.run(prompt, options)
    } else {
        await agent.runTaskCloud(taskId, runId, {
            repositoryPath,
            createPR,
        })
    }
}

async function main() {
    const { taskId, runId, repositoryPath, prompt, 'max-turns': maxTurns, createPR } = parseArgs()

    if (!prompt && !taskId) {
        console.error('Missing required argument: either --prompt or --taskId must be provided')
        process.exit(1)
    }

    if (taskId && !runId) {
        console.error('Missing required argument: --runId (required when using --taskId)')
        process.exit(1)
    }

    if (!repositoryPath) {
        console.error('Missing required argument: --repositoryPath')
        process.exit(1)
    }

    const insightsApiUrl = process.env.INSIGHTS_API_URL
    const insightsApiKey = process.env.INSIGHTS_PERSONAL_API_KEY
    const insightsProjectId = process.env.INSIGHTS_PROJECT_ID

    if (!insightsApiUrl) {
        console.error('Missing required environment variable: INSIGHTS_API_URL')
        process.exit(1)
    }

    if (!insightsApiKey) {
        console.error('Missing required environment variable: INSIGHTS_PERSONAL_API_KEY')
        process.exit(1)
    }

    if (taskId && !insightsProjectId) {
        console.error('Missing required environment variable: INSIGHTS_PROJECT_ID')
        process.exit(1)
    }

    try {
        await runAgent({
            taskId,
            runId,
            repositoryPath,
            insightsApiUrl,
            insightsApiKey,
            insightsProjectId,
            prompt,
            maxTurns,
            createPR: createPR === 'true',
        })
        process.exit(0)
    } catch (error) {
        console.error(
            JSON.stringify({
                type: 'error',
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
            })
        )
        process.exit(1)
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main()
}
