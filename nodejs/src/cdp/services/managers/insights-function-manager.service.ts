import { Hub, Team } from '../../../types'
import { PostgresUse } from '../../../utils/db/postgres'
import { parseJSON } from '../../../utils/json-parse'
import { LazyLoader } from '../../../utils/lazy-loader'
import { logger } from '../../../utils/logger'
import { captureException } from '../../../utils/insights'
import { InsightsFunctionType, InsightsFunctionTypeType } from '../../types'

export type InsightsFunctionManagerHub = Pick<Hub, 'postgres' | 'pubSub' | 'encryptedFields'>

const INSIGHTS_FUNCTION_FIELDS = [
    'id',
    'team_id',
    'name',
    'enabled',
    'deleted',
    'inputs',
    'encrypted_inputs',
    'inputs_schema',
    'filters',
    'mappings',
    'bytecode',
    'masking',
    'type',
    'template_id',
    'execution_order',
    'batch_export_id',
    'created_at',
    'updated_at',
]

export type InsightsFunctionTeamInfo = Pick<InsightsFunctionType, 'id' | 'team_id' | 'type'>

// /**
//  * Sorts InsightsFunctions by their execution_order and creation date.
//  * Functions with no execution_order are placed at the end.
//  * When execution_order is the same, earlier created functions come first.
//  */
const sortInsightsFunctions = (functions: InsightsFunctionType[]): InsightsFunctionType[] => {
    return [...functions].sort((a, b) => {
        // If either execution_order is null/undefined, it should go last
        if (a.execution_order == null && b.execution_order == null) {
            // Both are null/undefined, sort by creation date - ISO dates are lexicographically sortable
            return a.created_at.localeCompare(b.created_at)
        }

        // Null/undefined values go last
        if (a.execution_order == null) {
            return 1
        }
        if (b.execution_order == null) {
            return -1
        }

        // If execution orders are different, sort by them
        if (a.execution_order !== b.execution_order) {
            return a.execution_order - b.execution_order
        }

        // If execution orders are the same, sort by creation date
        return a.created_at.localeCompare(b.created_at)
    })
}

export class InsightsFunctionManagerService {
    private lazyLoader: LazyLoader<InsightsFunctionType>
    private lazyLoaderByTeam: LazyLoader<InsightsFunctionTeamInfo[]>

    constructor(private hub: InsightsFunctionManagerHub) {
        this.lazyLoaderByTeam = new LazyLoader({
            name: 'insights_function_manager_by_team',
            loader: async (teamIds) => await this.fetchTeamInsightsFunctions(teamIds),
        })

        this.lazyLoader = new LazyLoader({
            name: 'insights_function_manager',
            loader: async (ids) => await this.fetchInsightsFunctions(ids),
        })

        this.hub.pubSub.on<{ teamId: Team['id']; insightsFunctionIds: InsightsFunctionType['id'][] }>(
            'reload-insights-functions',
            ({ teamId, insightsFunctionIds }) => {
                logger.debug('⚡', '[PubSub] Reloading custom functions!', { teamId, insightsFunctionIds })
                this.onInsightsFunctionsReloaded(teamId, insightsFunctionIds)
            }
        )
    }

    public async getInsightsFunctionsForTeams(
        teamIds: Team['id'][],
        types: InsightsFunctionTypeType[],
        /** Optional way to pre-filter custom functions before returning them */
        filterFn?: (insightsFunction: InsightsFunctionType) => boolean
    ): Promise<Record<Team['id'], InsightsFunctionType[]>> {
        const result = teamIds.reduce<Record<Team['id'], InsightsFunctionType[]>>((acc, teamId) => {
            acc[teamId] = []
            return acc
        }, {})

        const teamInsightsFunctionIds = await this.getInsightsFunctionIdsForTeams(teamIds, types)
        const allInsightsFunctionIds = Object.values(teamInsightsFunctionIds).flat()
        const insightsFunctions = await this.lazyLoader.getMany(allInsightsFunctionIds)

        for (const fn of Object.values(insightsFunctions)) {
            if (!fn) {
                continue
            }
            if (filterFn && !filterFn(fn)) {
                continue
            }
            result[fn.team_id] = result[fn.team_id] ?? []
            result[fn.team_id].push(fn)
        }

        for (const [teamId, fns] of Object.entries(result)) {
            result[parseInt(teamId)] = sortInsightsFunctions(fns)
        }

        return result
    }

    public async getInsightsFunctionIdsForTeams(
        teamIds: Team['id'][],
        types: InsightsFunctionTypeType[]
    ): Promise<Record<Team['id'], string[]>> {
        const result = teamIds.reduce<Record<Team['id'], string[]>>((acc, teamId) => {
            acc[teamId] = []
            return acc
        }, {})

        const teamInsightsFunctions = await this.lazyLoaderByTeam.getMany(teamIds.map((x) => x.toString()))

        if (!teamInsightsFunctions) {
            return result
        }

        // For each team, filter functions by type and collect their IDs
        Object.entries(teamInsightsFunctions).forEach(([teamId, teamFns]) => {
            if (teamFns) {
                result[parseInt(teamId)] = teamFns.filter((fn) => types.includes(fn.type)).map((fn) => fn.id)
            }
        })

        return result
    }

    public async getInsightsFunctionsForTeam(teamId: Team['id'], types: InsightsFunctionTypeType[]): Promise<InsightsFunctionType[]> {
        return (await this.getInsightsFunctionsForTeams([teamId], types))[teamId] ?? []
    }

    public async getInsightsFunction(id: InsightsFunctionType['id']): Promise<InsightsFunctionType | null> {
        return (await this.lazyLoader.get(id)) ?? null
    }

    public async getInsightsFunctions(
        ids: InsightsFunctionType['id'][]
    ): Promise<Record<InsightsFunctionType['id'], InsightsFunctionType | null>> {
        return await this.lazyLoader.getMany(ids)
    }

    public async fetchInsightsFunction(id: InsightsFunctionType['id']): Promise<InsightsFunctionType | null> {
        const items: InsightsFunctionType[] = (
            await this.hub.postgres.query(
                PostgresUse.COMMON_READ,
                `SELECT ${INSIGHTS_FUNCTION_FIELDS.join(', ')}
                FROM insights_function
                WHERE id = $1 AND deleted = FALSE`,
                [id],
                'fetchInsightsFunction'
            )
        ).rows

        this.sanitize(items)
        return items[0] ?? null
    }

    private onInsightsFunctionsReloaded(teamId: Team['id'], insightsFunctionIds: InsightsFunctionType['id'][]): void {
        this.lazyLoaderByTeam.markForRefresh(teamId.toString())
        this.lazyLoader.markForRefresh(insightsFunctionIds)
    }

    private async fetchTeamInsightsFunctions(teamIds: string[]): Promise<Record<string, InsightsFunctionTeamInfo[]>> {
        logger.debug('[InsightsFunctionManager]', 'Fetching team custom functions', { teamIds })
        const response = await this.hub.postgres.query<Pick<InsightsFunctionType, 'id' | 'team_id' | 'type'>>(
            PostgresUse.COMMON_READ,
            `SELECT id, team_id, type FROM insights_function WHERE enabled = TRUE AND deleted = FALSE AND team_id = ANY($1)`,
            [teamIds],
            'fetchAllTeamInsightsFunctions'
        )

        const insightsFunctionsByTeam: Record<string, InsightsFunctionTeamInfo[]> = {}

        for (const item of response.rows) {
            const teamId = item.team_id.toString()
            if (!insightsFunctionsByTeam[teamId]) {
                insightsFunctionsByTeam[teamId] = []
            }
            insightsFunctionsByTeam[teamId].push(item)
        }

        return insightsFunctionsByTeam
    }

    private async fetchInsightsFunctions(ids: string[]): Promise<Record<string, InsightsFunctionType | undefined>> {
        logger.debug('[InsightsFunctionManager]', 'Fetching custom functions', { ids })

        const response = await this.hub.postgres.query<InsightsFunctionType>(
            PostgresUse.COMMON_READ,
            `SELECT ${INSIGHTS_FUNCTION_FIELDS.join(', ')} FROM insights_function WHERE id = ANY($1)`,
            [ids],
            'fetchInsightsFunctions'
        )

        const insightsFunctions = response.rows

        this.sanitize(insightsFunctions)

        return insightsFunctions.reduce<Record<string, InsightsFunctionType | undefined>>((acc, insightsFunction) => {
            acc[insightsFunction.id] = insightsFunction
            return acc
        }, {})
    }

    public sanitize(items: InsightsFunctionType[]): void {
        items.forEach((item) => {
            // Decrypt inputs
            const encryptedInputs = item.encrypted_inputs

            if (!Array.isArray(item.inputs_schema)) {
                // NOTE: The sql lib can sometimes return an empty object instead of an empty array
                item.inputs_schema = []
            }

            // Handle case where encrypted_inputs is already an object
            if (encryptedInputs && typeof encryptedInputs === 'object' && !Array.isArray(encryptedInputs)) {
                return
            }

            // Handle case where encrypted_inputs is a string that needs decryption
            if (typeof encryptedInputs === 'string') {
                try {
                    const decrypted = this.hub.encryptedFields.decrypt(encryptedInputs)
                    if (decrypted) {
                        item.encrypted_inputs = parseJSON(decrypted)
                    }
                } catch (error) {
                    if (encryptedInputs) {
                        logger.warn(
                            '[InsightsFunctionManager]',
                            'Could not parse encrypted inputs - preserving original value',
                            {
                                error: error instanceof Error ? error.message : 'Unknown error',
                            }
                        )
                        captureException(error)
                    }
                }
            }
            // For any other case (null, undefined, unexpected types), leave as-is
        })
    }
}
