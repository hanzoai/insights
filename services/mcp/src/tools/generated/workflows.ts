// AUTO-GENERATED from products/workflows/mcp/tools.yaml + OpenAPI — do not edit
import { z } from 'zod'

import type { Schemas } from '@/api/generated'
import {
    InsightsFlowsBatchJobsListParams,
    InsightsFlowsCreateBody,
    InsightsFlowsDiscardDraftCreateParams,
    InsightsFlowsInvocationResultRetrieveParams,
    InsightsFlowsInvocationResultsRetrieveParams,
    InsightsFlowsInvocationResultsRetrieveQueryParams,
    InsightsFlowsInvocationsCreateBody,
    InsightsFlowsInvocationsCreateParams,
    InsightsFlowsListQueryParams,
    InsightsFlowsLogsRetrieveParams,
    InsightsFlowsLogsRetrieveQueryParams,
    InsightsFlowsMetricsGlobalRetrieveQueryParams,
    InsightsFlowsMetricsRetrieveParams,
    InsightsFlowsMetricsRetrieveQueryParams,
    InsightsFlowsPartialUpdateBody,
    InsightsFlowsPartialUpdateParams,
    InsightsFlowsPublishCreateBody,
    InsightsFlowsPublishCreateParams,
    InsightsFlowsRetrieveParams,
    InsightsFlowsRevisionsListParams,
    InsightsFlowsRevisionsListQueryParams,
    InsightsFlowsRevisionsRestoreCreateBody,
    InsightsFlowsRevisionsRestoreCreateParams,
    InsightsFlowsRevisionsRetrieveParams,
    InsightsFlowsSchedulesPartialUpdateBody,
    InsightsFlowsSchedulesPartialUpdateParams,
} from '@/generated/workflows/api'
import { withUiApp } from '@/resources/ui-apps'
import { WorkflowGraphPatchSchema } from '@/schema/tool-inputs'
import { withInsightsUrl, type WithInsightsUrl } from '@/tools/tool-utils'
import type { Context, ToolBase, ZodObjectAny } from '@/tools/types'

const WorkflowsCreateSchema = InsightsFlowsCreateBody

const workflowsCreate = (): ToolBase<typeof WorkflowsCreateSchema, WithInsightsUrl<Schemas.InsightsFlow>> =>
    withUiApp('workflow', {
        name: 'workflows-create',
        schema: WorkflowsCreateSchema,
        handler: async (context: Context, params: z.infer<typeof WorkflowsCreateSchema>) => {
            const projectId = await context.stateManager.getProjectId()
            const body: Record<string, unknown> = {}
            if (params.name !== undefined) {
                body['name'] = params.name
            }
            if (params.description !== undefined) {
                body['description'] = params.description
            }
            if (params.status !== undefined) {
                body['status'] = params.status
            }
            if (params.trigger_masking !== undefined) {
                body['trigger_masking'] = params.trigger_masking
            }
            if (params.conversion !== undefined) {
                body['conversion'] = params.conversion
            }
            if (params.exit_condition !== undefined) {
                body['exit_condition'] = params.exit_condition
            }
            if (params.edges !== undefined) {
                body['edges'] = params.edges
            }
            if (params.actions !== undefined) {
                body['actions'] = params.actions
            }
            if (params.variables !== undefined) {
                body['variables'] = params.variables
            }
            const result = await context.api.request<Schemas.InsightsFlow>({
                method: 'POST',
                path: `/api/projects/${encodeURIComponent(String(projectId))}/hog_flows/`,
                body,
            })
            return await withInsightsUrl(context, result, `/workflows/${result.id}/workflow`)
        },
    })

const WorkflowsDiscardDraftSchema = InsightsFlowsDiscardDraftCreateParams.omit({ project_id: true })

const workflowsDiscardDraft = (): ToolBase<typeof WorkflowsDiscardDraftSchema, Schemas.InsightsFlow> =>
    withUiApp('workflow', {
        name: 'workflows-discard-draft',
        schema: WorkflowsDiscardDraftSchema,
        handler: async (context: Context, params: z.infer<typeof WorkflowsDiscardDraftSchema>) => {
            const projectId = await context.stateManager.getProjectId()
            const result = await context.api.request<Schemas.InsightsFlow>({
                method: 'POST',
                path: `/api/projects/${encodeURIComponent(String(projectId))}/hog_flows/${encodeURIComponent(String(params.id))}/discard_draft/`,
            })
            return result
        },
    })

const WorkflowsGetSchema = InsightsFlowsRetrieveParams.omit({ project_id: true })

const workflowsGet = (): ToolBase<typeof WorkflowsGetSchema, WithInsightsUrl<Schemas.InsightsFlow>> =>
    withUiApp('workflow', {
        name: 'workflows-get',
        schema: WorkflowsGetSchema,
        handler: async (context: Context, params: z.infer<typeof WorkflowsGetSchema>) => {
            const projectId = await context.stateManager.getProjectId()
            const result = await context.api.request<Schemas.InsightsFlow>({
                method: 'GET',
                path: `/api/projects/${encodeURIComponent(String(projectId))}/hog_flows/${encodeURIComponent(String(params.id))}/`,
            })
            return await withInsightsUrl(context, result, `/workflows/${result.id}/workflow`)
        },
    })

const WorkflowsGetInvocationSchema = InsightsFlowsInvocationResultRetrieveParams.omit({ project_id: true })

const workflowsGetInvocation = (): ToolBase<
    typeof WorkflowsGetInvocationSchema,
    Schemas.HogInvocationResultDetail
> => ({
    name: 'workflows-get-invocation',
    schema: WorkflowsGetInvocationSchema,
    handler: async (context: Context, params: z.infer<typeof WorkflowsGetInvocationSchema>) => {
        const projectId = await context.stateManager.getProjectId()
        const result = await context.api.request<Schemas.HogInvocationResultDetail>({
            method: 'GET',
            path: `/api/projects/${encodeURIComponent(String(projectId))}/hog_flows/${encodeURIComponent(String(params.id))}/invocation_results/${encodeURIComponent(String(params.invocation_id))}/`,
        })
        return result
    },
})

const WorkflowsGetRevisionSchema = InsightsFlowsRevisionsRetrieveParams.omit({ project_id: true })

const workflowsGetRevision = (): ToolBase<typeof WorkflowsGetRevisionSchema, Schemas.InsightsFlowRevision> => ({
    name: 'workflows-get-revision',
    schema: WorkflowsGetRevisionSchema,
    handler: async (context: Context, params: z.infer<typeof WorkflowsGetRevisionSchema>) => {
        const projectId = await context.stateManager.getProjectId()
        const result = await context.api.request<Schemas.InsightsFlowRevision>({
            method: 'GET',
            path: `/api/projects/${encodeURIComponent(String(projectId))}/hog_flows/${encodeURIComponent(String(params.id))}/revisions/${encodeURIComponent(String(params.version))}/`,
        })
        return result
    },
})

const WorkflowsGlobalStatsSchema = InsightsFlowsMetricsGlobalRetrieveQueryParams

const workflowsGlobalStats = (): ToolBase<
    typeof WorkflowsGlobalStatsSchema,
    WithInsightsUrl<Schemas.WorkflowStatsRow[]>
> => ({
    name: 'workflows-global-stats',
    schema: WorkflowsGlobalStatsSchema,
    handler: async (context: Context, params: z.infer<typeof WorkflowsGlobalStatsSchema>) => {
        const projectId = await context.stateManager.getProjectId()
        const result = await context.api.request<Schemas.WorkflowStatsRow[]>({
            method: 'GET',
            path: `/api/projects/${encodeURIComponent(String(projectId))}/hog_flows/metrics/global/`,
            query: {
                after: params.after,
                before: params.before,
            },
        })
        return await withInsightsUrl(context, result, '/workflows')
    },
})

const WorkflowsListSchema = InsightsFlowsListQueryParams

const workflowsList = (): ToolBase<typeof WorkflowsListSchema, WithInsightsUrl<Schemas.PaginatedInsightsFlowMinimalList>> =>
    withUiApp('workflow-list', {
        name: 'workflows-list',
        schema: WorkflowsListSchema,
        handler: async (context: Context, params: z.infer<typeof WorkflowsListSchema>) => {
            const projectId = await context.stateManager.getProjectId()
            const result = await context.api.request<Schemas.PaginatedInsightsFlowMinimalList>({
                method: 'GET',
                path: `/api/projects/${encodeURIComponent(String(projectId))}/hog_flows/`,
                query: {
                    created_at: params.created_at,
                    created_by: params.created_by,
                    id: params.id,
                    limit: params.limit,
                    offset: params.offset,
                    search: params.search,
                    status: params.status,
                    updated_at: params.updated_at,
                },
            })
            return await withInsightsUrl(context, result, '/workflows')
        },
    })

const WorkflowsListBatchJobsSchema = InsightsFlowsBatchJobsListParams.omit({ project_id: true })

const workflowsListBatchJobs = (): ToolBase<
    typeof WorkflowsListBatchJobsSchema,
    WithInsightsUrl<Schemas.InsightsFlowBatchJob[]>
> => ({
    name: 'workflows-list-batch-jobs',
    schema: WorkflowsListBatchJobsSchema,
    handler: async (context: Context, params: z.infer<typeof WorkflowsListBatchJobsSchema>) => {
        const projectId = await context.stateManager.getProjectId()
        const result = await context.api.request<Schemas.InsightsFlowBatchJob[]>({
            method: 'GET',
            path: `/api/projects/${encodeURIComponent(String(projectId))}/hog_flows/${encodeURIComponent(String(params.id))}/batch_jobs/`,
        })
        return await withInsightsUrl(context, result, '/workflows')
    },
})

const WorkflowsListInvocationsSchema = InsightsFlowsInvocationResultsRetrieveParams.omit({ project_id: true }).extend(
    InsightsFlowsInvocationResultsRetrieveQueryParams.shape
)

const workflowsListInvocations = (): ToolBase<
    typeof WorkflowsListInvocationsSchema,
    WithInsightsUrl<Schemas.HogInvocationResult[]>
> => ({
    name: 'workflows-list-invocations',
    schema: WorkflowsListInvocationsSchema,
    handler: async (context: Context, params: z.infer<typeof WorkflowsListInvocationsSchema>) => {
        const projectId = await context.stateManager.getProjectId()
        const result = await context.api.request<Schemas.HogInvocationResult[]>({
            method: 'GET',
            path: `/api/projects/${encodeURIComponent(String(projectId))}/hog_flows/${encodeURIComponent(String(params.id))}/invocation_results/`,
            query: {
                after: params.after,
                before: params.before,
                distinct_id: params.distinct_id,
                limit: params.limit,
                status: params.status,
            },
        })
        return await withInsightsUrl(context, result, '/workflows')
    },
})

const WorkflowsListRevisionsSchema = InsightsFlowsRevisionsListParams.omit({ project_id: true }).extend(
    InsightsFlowsRevisionsListQueryParams.shape
)

const workflowsListRevisions = (): ToolBase<
    typeof WorkflowsListRevisionsSchema,
    WithInsightsUrl<Schemas.PaginatedInsightsFlowRevisionBasicList>
> => ({
    name: 'workflows-list-revisions',
    schema: WorkflowsListRevisionsSchema,
    handler: async (context: Context, params: z.infer<typeof WorkflowsListRevisionsSchema>) => {
        const projectId = await context.stateManager.getProjectId()
        const result = await context.api.request<Schemas.PaginatedInsightsFlowRevisionBasicList>({
            method: 'GET',
            path: `/api/projects/${encodeURIComponent(String(projectId))}/hog_flows/${encodeURIComponent(String(params.id))}/revisions/`,
            query: {
                limit: params.limit,
                offset: params.offset,
            },
        })
        return await withInsightsUrl(context, result, '/workflows')
    },
})

const WorkflowsLogsSchema = InsightsFlowsLogsRetrieveParams.omit({ project_id: true }).extend(
    InsightsFlowsLogsRetrieveQueryParams.shape
)

const workflowsLogs = (): ToolBase<typeof WorkflowsLogsSchema, unknown> => ({
    name: 'workflows-logs',
    schema: WorkflowsLogsSchema,
    handler: async (context: Context, params: z.infer<typeof WorkflowsLogsSchema>) => {
        const projectId = await context.stateManager.getProjectId()
        const result = await context.api.request<unknown>({
            method: 'GET',
            path: `/api/projects/${encodeURIComponent(String(projectId))}/hog_flows/${encodeURIComponent(String(params.id))}/logs/`,
            query: {
                after: params.after,
                before: params.before,
                instance_id: params.instance_id,
                level: params.level,
                limit: params.limit,
                search: params.search,
            },
        })
        return result
    },
})

const WorkflowsPatchGraphSchema = WorkflowGraphPatchSchema

const workflowsPatchGraph = (): ToolBase<typeof WorkflowsPatchGraphSchema, Schemas.InsightsFlow> => ({
    name: 'workflows-patch-graph',
    schema: WorkflowsPatchGraphSchema,
    handler: async (context: Context, params: z.infer<typeof WorkflowsPatchGraphSchema>) => {
        const projectId = await context.stateManager.getProjectId()
        const parsedParams = WorkflowsPatchGraphSchema.parse(params)
        const { id, ...body } = parsedParams
        const result = await context.api.request<Schemas.InsightsFlow>({
            method: 'PATCH',
            path: `/api/projects/${encodeURIComponent(String(projectId))}/hog_flows/${encodeURIComponent(String(id))}/graph/`,
            body,
        })
        return result
    },
})

const WorkflowsPublishSchema = InsightsFlowsPublishCreateParams.omit({ project_id: true }).extend(
    InsightsFlowsPublishCreateBody.shape
)

const workflowsPublish = (): ToolBase<typeof WorkflowsPublishSchema, Schemas.InsightsFlowPublishResponse> => ({
    name: 'workflows-publish',
    schema: WorkflowsPublishSchema,
    handler: async (context: Context, params: z.infer<typeof WorkflowsPublishSchema>) => {
        const projectId = await context.stateManager.getProjectId()
        const body: Record<string, unknown> = {}
        if (params.confirm !== undefined) {
            body['confirm'] = params.confirm
        }
        if (params.confirm_token !== undefined) {
            body['confirm_token'] = params.confirm_token
        }
        const result = await context.api.request<Schemas.InsightsFlowPublishResponse>({
            method: 'POST',
            path: `/api/projects/${encodeURIComponent(String(projectId))}/hog_flows/${encodeURIComponent(String(params.id))}/publish/`,
            body,
        })
        return result
    },
})

const WorkflowsRestoreRevisionSchema = InsightsFlowsRevisionsRestoreCreateParams.omit({ project_id: true }).extend(
    InsightsFlowsRevisionsRestoreCreateBody.shape
)

const workflowsRestoreRevision = (): ToolBase<typeof WorkflowsRestoreRevisionSchema, Schemas.InsightsFlow> => ({
    name: 'workflows-restore-revision',
    schema: WorkflowsRestoreRevisionSchema,
    handler: async (context: Context, params: z.infer<typeof WorkflowsRestoreRevisionSchema>) => {
        const projectId = await context.stateManager.getProjectId()
        const body: Record<string, unknown> = {}
        if (params.overwrite !== undefined) {
            body['overwrite'] = params.overwrite
        }
        const result = await context.api.request<Schemas.InsightsFlow>({
            method: 'POST',
            path: `/api/projects/${encodeURIComponent(String(projectId))}/hog_flows/${encodeURIComponent(String(params.id))}/revisions/${encodeURIComponent(String(params.version))}/restore/`,
            body,
        })
        return result
    },
})

const WorkflowsStatsSchema = InsightsFlowsMetricsRetrieveParams.omit({ project_id: true }).extend(
    InsightsFlowsMetricsRetrieveQueryParams.shape
)

const workflowsStats = (): ToolBase<typeof WorkflowsStatsSchema, Schemas.AppMetricsResponse> => ({
    name: 'workflows-stats',
    schema: WorkflowsStatsSchema,
    handler: async (context: Context, params: z.infer<typeof WorkflowsStatsSchema>) => {
        const projectId = await context.stateManager.getProjectId()
        const result = await context.api.request<Schemas.AppMetricsResponse>({
            method: 'GET',
            path: `/api/projects/${encodeURIComponent(String(projectId))}/hog_flows/${encodeURIComponent(String(params.id))}/metrics/`,
            query: {
                after: params.after,
                before: params.before,
                breakdown_by: params.breakdown_by,
                instance_id: params.instance_id,
                interval: params.interval,
                kind: params.kind,
                name: params.name,
            },
        })
        return result
    },
})

const WorkflowsTestRunSchema = InsightsFlowsInvocationsCreateParams.omit({ project_id: true }).extend(
    InsightsFlowsInvocationsCreateBody.shape
)

const workflowsTestRun = (): ToolBase<typeof WorkflowsTestRunSchema, unknown> => ({
    name: 'workflows-test-run',
    schema: WorkflowsTestRunSchema,
    handler: async (context: Context, params: z.infer<typeof WorkflowsTestRunSchema>) => {
        const projectId = await context.stateManager.getProjectId()
        const body: Record<string, unknown> = {}
        if (params.globals !== undefined) {
            body['globals'] = params.globals
        }
        if (params.mock_async_functions !== undefined) {
            body['mock_async_functions'] = params.mock_async_functions
        }
        if (params.current_action_id !== undefined) {
            body['current_action_id'] = params.current_action_id
        }
        if (params.use_draft !== undefined) {
            body['use_draft'] = params.use_draft
        }
        const result = await context.api.request<unknown>({
            method: 'POST',
            path: `/api/projects/${encodeURIComponent(String(projectId))}/hog_flows/${encodeURIComponent(String(params.id))}/invocations/`,
            body,
        })
        return result
    },
})

const WorkflowsUpdateSchema = InsightsFlowsPartialUpdateParams.omit({ project_id: true }).extend(
    InsightsFlowsPartialUpdateBody.shape
)

const workflowsUpdate = (): ToolBase<typeof WorkflowsUpdateSchema, WithInsightsUrl<Schemas.InsightsFlow>> =>
    withUiApp('workflow', {
        name: 'workflows-update',
        schema: WorkflowsUpdateSchema,
        handler: async (context: Context, params: z.infer<typeof WorkflowsUpdateSchema>) => {
            const projectId = await context.stateManager.getProjectId()
            const body: Record<string, unknown> = {}
            if (params.name !== undefined) {
                body['name'] = params.name
            }
            if (params.description !== undefined) {
                body['description'] = params.description
            }
            if (params.trigger_masking !== undefined) {
                body['trigger_masking'] = params.trigger_masking
            }
            if (params.conversion !== undefined) {
                body['conversion'] = params.conversion
            }
            if (params.exit_condition !== undefined) {
                body['exit_condition'] = params.exit_condition
            }
            if (params.variables !== undefined) {
                body['variables'] = params.variables
            }
            const result = await context.api.request<Schemas.InsightsFlow>({
                method: 'PATCH',
                path: `/api/projects/${encodeURIComponent(String(projectId))}/hog_flows/${encodeURIComponent(String(params.id))}/`,
                body,
            })
            return await withInsightsUrl(context, result, `/workflows/${result.id}/workflow`)
        },
    })

const WorkflowsUpdateScheduleSchema = InsightsFlowsSchedulesPartialUpdateParams.omit({ project_id: true }).extend(
    InsightsFlowsSchedulesPartialUpdateBody.shape
)

const workflowsUpdateSchedule = (): ToolBase<typeof WorkflowsUpdateScheduleSchema, Schemas.InsightsFlowSchedule> => ({
    name: 'workflows-update-schedule',
    schema: WorkflowsUpdateScheduleSchema,
    handler: async (context: Context, params: z.infer<typeof WorkflowsUpdateScheduleSchema>) => {
        const projectId = await context.stateManager.getProjectId()
        const body: Record<string, unknown> = {}
        if (params.rrule !== undefined) {
            body['rrule'] = params.rrule
        }
        if (params.starts_at !== undefined) {
            body['starts_at'] = params.starts_at
        }
        if (params.timezone !== undefined) {
            body['timezone'] = params.timezone
        }
        if (params.variables !== undefined) {
            body['variables'] = params.variables
        }
        const result = await context.api.request<Schemas.InsightsFlowSchedule>({
            method: 'PATCH',
            path: `/api/projects/${encodeURIComponent(String(projectId))}/hog_flows/${encodeURIComponent(String(params.id))}/schedules/${encodeURIComponent(String(params.schedule_id))}/`,
            body,
        })
        return result
    },
})

export const GENERATED_TOOLS: Record<string, () => ToolBase<ZodObjectAny>> = {
    'workflows-create': workflowsCreate,
    'workflows-discard-draft': workflowsDiscardDraft,
    'workflows-get': workflowsGet,
    'workflows-get-invocation': workflowsGetInvocation,
    'workflows-get-revision': workflowsGetRevision,
    'workflows-global-stats': workflowsGlobalStats,
    'workflows-list': workflowsList,
    'workflows-list-batch-jobs': workflowsListBatchJobs,
    'workflows-list-invocations': workflowsListInvocations,
    'workflows-list-revisions': workflowsListRevisions,
    'workflows-logs': workflowsLogs,
    'workflows-patch-graph': workflowsPatchGraph,
    'workflows-publish': workflowsPublish,
    'workflows-restore-revision': workflowsRestoreRevision,
    'workflows-stats': workflowsStats,
    'workflows-test-run': workflowsTestRun,
    'workflows-update': workflowsUpdate,
    'workflows-update-schedule': workflowsUpdateSchedule,
}
