import { Client, Connection, WorkflowHandle } from '@hanzoai/tasks'
import { Counter } from 'prom-client'

import { PluginsServerConfig, RawStreamEvent } from '../../types'
import { isDevEnv } from '../../utils/env-utils'
import { logger } from '../../utils/logger'

/**
 * Narrowed Hub type for TemporalService. Durable execution now runs on the ONE
 * Hanzo Tasks engine embedded in cloud (identity-gated ZAP), so only the
 * address + namespace are read from config; mTLS material is no longer used —
 * the engine authenticates callers with a Hanzo IAM bearer instead.
 */
export type TemporalServiceHub = Pick<PluginsServerConfig, 'TEMPORAL_PORT' | 'TEMPORAL_HOST' | 'TEMPORAL_NAMESPACE'>

const EVALUATION_TASK_QUEUE = isDevEnv() ? 'development-task-queue' : 'llm-analytics-evals-task-queue'

const temporalWorkflowsStarted = new Counter({
    name: 'evaluation_run_workflows_started',
    help: 'Number of evaluation run workflows started',
    labelNames: ['status'],
})

// The @hanzoai/tasks IAM bearer source shape.
type TokenProvider = () => string | Promise<string>

// Hanzo IAM client_credentials bearer (cached). The Hanzo Tasks engine embedded
// in cloud exposes an identity-gated ZAP listener; the token rides every RPC and
// cloud validates it against IAM JWKS, scoping the request to the token owner's
// org. Refreshed a minute before expiry.
let cachedToken = ''
let cachedExpMs = 0

export const iamTokenSource: TokenProvider = async () => {
    const now = Date.now()
    if (cachedToken && now < cachedExpMs - 60_000) {
        return cachedToken
    }
    const iamUrl = process.env.IAM_URL || 'https://hanzo.id'
    const body = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.IAM_CLIENT_ID || 'hanzo-insights',
        client_secret: process.env.IAM_CLIENT_SECRET || '',
    })
    const res = await fetch(`${iamUrl}/v1/iam/oauth/access_token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
        },
        body: body.toString(),
    })
    if (!res.ok) {
        throw new Error(`Hanzo IAM client_credentials failed: ${res.status} ${res.statusText}`)
    }
    const j = (await res.json()) as { access_token?: string; expires_in?: number }
    if (!j.access_token) {
        throw new Error('Hanzo IAM returned no access_token')
    }
    cachedToken = j.access_token
    cachedExpMs = now + (j.expires_in ? j.expires_in * 1000 : 3_600_000)
    return cachedToken
}

export class TemporalService {
    private client?: Client
    private connection?: Connection
    private connecting?: Promise<Client>

    constructor(private hub: TemporalServiceHub) {}

    private async ensureConnected(): Promise<Client> {
        if (this.client) {
            return this.client
        }

        if (this.connecting) {
            return await this.connecting
        }

        this.connecting = this.createClient()
        this.client = await this.connecting
        this.connecting = undefined

        return this.client
    }

    private async createClient(): Promise<Client> {
        const host = this.hub.TEMPORAL_HOST || 'cloud.hanzo.svc'
        const port = this.hub.TEMPORAL_PORT || '9999'
        const address = `${host}:${port}`

        this.connection = await Connection.connect({ address, token: iamTokenSource })

        const client = await Client.create({
            connection: this.connection,
            namespace: this.hub.TEMPORAL_NAMESPACE || 'default',
        })

        logger.info('✅ Connected to Hanzo Tasks', {
            address,
            namespace: this.hub.TEMPORAL_NAMESPACE,
        })

        return client
    }

    async startEvaluationRunWorkflow(evaluationId: string, event: RawStreamEvent): Promise<WorkflowHandle> {
        const client = await this.ensureConnected()

        const workflowId = `${evaluationId}-${event.uuid}-ingestion`

        const handle = await client.workflow.start('run-evaluation', {
            args: [
                {
                    evaluation_id: evaluationId,
                    event_data: event,
                },
            ],
            taskQueue: EVALUATION_TASK_QUEUE,
            workflowId,
            workflowIdConflictPolicy: 'USE_EXISTING',
            workflowTaskTimeout: '2 minutes',
        })

        temporalWorkflowsStarted.labels({ status: 'success' }).inc()

        logger.debug('Started evaluation run workflow', {
            workflowId,
            evaluationId,
            targetEventId: event.uuid,
            timestamp: event.timestamp,
        })

        return handle
    }

    async disconnect(): Promise<void> {
        if (this.connection) {
            await this.connection.close()
            this.connection = undefined
            this.client = undefined
        }
    }
}
