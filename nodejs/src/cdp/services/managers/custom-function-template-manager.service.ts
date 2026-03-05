import { PostgresRouter, PostgresUse } from '../../../utils/db/postgres'
import { LazyLoader } from '../../../utils/lazy-loader'
import { logger } from '../../../utils/logger'
import { DBCustomFunctionTemplate } from '../../types'

const CUSTOM_FUNCTION_TEMPLATE_FIELDS = ['id', 'template_id', 'sha', 'name', 'inputs_schema', 'bytecode', 'type', 'free']

export class CustomFunctionTemplateManagerService {
    private lazyLoader: LazyLoader<DBCustomFunctionTemplate>
    // private started: boolean

    constructor(private postgres: PostgresRouter) {
        // this.started = false

        this.lazyLoader = new LazyLoader({
            name: 'custom_function_template_manager',
            loader: async (ids) => await this.fetchCustomFunctionTemplates(ids),
        })
    }

    // public async start(): Promise<void> {
    //     // TRICKY - when running with individual capabilities, this won't run twice but locally or as a complete service it will...
    //     if (this.started) {
    //         return
    //     }
    //     this.started = true
    // }

    // public async stop(): Promise<void> {}

    public async getCustomFunctionTemplate(id: DBCustomFunctionTemplate['id']): Promise<DBCustomFunctionTemplate | null> {
        return (await this.lazyLoader.get(id)) ?? null
    }

    public async getCustomFunctionTemplates(
        ids: DBCustomFunctionTemplate['id'][]
    ): Promise<Record<DBCustomFunctionTemplate['id'], DBCustomFunctionTemplate | null>> {
        return await this.lazyLoader.getMany(ids)
    }

    // NOTE: Currently this essentially loads the "latest" template each time. We may need to swap this to using a specific version
    private async fetchCustomFunctionTemplates(ids: string[]): Promise<Record<string, DBCustomFunctionTemplate | undefined>> {
        logger.info('[CustomFunctionTemplateManager]', 'Fetching custom function templates', { ids })

        const response = await this.postgres.query<DBCustomFunctionTemplate>(
            PostgresUse.COMMON_READ,
            `SELECT ${CUSTOM_FUNCTION_TEMPLATE_FIELDS.join(
                ', '
            )} FROM posthog_customfunctiontemplate WHERE template_id = ANY($1)`,
            [ids],
            'fetchCustomFunctionTemplates'
        )

        const customFunctionTemplates = response.rows

        return customFunctionTemplates.reduce<Record<string, DBCustomFunctionTemplate | undefined>>(
            (acc, customFunctionTemplate) => {
                acc[customFunctionTemplate.template_id] = customFunctionTemplate
                return acc
            },
            {}
        )
    }
}
