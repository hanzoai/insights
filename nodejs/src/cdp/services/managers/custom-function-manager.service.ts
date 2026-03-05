import { Hub, Team } from '../../../types'
import { PostgresUse } from '../../../utils/db/postgres'
import { parseJSON } from '../../../utils/json-parse'
import { LazyLoader } from '../../../utils/lazy-loader'
import { logger } from '../../../utils/logger'
import { captureException } from '../../../utils/insights'
import { CustomFunctionType, CustomFunctionTypeType } from '../../types'

export type CustomFunctionManagerHub = Pick<Hub, 'postgres' | 'pubSub' | 'encryptedFields'>

const CUSTOM_FUNCTION_FIELDS = [
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

export type CustomFunctionTeamInfo = Pick<CustomFunctionType, 'id' | 'team_id' | 'type'>

// /**
//  * Sorts CustomFunctions by their execution_order and creation date.
//  * Functions with no execution_order are placed at the end.
//  * When execution_order is the same, earlier created functions come first.
//  */
const sortCustomFunctions = (functions: CustomFunctionType[]): CustomFunctionType[] => {
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

export class CustomFunctionManagerService {
    private lazyLoader: LazyLoader<CustomFunctionType>
    private lazyLoaderByTeam: LazyLoader<CustomFunctionTeamInfo[]>

    constructor(private hub: CustomFunctionManagerHub) {
        this.lazyLoaderByTeam = new LazyLoader({
            name: 'custom_function_manager_by_team',
            loader: async (teamIds) => await this.fetchTeamCustomFunctions(teamIds),
        })

        this.lazyLoader = new LazyLoader({
            name: 'custom_function_manager',
            loader: async (ids) => await this.fetchCustomFunctions(ids),
        })

        this.hub.pubSub.on<{ teamId: Team['id']; customFunctionIds: CustomFunctionType['id'][] }>(
            'reload-custom-functions',
            ({ teamId, customFunctionIds }) => {
                logger.debug('⚡', '[PubSub] Reloading custom functions!', { teamId, customFunctionIds })
                this.onCustomFunctionsReloaded(teamId, customFunctionIds)
            }
        )
    }

    public async getCustomFunctionsForTeams(
        teamIds: Team['id'][],
        types: CustomFunctionTypeType[],
        /** Optional way to pre-filter custom functions before returning them */
        filterFn?: (customFunction: CustomFunctionType) => boolean
    ): Promise<Record<Team['id'], CustomFunctionType[]>> {
        const result = teamIds.reduce<Record<Team['id'], CustomFunctionType[]>>((acc, teamId) => {
            acc[teamId] = []
            return acc
        }, {})

        const teamCustomFunctionIds = await this.getCustomFunctionIdsForTeams(teamIds, types)
        const allCustomFunctionIds = Object.values(teamCustomFunctionIds).flat()
        const customFunctions = await this.lazyLoader.getMany(allCustomFunctionIds)

        for (const fn of Object.values(customFunctions)) {
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
            result[parseInt(teamId)] = sortCustomFunctions(fns)
        }

        return result
    }

    public async getCustomFunctionIdsForTeams(
        teamIds: Team['id'][],
        types: CustomFunctionTypeType[]
    ): Promise<Record<Team['id'], string[]>> {
        const result = teamIds.reduce<Record<Team['id'], string[]>>((acc, teamId) => {
            acc[teamId] = []
            return acc
        }, {})

        const teamCustomFunctions = await this.lazyLoaderByTeam.getMany(teamIds.map((x) => x.toString()))

        if (!teamCustomFunctions) {
            return result
        }

        // For each team, filter functions by type and collect their IDs
        Object.entries(teamCustomFunctions).forEach(([teamId, teamFns]) => {
            if (teamFns) {
                result[parseInt(teamId)] = teamFns.filter((fn) => types.includes(fn.type)).map((fn) => fn.id)
            }
        })

        return result
    }

    public async getCustomFunctionsForTeam(teamId: Team['id'], types: CustomFunctionTypeType[]): Promise<CustomFunctionType[]> {
        return (await this.getCustomFunctionsForTeams([teamId], types))[teamId] ?? []
    }

    public async getCustomFunction(id: CustomFunctionType['id']): Promise<CustomFunctionType | null> {
        return (await this.lazyLoader.get(id)) ?? null
    }

    public async getCustomFunctions(
        ids: CustomFunctionType['id'][]
    ): Promise<Record<CustomFunctionType['id'], CustomFunctionType | null>> {
        return await this.lazyLoader.getMany(ids)
    }

    public async fetchCustomFunction(id: CustomFunctionType['id']): Promise<CustomFunctionType | null> {
        const items: CustomFunctionType[] = (
            await this.hub.postgres.query(
                PostgresUse.COMMON_READ,
                `SELECT ${CUSTOM_FUNCTION_FIELDS.join(', ')}
                FROM posthog_customfunction
                WHERE id = $1 AND deleted = FALSE`,
                [id],
                'fetchCustomFunction'
            )
        ).rows

        this.sanitize(items)
        return items[0] ?? null
    }

    private onCustomFunctionsReloaded(teamId: Team['id'], customFunctionIds: CustomFunctionType['id'][]): void {
        this.lazyLoaderByTeam.markForRefresh(teamId.toString())
        this.lazyLoader.markForRefresh(customFunctionIds)
    }

    private async fetchTeamCustomFunctions(teamIds: string[]): Promise<Record<string, CustomFunctionTeamInfo[]>> {
        logger.debug('[CustomFunctionManager]', 'Fetching team custom functions', { teamIds })
        const response = await this.hub.postgres.query<Pick<CustomFunctionType, 'id' | 'team_id' | 'type'>>(
            PostgresUse.COMMON_READ,
            `SELECT id, team_id, type FROM posthog_customfunction WHERE enabled = TRUE AND deleted = FALSE AND team_id = ANY($1)`,
            [teamIds],
            'fetchAllTeamCustomFunctions'
        )

        const customFunctionsByTeam: Record<string, CustomFunctionTeamInfo[]> = {}

        for (const item of response.rows) {
            const teamId = item.team_id.toString()
            if (!customFunctionsByTeam[teamId]) {
                customFunctionsByTeam[teamId] = []
            }
            customFunctionsByTeam[teamId].push(item)
        }

        return customFunctionsByTeam
    }

    private async fetchCustomFunctions(ids: string[]): Promise<Record<string, CustomFunctionType | undefined>> {
        logger.debug('[CustomFunctionManager]', 'Fetching custom functions', { ids })

        const response = await this.hub.postgres.query<CustomFunctionType>(
            PostgresUse.COMMON_READ,
            `SELECT ${CUSTOM_FUNCTION_FIELDS.join(', ')} FROM posthog_customfunction WHERE id = ANY($1)`,
            [ids],
            'fetchCustomFunctions'
        )

        const customFunctions = response.rows

        this.sanitize(customFunctions)

        return customFunctions.reduce<Record<string, CustomFunctionType | undefined>>((acc, customFunction) => {
            acc[customFunction.id] = customFunction
            return acc
        }, {})
    }

    public sanitize(items: CustomFunctionType[]): void {
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
                            '[CustomFunctionManager]',
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
