// AUTO-GENERATED from products/review/mcp/tools.yaml + OpenAPI — do not edit
import { z } from 'zod'

import type { Schemas } from '@/api/generated'
import {
    ReviewReviewsListQueryParams,
    ReviewReviewsRetrieveParams,
    ReviewReviewsTriggerCreateBody,
} from '@/generated/review/api'
import { withInsightsUrl, type WithInsightsUrl } from '@/tools/tool-utils'
import type { Context, ToolBase, ZodObjectAny } from '@/tools/types'

const ReviewReviewsGetSchema = ReviewReviewsRetrieveParams.omit({ project_id: true })

const reviewReviewsGet = (): ToolBase<typeof ReviewReviewsGetSchema, Schemas.ReviewDetail> => ({
    name: 'review-script-reviews-get',
    schema: ReviewReviewsGetSchema,
    handler: async (context: Context, params: z.infer<typeof ReviewReviewsGetSchema>) => {
        const projectId = await context.stateManager.getProjectId()
        const result = await context.api.request<Schemas.ReviewDetail>({
            method: 'GET',
            path: `/api/projects/${encodeURIComponent(String(projectId))}/review/reviews/${encodeURIComponent(String(params.id))}/`,
        })
        return result
    },
})

const ReviewReviewsListSchema = ReviewReviewsListQueryParams

const reviewReviewsList = (): ToolBase<
    typeof ReviewReviewsListSchema,
    WithInsightsUrl<Schemas.ReviewRecentReviewsPage>
> => ({
    name: 'review-script-reviews-list',
    schema: ReviewReviewsListSchema,
    handler: async (context: Context, params: z.infer<typeof ReviewReviewsListSchema>) => {
        const projectId = await context.stateManager.getProjectId()
        const result = await context.api.request<Schemas.ReviewRecentReviewsPage>({
            method: 'GET',
            path: `/api/projects/${encodeURIComponent(String(projectId))}/review/reviews/`,
            query: {
                limit: params.limit,
                scope: params.scope,
            },
        })
        return await withInsightsUrl(context, result, '/code-review')
    },
})

const ReviewReviewsTriggerSchema = ReviewReviewsTriggerCreateBody

const reviewReviewsTrigger = (): ToolBase<typeof ReviewReviewsTriggerSchema, Schemas.ReviewTriggerResponse> => ({
    name: 'review-script-reviews-trigger',
    schema: ReviewReviewsTriggerSchema,
    handler: async (context: Context, params: z.infer<typeof ReviewReviewsTriggerSchema>) => {
        const projectId = await context.stateManager.getProjectId()
        const body: Record<string, unknown> = {}
        if (params.pr_url !== undefined) {
            body['pr_url'] = params.pr_url
        }
        const result = await context.api.request<Schemas.ReviewTriggerResponse>({
            method: 'POST',
            path: `/api/projects/${encodeURIComponent(String(projectId))}/review/reviews/trigger/`,
            body,
        })
        return result
    },
})

export const GENERATED_TOOLS: Record<string, () => ToolBase<ZodObjectAny>> = {
    'review-script-reviews-get': reviewReviewsGet,
    'review-script-reviews-list': reviewReviewsList,
    'review-script-reviews-trigger': reviewReviewsTrigger,
}
