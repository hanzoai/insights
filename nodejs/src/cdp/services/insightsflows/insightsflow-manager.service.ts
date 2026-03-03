// @ts-nocheck
import { InsightsFlow } from '~/schema/insightsflow'
import { Team } from '~/types'
import { PostgresRouter, PostgresUse } from '~/utils/db/postgres'
import { LazyLoader } from '~/utils/lazy-loader'
import { logger } from '~/utils/logger'
import { PubSub } from '~/utils/pubsub'

// TODO: Make sure we only have fields we truly need
const INSIGHTS_FLOW_FIELDS = [
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
    'abort_action',
    'billable_action_types',
]

export type InsightsFlowTeamInfo = Pick<InsightsFlow, 'id' | 'team_id' | 'version'>

export class InsightsFlowManagerService {
    private lazyLoader: LazyLoader<InsightsFlow>
    private lazyLoaderByTeam: LazyLoader<InsightsFlowTeamInfo[]>

    constructor(
        private postgres: PostgresRouter,
        private pubSub: PubSub
    ) {
        this.lazyLoaderByTeam = new LazyLoader({
            name: 'insights_flow_manager_by_team',
            loader: async (teamIds) => await this.fetchTeamInsightsFlows(teamIds),
        })

        this.lazyLoader = new LazyLoader({
            name: 'insights_flow_manager',
            loader: async (ids) => await this.fetchInsightsFlows(ids),
        })

        this.pubSub.on<{ teamId: Team['id']; insightsFlowIds: InsightsFlow['id'][] }>('reload-hog-flows', (message) => {
            const { teamId, insightsFlowIds } = message
            logger.debug('⚡', '[PubSub] Reloading custom flows!', { teamId, insightsFlowIds })
            this.onInsightsFlowsReloaded(teamId, insightsFlowIds)
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

    private onInsightsFlowsReloaded(teamId: Team['id'], insightsFlowIds: InsightsFlow['id'][]): void {
        this.lazyLoaderByTeam.markForRefresh(teamId.toString())
        this.lazyLoader.markForRefresh(insightsFlowIds)
    }

    private async fetchTeamInsightsFlows(teamIds: string[]): Promise<Record<string, InsightsFlowTeamInfo[]>> {
        logger.debug('[InsightsFlowManager]', 'Fetching team custom flows', { teamIds })
        const response = await this.postgres.query<InsightsFlowTeamInfo>(
            PostgresUse.COMMON_READ,
            `SELECT id, team_id, version FROM posthog_hogflow WHERE status='active' AND team_id = ANY($1)`,
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
        logger.debug('[InsightsFlowManager]', 'Fetching custom flows', { ids })

        const response = await this.postgres.query<InsightsFlow>(
            PostgresUse.COMMON_READ,
            `SELECT ${INSIGHTS_FLOW_FIELDS.join(', ')} FROM posthog_hogflow WHERE id = ANY($1)`,
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
            acc[item.id] = item
            return acc
        }, {})
    }
}
