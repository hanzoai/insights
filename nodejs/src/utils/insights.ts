import { Insights } from 'hanzo-insights-node'

import { defaultConfig } from '../config/config'
import { Team } from '../types'

const fs = require('fs')

const client = defaultConfig.INSIGHTS_API_KEY
    ? new Insights(defaultConfig.INSIGHTS_API_KEY, {
          host: defaultConfig.INSIGHTS_HOST_URL,
          enableExceptionAutocapture: false, // TODO - disabled while data volume is a problem, PS seems /extremely/ chatty exceptions wise
      })
    : null

if (process.env.NODE_ENV === 'test' && client) {
    void client.disable()
}

export function initSuperProperties(): void {
    if (client) {
        const superProperties: Record<string, any> = {
            plugin_server_mode: defaultConfig.PLUGIN_SERVER_MODE,
            deployment: defaultConfig.CLOUD_DEPLOYMENT,
            plugin_server_events_ingestion_pipeline: defaultConfig.PLUGIN_SERVER_EVENTS_INGESTION_PIPELINE,
            // Super properties matching Python insightsanalytics.super_properties (insights/apps.py)
            region: defaultConfig.CLOUD_DEPLOYMENT,
            service: defaultConfig.OTEL_SERVICE_NAME,
            environment: defaultConfig.OTEL_SERVICE_ENVIRONMENT,
        }

        try {
            // Docker containers should have a commit.txt file in the base directory with the git
            // commit hash used to generate them. `nodejs` runs from a child directory, so we
            // need to look up one level.
            superProperties['release'] = fs.readFileSync('../commit.txt', 'utf8')
        } catch (error) {
            // The release isn't required, it's just nice to have.
        }

        void client.register(superProperties)
    }
}

export function captureTeamEvent(
    team: Team,
    event: string,
    properties: Record<string, any> = {},
    distinctId: string | null = null
): void {
    if (client) {
        client.capture({
            distinctId: distinctId ?? team.uuid,
            event,
            properties: {
                team: team.uuid,
                ...properties,
            },
            groups: {
                project: team.uuid,
                organization: team.organization_id,
                instance: defaultConfig.SITE_URL,
            },
        })
    }
}

export async function isFeatureFlagEnabled(
    key: string,
    distinctId: string,
    options?: {
        groups?: Record<string, string>
        personProperties?: Record<string, string>
        groupProperties?: Record<string, Record<string, string>>
        onlyEvaluateLocally?: boolean
        sendFeatureFlagEvents?: boolean
    }
): Promise<boolean> {
    if (!client) {
        return false
    }

    try {
        const isEnabled = await client.isFeatureEnabled(key, distinctId, options)
        return isEnabled ?? false
    } catch (error) {
        // Log errors to aid debugging of feature flag evaluation issues (e.g. SES v1 vs v2 gating).
        console.error('Error evaluating Insights feature flag', {
            key,
            distinctId,
            options,
            error,
        })
        return false
    }
}

export function shutdown(): Promise<void> | null {
    return client ? client.shutdown() : null
}

export function flush(): void {
    if (client) {
        void client.flush().catch(() => null)
    }
}

// We use sentry-style hints rather than our flat property list all over the place,
// so define a type for them that we can flatten internally
type Primitive = number | string | boolean | bigint | symbol | null | undefined
interface ExceptionHint {
    tags: Record<string, Primitive>
    extra: Record<string, any>
}

export function captureException(exception: any, hint?: Partial<ExceptionHint>): void {
    if (client) {
        let additionalProperties = {}
        if (hint) {
            additionalProperties = {
                ...(hint.tags || {}),
                ...(hint.extra || {}),
            }
        }

        client.captureException(exception, undefined, additionalProperties)
    }
}
