// AUTO-GENERATED from products/cdp/mcp/cdp_function_templates.yaml + OpenAPI — do not edit
import { z } from 'zod'

import type { Schemas } from '@/api/generated'
import {
    InsightsFunctionTemplatesListQueryParams,
    InsightsFunctionTemplatesRetrieveParams,
} from '@/generated/cdp_function_templates/api'
import { withInsightsUrl, pickResponseFields, type WithInsightsUrl } from '@/tools/tool-utils'
import type { Context, ToolBase, ZodObjectAny } from '@/tools/types'

const CdpFunctionTemplatesListSchema = InsightsFunctionTemplatesListQueryParams

const cdpFunctionTemplatesList = (): ToolBase<
    typeof CdpFunctionTemplatesListSchema,
    WithInsightsUrl<Schemas.PaginatedInsightsFunctionTemplateList>
> => ({
    name: 'cdp-function-templates-list',
    schema: CdpFunctionTemplatesListSchema,
    handler: async (context: Context, params: z.infer<typeof CdpFunctionTemplatesListSchema>) => {
        const projectId = await context.stateManager.getProjectId()
        const result = await context.api.request<Schemas.PaginatedInsightsFunctionTemplateList>({
            method: 'GET',
            path: `/api/projects/${encodeURIComponent(String(projectId))}/insights_function_templates/`,
            query: {
                limit: params.limit,
                offset: params.offset,
                template_id: params.template_id,
                type: params.type,
                types: params.types,
            },
        })
        const filtered = {
            ...result,
            results: (result.results ?? []).map((item: any) =>
                pickResponseFields(item, [
                    'id',
                    'name',
                    'description',
                    'type',
                    'status',
                    'category',
                    'free',
                    'icon_url',
                    'code_language',
                ])
            ),
        } as typeof result
        return await withInsightsUrl(context, filtered, '/pipeline/new')
    },
})

const CdpFunctionTemplatesRetrieveSchema = InsightsFunctionTemplatesRetrieveParams.omit({ project_id: true })

const cdpFunctionTemplatesRetrieve = (): ToolBase<
    typeof CdpFunctionTemplatesRetrieveSchema,
    Schemas.InsightsFunctionTemplate
> => ({
    name: 'cdp-function-templates-retrieve',
    schema: CdpFunctionTemplatesRetrieveSchema,
    handler: async (context: Context, params: z.infer<typeof CdpFunctionTemplatesRetrieveSchema>) => {
        const projectId = await context.stateManager.getProjectId()
        const result = await context.api.request<Schemas.InsightsFunctionTemplate>({
            method: 'GET',
            path: `/api/projects/${encodeURIComponent(String(projectId))}/insights_function_templates/${encodeURIComponent(String(params.template_id))}/`,
        })
        return result
    },
})

export const GENERATED_TOOLS: Record<string, () => ToolBase<ZodObjectAny>> = {
    'cdp-function-templates-list': cdpFunctionTemplatesList,
    'cdp-function-templates-retrieve': cdpFunctionTemplatesRetrieve,
}
