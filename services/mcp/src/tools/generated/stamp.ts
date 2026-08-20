// AUTO-GENERATED from products/stamp/mcp/tools.yaml + OpenAPI — do not edit
import { z } from 'zod'

import type { Schemas } from '@/api/generated'
import {
    StampDigestChannelsCreateBody,
    StampDigestChannelsDestroyParams,
    StampDigestChannelsListQueryParams,
    StampDigestRunsListQueryParams,
    StampPullRequestsListQueryParams,
    StampPullRequestsRetrieveParams,
    StampRepoConfigsDestroyParams,
    StampRepoConfigsListQueryParams,
    StampRepoConfigsRetrieveParams,
    StampReviewRunsListQueryParams,
    StampReviewRunsRetrieveParams,
} from '@/generated/stamp/api'
import { withInsightsUrl, omitResponseFields, type WithInsightsUrl } from '@/tools/tool-utils'
import type { Context, ToolBase, ZodObjectAny } from '@/tools/types'

const StampDigestChannelsCreateSchema = StampDigestChannelsCreateBody

const stampDigestChannelsCreate = (): ToolBase<
    typeof StampDigestChannelsCreateSchema,
    Schemas.DigestChannel
> => ({
    name: 'stamp-digest-channels-create',
    schema: StampDigestChannelsCreateSchema,
    handler: async (context: Context, params: z.infer<typeof StampDigestChannelsCreateSchema>) => {
        const projectId = await context.stateManager.getProjectId()
        const body: Record<string, unknown> = {}
        if (params.audience_key !== undefined) {
            body['audience_key'] = params.audience_key
        }
        if (params.slack_integration_id !== undefined) {
            body['slack_integration_id'] = params.slack_integration_id
        }
        if (params.slack_channel_id !== undefined) {
            body['slack_channel_id'] = params.slack_channel_id
        }
        if (params.slack_channel_name !== undefined) {
            body['slack_channel_name'] = params.slack_channel_name
        }
        if (params.enabled !== undefined) {
            body['enabled'] = params.enabled
        }
        const result = await context.api.request<Schemas.DigestChannel>({
            method: 'POST',
            path: `/api/projects/${encodeURIComponent(String(projectId))}/stamp/digest_channels/`,
            body,
        })
        return result
    },
})

const StampDigestChannelsDeleteSchema = StampDigestChannelsDestroyParams.omit({ project_id: true })

const stampDigestChannelsDelete = (): ToolBase<typeof StampDigestChannelsDeleteSchema, unknown> => ({
    name: 'stamp-digest-channels-delete',
    schema: StampDigestChannelsDeleteSchema,
    handler: async (context: Context, params: z.infer<typeof StampDigestChannelsDeleteSchema>) => {
        const projectId = await context.stateManager.getProjectId()
        const result = await context.api.request<unknown>({
            method: 'DELETE',
            path: `/api/projects/${encodeURIComponent(String(projectId))}/stamp/digest_channels/${encodeURIComponent(String(params.id))}/`,
        })
        return result
    },
})

const StampDigestChannelsListSchema = StampDigestChannelsListQueryParams

const stampDigestChannelsList = (): ToolBase<
    typeof StampDigestChannelsListSchema,
    WithInsightsUrl<Schemas.PaginatedDigestChannelList>
> => ({
    name: 'stamp-digest-channels-list',
    schema: StampDigestChannelsListSchema,
    handler: async (context: Context, params: z.infer<typeof StampDigestChannelsListSchema>) => {
        const projectId = await context.stateManager.getProjectId()
        const result = await context.api.request<Schemas.PaginatedDigestChannelList>({
            method: 'GET',
            path: `/api/projects/${encodeURIComponent(String(projectId))}/stamp/digest_channels/`,
            query: {
                limit: params.limit,
                offset: params.offset,
            },
        })
        return await withInsightsUrl(context, result, '/stamp')
    },
})

const StampDigestRunsListSchema = StampDigestRunsListQueryParams

const stampDigestRunsList = (): ToolBase<
    typeof StampDigestRunsListSchema,
    WithInsightsUrl<Schemas.PaginatedDigestRunList>
> => ({
    name: 'stamp-digest-runs-list',
    schema: StampDigestRunsListSchema,
    handler: async (context: Context, params: z.infer<typeof StampDigestRunsListSchema>) => {
        const projectId = await context.stateManager.getProjectId()
        const result = await context.api.request<Schemas.PaginatedDigestRunList>({
            method: 'GET',
            path: `/api/projects/${encodeURIComponent(String(projectId))}/stamp/digest_runs/`,
            query: {
                digest_channel: params.digest_channel,
                limit: params.limit,
                offset: params.offset,
            },
        })
        return await withInsightsUrl(context, result, '/stamp')
    },
})

const StampPullRequestsGetSchema = StampPullRequestsRetrieveParams.omit({ project_id: true })

const stampPullRequestsGet = (): ToolBase<typeof StampPullRequestsGetSchema, Schemas.StampPullRequest> => ({
    name: 'stamp-pull-requests-get',
    schema: StampPullRequestsGetSchema,
    handler: async (context: Context, params: z.infer<typeof StampPullRequestsGetSchema>) => {
        const projectId = await context.stateManager.getProjectId()
        const result = await context.api.request<Schemas.StampPullRequest>({
            method: 'GET',
            path: `/api/projects/${encodeURIComponent(String(projectId))}/stamp/pull_requests/${encodeURIComponent(String(params.id))}/`,
        })
        return result
    },
})

const StampPullRequestsListSchema = StampPullRequestsListQueryParams

const stampPullRequestsList = (): ToolBase<
    typeof StampPullRequestsListSchema,
    WithInsightsUrl<Schemas.PaginatedStampPullRequestList>
> => ({
    name: 'stamp-pull-requests-list',
    schema: StampPullRequestsListSchema,
    handler: async (context: Context, params: z.infer<typeof StampPullRequestsListSchema>) => {
        const projectId = await context.stateManager.getProjectId()
        const result = await context.api.request<Schemas.PaginatedStampPullRequestList>({
            method: 'GET',
            path: `/api/projects/${encodeURIComponent(String(projectId))}/stamp/pull_requests/`,
            query: {
                limit: params.limit,
                merged: params.merged,
                offset: params.offset,
                pr_number: params.pr_number,
            },
        })
        return await withInsightsUrl(context, result, '/stamp')
    },
})

const StampRepoConfigsDeleteSchema = StampRepoConfigsDestroyParams.omit({ project_id: true })

const stampRepoConfigsDelete = (): ToolBase<typeof StampRepoConfigsDeleteSchema, unknown> => ({
    name: 'stamp-repo-configs-delete',
    schema: StampRepoConfigsDeleteSchema,
    handler: async (context: Context, params: z.infer<typeof StampRepoConfigsDeleteSchema>) => {
        const projectId = await context.stateManager.getProjectId()
        const result = await context.api.request<unknown>({
            method: 'DELETE',
            path: `/api/projects/${encodeURIComponent(String(projectId))}/stamp/repo_configs/${encodeURIComponent(String(params.id))}/`,
        })
        return result
    },
})

const StampRepoConfigsGetSchema = StampRepoConfigsRetrieveParams.omit({ project_id: true })

const stampRepoConfigsGet = (): ToolBase<typeof StampRepoConfigsGetSchema, Schemas.StampRepoConfig> => ({
    name: 'stamp-repo-configs-get',
    schema: StampRepoConfigsGetSchema,
    handler: async (context: Context, params: z.infer<typeof StampRepoConfigsGetSchema>) => {
        const projectId = await context.stateManager.getProjectId()
        const result = await context.api.request<Schemas.StampRepoConfig>({
            method: 'GET',
            path: `/api/projects/${encodeURIComponent(String(projectId))}/stamp/repo_configs/${encodeURIComponent(String(params.id))}/`,
        })
        return result
    },
})

const StampRepoConfigsListSchema = StampRepoConfigsListQueryParams

const stampRepoConfigsList = (): ToolBase<
    typeof StampRepoConfigsListSchema,
    WithInsightsUrl<Schemas.PaginatedStampRepoConfigList>
> => ({
    name: 'stamp-repo-configs-list',
    schema: StampRepoConfigsListSchema,
    handler: async (context: Context, params: z.infer<typeof StampRepoConfigsListSchema>) => {
        const projectId = await context.stateManager.getProjectId()
        const result = await context.api.request<Schemas.PaginatedStampRepoConfigList>({
            method: 'GET',
            path: `/api/projects/${encodeURIComponent(String(projectId))}/stamp/repo_configs/`,
            query: {
                limit: params.limit,
                offset: params.offset,
            },
        })
        return await withInsightsUrl(context, result, '/stamp')
    },
})

const StampReviewRunsGetSchema = StampReviewRunsRetrieveParams.omit({ project_id: true })

const stampReviewRunsGet = (): ToolBase<typeof StampReviewRunsGetSchema, Schemas.ReviewRun> => ({
    name: 'stamp-review-runs-get',
    schema: StampReviewRunsGetSchema,
    handler: async (context: Context, params: z.infer<typeof StampReviewRunsGetSchema>) => {
        const projectId = await context.stateManager.getProjectId()
        const result = await context.api.request<Schemas.ReviewRun>({
            method: 'GET',
            path: `/api/projects/${encodeURIComponent(String(projectId))}/stamp/review_runs/${encodeURIComponent(String(params.id))}/`,
        })
        return result
    },
})

const StampReviewRunsListSchema = StampReviewRunsListQueryParams

const stampReviewRunsList = (): ToolBase<
    typeof StampReviewRunsListSchema,
    WithInsightsUrl<Schemas.PaginatedReviewRunList>
> => ({
    name: 'stamp-review-runs-list',
    schema: StampReviewRunsListSchema,
    handler: async (context: Context, params: z.infer<typeof StampReviewRunsListSchema>) => {
        const projectId = await context.stateManager.getProjectId()
        const result = await context.api.request<Schemas.PaginatedReviewRunList>({
            method: 'GET',
            path: `/api/projects/${encodeURIComponent(String(projectId))}/stamp/review_runs/`,
            query: {
                limit: params.limit,
                offset: params.offset,
                pr_number: params.pr_number,
                repository: params.repository,
                status: params.status,
            },
        })
        const filtered = {
            ...result,
            results: (result.results ?? []).map((item: any) => omitResponseFields(item, ['output'])),
        } as typeof result
        return await withInsightsUrl(context, filtered, '/stamp')
    },
})

export const GENERATED_TOOLS: Record<string, () => ToolBase<ZodObjectAny>> = {
    'stamp-digest-channels-create': stampDigestChannelsCreate,
    'stamp-digest-channels-delete': stampDigestChannelsDelete,
    'stamp-digest-channels-list': stampDigestChannelsList,
    'stamp-digest-runs-list': stampDigestRunsList,
    'stamp-pull-requests-get': stampPullRequestsGet,
    'stamp-pull-requests-list': stampPullRequestsList,
    'stamp-repo-configs-delete': stampRepoConfigsDelete,
    'stamp-repo-configs-get': stampRepoConfigsGet,
    'stamp-repo-configs-list': stampRepoConfigsList,
    'stamp-review-runs-get': stampReviewRunsGet,
    'stamp-review-runs-list': stampReviewRunsList,
}
