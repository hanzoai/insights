import { PostgresRouter, PostgresUse } from '../../../utils/db/postgres'
import { LazyLoader } from '../../../utils/lazy-loader'
import { logger } from '../../../utils/logger'
import { DBInsightsFunctionTemplate } from '../../types'

const INSIGHTS_FUNCTION_TEMPLATE_FIELDS = ['id', 'template_id', 'sha', 'name', 'inputs_schema', 'bytecode', 'type', 'free']

export class InsightsFunctionTemplateManagerService {
    private lazyLoader: LazyLoader<DBInsightsFunctionTemplate>
    // private started: boolean

    constructor(private postgres: PostgresRouter) {
        // this.started = false

        this.lazyLoader = new LazyLoader({
            name: 'insights_function_template_manager',
            loader: async (ids) => await this.fetchInsightsFunctionTemplates(ids),
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

    public async getInsightsFunctionTemplate(id: DBInsightsFunctionTemplate['id']): Promise<DBInsightsFunctionTemplate | null> {
        return (await this.lazyLoader.get(id)) ?? null
    }

    public async getInsightsFunctionTemplates(
        ids: DBInsightsFunctionTemplate['id'][]
    ): Promise<Record<DBInsightsFunctionTemplate['id'], DBInsightsFunctionTemplate | null>> {
        return await this.lazyLoader.getMany(ids)
    }

    // NOTE: Currently this essentially loads the "latest" template each time. We may need to swap this to using a specific version
    private async fetchInsightsFunctionTemplates(ids: string[]): Promise<Record<string, DBInsightsFunctionTemplate | undefined>> {
        logger.info('[InsightsFunctionTemplateManager]', 'Fetching custom function templates', { ids })

        const response = await this.postgres.query<DBInsightsFunctionTemplate>(
            PostgresUse.COMMON_READ,
            `SELECT ${INSIGHTS_FUNCTION_TEMPLATE_FIELDS.join(
                ', '
            )} FROM posthog_hogfunctiontemplate WHERE template_id = ANY($1)`,
            [ids],
            'fetchInsightsFunctionTemplates'
        )

        const insightsFunctionTemplates = response.rows

        return insightsFunctionTemplates.reduce<Record<string, DBInsightsFunctionTemplate | undefined>>(
            (acc, insightsFunctionTemplate) => {
                acc[insightsFunctionTemplate.template_id] = insightsFunctionTemplate
                return acc
            },
            {}
        )
    }
}
