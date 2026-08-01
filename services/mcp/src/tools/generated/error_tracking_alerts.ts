// AUTO-GENERATED from products/error_tracking/mcp/error_tracking_alerts.yaml + OpenAPI — do not edit
import { z } from 'zod'

import type { Schemas } from '@/api/generated'
import {
    InsightsFunctionsCreateBody,
    InsightsFunctionsDestroyParams,
    InsightsFunctionsListQueryParams,
    InsightsFunctionsPartialUpdateBody,
    InsightsFunctionsPartialUpdateParams,
} from '@/generated/error_tracking_alerts/api'
import { withInsightsUrl, pickResponseFields, type WithInsightsUrl } from '@/tools/tool-utils'
import type { Context, ToolBase, ZodObjectAny } from '@/tools/types'

const ErrorTrackingAlertsCreateSchema = InsightsFunctionsCreateBody.extend({
    type: InsightsFunctionsCreateBody.shape['type'].describe(
        'Must be `internal_destination` for an error tracking alert. Other values create non-alert InsightsFunctions and should be created via `cdp-functions-create` instead.'
    ),
    template_id: InsightsFunctionsCreateBody.shape['template_id'].describe(
        'Integration template — one of `template-slack`, `template-webhook`, `template-discord`, `template-microsoft-teams`, `template-linear`, `template-github`, `template-gitlab`.'
    ),
    enabled: InsightsFunctionsCreateBody.shape['enabled'].describe('Whether the alert is active. Defaults to true.'),
})

const errorTrackingAlertsCreate = (): ToolBase<typeof ErrorTrackingAlertsCreateSchema, Schemas.InsightsFunction> => ({
    name: 'error-tracking-alerts-create',
    schema: ErrorTrackingAlertsCreateSchema,
    handler: async (context: Context, params: z.infer<typeof ErrorTrackingAlertsCreateSchema>) => {
        const projectId = await context.stateManager.getProjectId()
        const body: Record<string, unknown> = {}
        if (params.type !== undefined) {
            body['type'] = params.type
        }
        if (params.name !== undefined) {
            body['name'] = params.name
        }
        if (params.description !== undefined) {
            body['description'] = params.description
        }
        if (params.enabled !== undefined) {
            body['enabled'] = params.enabled
        }
        if (params.script !== undefined) {
            body['script'] = params.script
        }
        if (params.inputs_schema !== undefined) {
            body['inputs_schema'] = params.inputs_schema
        }
        if (params.inputs !== undefined) {
            body['inputs'] = params.inputs
        }
        if (params.filters !== undefined) {
            body['filters'] = params.filters
        }
        if (params.masking !== undefined) {
            body['masking'] = params.masking
        }
        if (params.mappings !== undefined) {
            body['mappings'] = params.mappings
        }
        if (params.icon_url !== undefined) {
            body['icon_url'] = params.icon_url
        }
        if (params.template_id !== undefined) {
            body['template_id'] = params.template_id
        }
        if (params.execution_order !== undefined) {
            body['execution_order'] = params.execution_order
        }
        const result = await context.api.request<Schemas.InsightsFunction>({
            method: 'POST',
            path: `/api/projects/${encodeURIComponent(String(projectId))}/insights_functions/`,
            body,
        })
        return result
    },
})

const ErrorTrackingAlertsDeleteSchema = InsightsFunctionsDestroyParams.omit({ project_id: true })

const errorTrackingAlertsDelete = (): ToolBase<typeof ErrorTrackingAlertsDeleteSchema, Schemas.InsightsFunction> => ({
    name: 'error-tracking-alerts-delete',
    schema: ErrorTrackingAlertsDeleteSchema,
    handler: async (context: Context, params: z.infer<typeof ErrorTrackingAlertsDeleteSchema>) => {
        const projectId = await context.stateManager.getProjectId()
        const result = await context.api.request<Schemas.InsightsFunction>({
            method: 'PATCH',
            path: `/api/projects/${encodeURIComponent(String(projectId))}/insights_functions/${encodeURIComponent(String(params.id))}/`,
            body: { deleted: true },
        })
        return result
    },
})

const ErrorTrackingAlertsListSchema = InsightsFunctionsListQueryParams

const errorTrackingAlertsList = (): ToolBase<
    typeof ErrorTrackingAlertsListSchema,
    WithInsightsUrl<Schemas.PaginatedInsightsFunctionMinimalList>
> => ({
    name: 'error-tracking-alerts-list',
    schema: ErrorTrackingAlertsListSchema,
    handler: async (context: Context, params: z.infer<typeof ErrorTrackingAlertsListSchema>) => {
        const projectId = await context.stateManager.getProjectId()
        const result = await context.api.request<Schemas.PaginatedInsightsFunctionMinimalList>({
            method: 'GET',
            path: `/api/projects/${encodeURIComponent(String(projectId))}/insights_functions/`,
            query: {
                created_at: params.created_at,
                created_by: params.created_by,
                enabled: params.enabled,
                id: params.id,
                limit: params.limit,
                offset: params.offset,
                type: Array.isArray(params.type) ? params.type.join(',') || undefined : params.type,
                updated_at: params.updated_at,
            },
        })
        const filtered = {
            ...result,
            results: (result.results ?? []).map((item: any) =>
                pickResponseFields(item, [
                    'id',
                    'type',
                    'name',
                    'description',
                    'enabled',
                    'icon_url',
                    'template.id',
                    'status',
                    'created_at',
                    'updated_at',
                    'created_by',
                    'filters',
                ])
            ),
        } as typeof result
        return await withInsightsUrl(context, filtered, '/error_tracking')
    },
})

const ErrorTrackingAlertsPartialUpdateSchema = InsightsFunctionsPartialUpdateParams.omit({ project_id: true })
    .extend(InsightsFunctionsPartialUpdateBody.shape)
    .extend({
        enabled: InsightsFunctionsPartialUpdateBody.shape['enabled'].describe(
            'Set to true to activate the alert or false to silence it without deleting.'
        ),
    })

const errorTrackingAlertsPartialUpdate = (): ToolBase<
    typeof ErrorTrackingAlertsPartialUpdateSchema,
    Schemas.InsightsFunction
> => ({
    name: 'error-tracking-alerts-partial-update',
    schema: ErrorTrackingAlertsPartialUpdateSchema,
    handler: async (context: Context, params: z.infer<typeof ErrorTrackingAlertsPartialUpdateSchema>) => {
        const projectId = await context.stateManager.getProjectId()
        const body: Record<string, unknown> = {}
        if (params.type !== undefined) {
            body['type'] = params.type
        }
        if (params.name !== undefined) {
            body['name'] = params.name
        }
        if (params.description !== undefined) {
            body['description'] = params.description
        }
        if (params.enabled !== undefined) {
            body['enabled'] = params.enabled
        }
        if (params.script !== undefined) {
            body['script'] = params.script
        }
        if (params.inputs_schema !== undefined) {
            body['inputs_schema'] = params.inputs_schema
        }
        if (params.inputs !== undefined) {
            body['inputs'] = params.inputs
        }
        if (params.filters !== undefined) {
            body['filters'] = params.filters
        }
        if (params.masking !== undefined) {
            body['masking'] = params.masking
        }
        if (params.mappings !== undefined) {
            body['mappings'] = params.mappings
        }
        if (params.icon_url !== undefined) {
            body['icon_url'] = params.icon_url
        }
        if (params.template_id !== undefined) {
            body['template_id'] = params.template_id
        }
        if (params.execution_order !== undefined) {
            body['execution_order'] = params.execution_order
        }
        const result = await context.api.request<Schemas.InsightsFunction>({
            method: 'PATCH',
            path: `/api/projects/${encodeURIComponent(String(projectId))}/insights_functions/${encodeURIComponent(String(params.id))}/`,
            body,
        })
        return result
    },
})

export const GENERATED_TOOLS: Record<string, () => ToolBase<ZodObjectAny>> = {
    'error-tracking-alerts-create': errorTrackingAlertsCreate,
    'error-tracking-alerts-delete': errorTrackingAlertsDelete,
    'error-tracking-alerts-list': errorTrackingAlertsList,
    'error-tracking-alerts-partial-update': errorTrackingAlertsPartialUpdate,
}
