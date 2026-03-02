import { CustomFlow } from '~/schema/customflow'
import { Team } from '~/types'
import { PostgresRouter, PostgresUse } from '~/utils/db/postgres'
import { LazyLoader } from '~/utils/lazy-loader'
import { logger } from '~/utils/logger'
import { PubSub } from '~/utils/pubsub'

// TODO: Make sure we only have fields we truly need
const CUSTOM_FLOW_FIELDS = [
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

export type CustomFlowTeamInfo = Pick<CustomFlow, 'id' | 'team_id' | 'version'>

export class CustomFlowManagerService {
    private lazyLoader: LazyLoader<CustomFlow>
    private lazyLoaderByTeam: LazyLoader<CustomFlowTeamInfo[]>

    constructor(
        private postgres: PostgresRouter,
        private pubSub: PubSub
    ) {
        this.lazyLoaderByTeam = new LazyLoader({
            name: 'custom_flow_manager_by_team',
            loader: async (teamIds) => await this.fetchTeamCustomFlows(teamIds),
        })

        this.lazyLoader = new LazyLoader({
            name: 'custom_flow_manager',
            loader: async (ids) => await this.fetchCustomFlows(ids),
        })

        this.pubSub.on<{ teamId: Team['id']; customFlowIds: CustomFlow['id'][] }>('reload-hog-flows', (message) => {
            const { teamId, customFlowIds } = message
            logger.debug('⚡', '[PubSub] Reloading custom flows!', { teamId, customFlowIds })
            this.onCustomFlowsReloaded(teamId, customFlowIds)
        })
    }

    public async getCustomFlowsForTeams(teamIds: Team['id'][]): Promise<Record<Team['id'], CustomFlow[]>> {
        const result = teamIds.reduce<Record<Team['id'], CustomFlow[]>>((acc, teamId) => {
            acc[teamId] = []
            return acc
        }, {})

        const teamItemIds = await this.getCustomFlowIdsForTeams(teamIds)
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

    public async getCustomFlowIdsForTeams(teamIds: Team['id'][]): Promise<Record<Team['id'], string[]>> {
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

    public async getCustomFlowsForTeam(teamId: Team['id']): Promise<CustomFlow[]> {
        return (await this.getCustomFlowsForTeams([teamId]))[teamId] ?? []
    }

    public async getCustomFlow(id: CustomFlow['id']): Promise<CustomFlow | null> {
        return (await this.lazyLoader.get(id)) ?? null
    }

    public async getCustomFlows(ids: CustomFlow['id'][]): Promise<Record<CustomFlow['id'], CustomFlow | null>> {
        return await this.lazyLoader.getMany(ids)
    }

    private onCustomFlowsReloaded(teamId: Team['id'], customFlowIds: CustomFlow['id'][]): void {
        this.lazyLoaderByTeam.markForRefresh(teamId.toString())
        this.lazyLoader.markForRefresh(customFlowIds)
    }

    private async fetchTeamCustomFlows(teamIds: string[]): Promise<Record<string, CustomFlowTeamInfo[]>> {
        logger.debug('[CustomFlowManager]', 'Fetching team custom flows', { teamIds })
        const response = await this.postgres.query<CustomFlowTeamInfo>(
            PostgresUse.COMMON_READ,
            `SELECT id, team_id, version FROM posthog_customflow WHERE status='active' AND team_id = ANY($1)`,
            [teamIds],
            'fetchAllTeamCustomFlows'
        )

        const byTeam: Record<string, CustomFlowTeamInfo[]> = {}

        for (const item of response.rows) {
            const teamId = item.team_id.toString()
            if (!byTeam[teamId]) {
                byTeam[teamId] = []
            }
            byTeam[teamId].push(item)
        }

        return byTeam
    }

    private async fetchCustomFlows(ids: string[]): Promise<Record<string, CustomFlow | undefined>> {
        logger.debug('[CustomFlowManager]', 'Fetching custom flows', { ids })

        const response = await this.postgres.query<CustomFlow>(
            PostgresUse.COMMON_READ,
            `SELECT ${CUSTOM_FLOW_FIELDS.join(', ')} FROM posthog_customflow WHERE id = ANY($1)`,
            [ids],
            'fetchCustomFlows'
        )

        const items = response.rows

        return items.reduce<Record<string, CustomFlow | undefined>>((acc, item) => {
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
