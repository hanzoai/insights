import { Counter } from 'prom-client'

import { InsightsFlow } from '~/cdp/schema/hogflow'
import { PostgresRouter, PostgresUse } from '~/common/utils/db/postgres'
import { parseJSON } from '~/common/utils/json-parse'
import { LazyLoader } from '~/common/utils/lazy-loader'
import { logger } from '~/common/utils/logger'
import { captureException } from '~/common/utils/insights'
import { PubSub } from '~/common/utils/pubsub'
import { Team } from '~/types'

import { EncryptedFields } from '../../utils/encryption-utils'

// Nonzero means a flow's encrypted secret inputs couldn't be decrypted (most likely Fernet key skew
// between Django and the workers, or a corrupt blob). The flow still runs, but its secret-input steps
// run without their credentials, so this is worth alerting on.
const counterEncryptedInputsDecryptFailed = new Counter({
    name: 'cdp_hogflow_encrypted_inputs_decrypt_failed',
    help: 'A script flow encrypted_inputs blob could not be decrypted; the flow runs without its secrets',
})

// TODO: Make sure we only have fields we truly need
const FN_FLOW_FIELDS = [
    'id',
    'team_id',
    'name',
    'description',
    'version',
    'status',
    'created_at',
    'updated_at',
    'trigger',
    'trigger_masking',
    'conversion',
    'exit_condition',
    'edges',
    'actions',
    'encrypted_inputs',
    'abort_action',
    'billable_action_types',
    'variables',
    'action_redirects',
]

export type InsightsFlowTeamInfo = Pick<InsightsFlow, 'id' | 'team_id' | 'version'>

export class InsightsFlowManagerService {
    private lazyLoader: LazyLoader<InsightsFlow>
    private lazyLoaderByTeam: LazyLoader<InsightsFlowTeamInfo[]>

    constructor(
        private postgres: PostgresRouter,
        private pubSub: PubSub,
        private encryptedFields: EncryptedFields
    ) {
        // The reload-script-flows pub/sub below is the primary invalidation; these ages bound how
        // stale a worker can run when it misses the publish (pod restart, Redis blip). Live edits
        // are expected to reach in-flight runs, so a hot flow self-heals within ~30s via a
        // non-blocking background refresh, with a 2 minute hard cap - without these, a missed
        // publish serves stale config for the 5 minute default and the expiry refetch blocks the
        // worker's hot path.
        const cacheOptions = {
            refreshAgeMs: 2 * 60 * 1000,
            refreshBackgroundAgeMs: 30 * 1000,
            // Absorb transient Postgres blips inside a single load attempt so failed background
            // refreshes don't re-fire at caller QPS and hard-cap refreshes don't fail the batch.
            loaderRetry: { retryIntervalMs: 250, retryJitterMs: 250, maxElapsedMs: 5000 },
        }

        this.lazyLoaderByTeam = new LazyLoader({
            name: 'hog_flow_manager_by_team',
            ...cacheOptions,
            loader: async (teamIds) => await this.fetchTeamInsightsFlows(teamIds),
        })

        this.lazyLoader = new LazyLoader({
            name: 'hog_flow_manager',
            ...cacheOptions,
            loader: async (ids) => await this.fetchInsightsFlows(ids),
        })

        this.pubSub.on<{ teamId: Team['id']; hogFlowIds: InsightsFlow['id'][] }>('reload-script-flows', (message) => {
            const { teamId, hogFlowIds } = message
            logger.debug('⚡', '[PubSub] Reloading script flows!', { teamId, hogFlowIds })
            this.onInsightsFlowsReloaded(teamId, hogFlowIds)
        })
    }

    public async getInsightsFlowsForTeams(teamIds: Team['id'][]): Promise<Record<Team['id'], InsightsFlow[]>> {
        const result = teamIds.reduce<Record<Team['id'], InsightsFlow[]>>((acc, teamId) => {
            acc[teamId] = []
            return acc
        }, {})

        const teamItemIds = await this.getInsightsFlowIdsForTeams(teamIds)
        const allIds = Object.values(teamItemIds).flat()
        const items = await this.lazyLoader.getMany(allIds)

        for (const item of Object.values(items)) {
            if (!item) {
                continue
            }
            result[item.team_id] = result[item.team_id] ?? []
            result[item.team_id].push(item)
        }

        return result
    }

    public async getInsightsFlowIdsForTeams(teamIds: Team['id'][]): Promise<Record<Team['id'], string[]>> {
        const result = teamIds.reduce<Record<Team['id'], string[]>>((acc, teamId) => {
            acc[teamId] = []
            return acc
        }, {})

        const teamItems = await this.lazyLoaderByTeam.getMany(teamIds.map((x) => x.toString()))

        if (!teamItems) {
            return result
        }

        // For each team, filter functions by type and collect their IDs
        Object.entries(teamItems).forEach(([teamId, teamFns]) => {
            if (teamFns) {
                result[parseInt(teamId)] = teamFns.map((fn) => fn.id)
            }
        })

        return result
    }

    public async getInsightsFlowsForTeam(teamId: Team['id']): Promise<InsightsFlow[]> {
        return (await this.getInsightsFlowsForTeams([teamId]))[teamId] ?? []
    }

    public async getInsightsFlow(id: InsightsFlow['id']): Promise<InsightsFlow | null> {
        return (await this.lazyLoader.get(id)) ?? null
    }

    public async getInsightsFlows(ids: InsightsFlow['id'][]): Promise<Record<InsightsFlow['id'], InsightsFlow | null>> {
        return await this.lazyLoader.getMany(ids)
    }

    private onInsightsFlowsReloaded(teamId: Team['id'], hogFlowIds: InsightsFlow['id'][]): void {
        this.lazyLoaderByTeam.markForRefresh(teamId.toString())
        this.lazyLoader.markForRefresh(hogFlowIds)
    }

    private async fetchTeamInsightsFlows(teamIds: string[]): Promise<Record<string, InsightsFlowTeamInfo[]>> {
        logger.debug('[InsightsFlowManager]', 'Fetching team script flows', { teamIds })
        const response = await this.postgres.query<InsightsFlowTeamInfo>(
            PostgresUse.COMMON_READ,
            `SELECT id, team_id, version FROM insights_hogflow WHERE status='active' AND team_id = ANY($1)`,
            [teamIds],
            'fetchAllTeamInsightsFlows'
        )

        const byTeam: Record<string, InsightsFlowTeamInfo[]> = {}

        for (const item of response.rows) {
            const teamId = item.team_id.toString()
            if (!byTeam[teamId]) {
                byTeam[teamId] = []
            }
            byTeam[teamId].push(item)
        }

        return byTeam
    }

    private async fetchInsightsFlows(ids: string[]): Promise<Record<string, InsightsFlow | undefined>> {
        logger.debug('[InsightsFlowManager]', 'Fetching script flows', { ids })

        const response = await this.postgres.query<InsightsFlow>(
            PostgresUse.COMMON_READ,
            `SELECT ${FN_FLOW_FIELDS.join(', ')} FROM insights_hogflow WHERE id = ANY($1)`,
            [ids],
            'fetchInsightsFlows'
        )

        const items = response.rows

        return items.reduce<Record<string, InsightsFlow | undefined>>((acc, item) => {
            // Ensure billable_action_types is properly parsed as an array
            // PostgreSQL might return empty JSON arrays as empty objects
            if (item.billable_action_types !== undefined && item.billable_action_types !== null) {
                if (!Array.isArray(item.billable_action_types)) {
                    // If it's an empty object, convert to empty array
                    if (
                        typeof item.billable_action_types === 'object' &&
                        Object.keys(item.billable_action_types).length === 0
                    ) {
                        item.billable_action_types = []
                    } else {
                        // For any other non-array value, default to empty array
                        item.billable_action_types = []
                    }
                }
            }
            this.mergeEncryptedInputs(item)
            acc[item.id] = item
            return acc
        }, {})
    }

    // Decrypts `encrypted_inputs` and folds each action's secret inputs back into
    // `action.config.inputs` so the executor sees a whole config. `encrypted_inputs` is authoritative:
    // if a key also appears in plaintext `actions` (a row not yet re-saved since encryption shipped),
    // the encrypted value takes precedence, so both shapes resolve to the right value.
    private mergeEncryptedInputs(item: InsightsFlow): void {
        const raw = item.encrypted_inputs as unknown

        let decrypted: Record<string, Record<string, unknown>> | undefined
        if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
            // The sql lib occasionally hands back an already-parsed object
            decrypted = raw as Record<string, Record<string, unknown>>
        } else if (typeof raw === 'string' && raw) {
            try {
                const plaintext = this.encryptedFields.decrypt(raw)
                if (plaintext) {
                    decrypted = parseJSON(plaintext)
                }
            } catch (error) {
                // The blob is dropped below and the flow runs without its secrets (fail-open, matching
                // InsightsFunctionManagerService). The counter makes the failure alertable - the most likely
                // cause is Fernet key skew between Django and the workers.
                logger.warn('[InsightsFlowManager]', 'Could not decrypt encrypted inputs - flow will run without them', {
                    error: error instanceof Error ? error.message : 'Unknown error',
                })
                counterEncryptedInputsDecryptFailed.inc()
                captureException(error)
            }
        }

        // Drop the encrypted blob from the in-memory flow either way - downstream reads inputs off
        // `action.config.inputs`, and this keeps the ciphertext out of anything that logs the flow.
        delete item.encrypted_inputs

        if (!decrypted) {
            return
        }

        for (const action of item.actions ?? []) {
            const actionSecrets = decrypted[action.id]
            if (!actionSecrets || !('config' in action)) {
                continue
            }
            const config = action.config as { inputs?: Record<string, unknown> }
            config.inputs = { ...config.inputs, ...actionSecrets }

            // The top-level `trigger` is derived from the trigger action and is stripped of secrets
            // the same way. The source-webhook consumer builds its function from `hogFlow.trigger`
            // (not the action), so re-merge the trigger action's secrets there too or a webhook
            // trigger's secret auth header would be missing at runtime.
            if (action.type === 'trigger' && item.trigger && 'inputs' in item.trigger) {
                const trigger = item.trigger as { inputs?: Record<string, unknown> }
                trigger.inputs = { ...trigger.inputs, ...actionSecrets }
            }
        }
    }
}
