/**
 * Auto-generated from the Django backend OpenAPI schema.
 * MCP service uses these Zod schemas for generated tool handlers.
 * To regenerate: insightscli build:openapi
 *
 * Insights API - MCP 11 enabled ops
 * OpenAPI spec version: 1.0.0
 */
import * as zod from 'zod'

/**
 * Per-audience Slack destinations for the daily merged-PR digest.
 */
export const StampDigestChannelsListParams = /* @__PURE__ */ zod.object({
    project_id: zod
        .string()
        .describe(
            "Project ID of the project you're trying to access. To find the ID of the project, make a call to \/api\/projects\/."
        ),
})

export const StampDigestChannelsListQueryParams = /* @__PURE__ */ zod.object({
    limit: zod.number().optional().describe('Number of results to return per page.'),
    offset: zod.number().optional().describe('The initial index from which to return the results.'),
})

/**
 * Per-audience Slack destinations for the daily merged-PR digest.
 */
export const StampDigestChannelsCreateParams = /* @__PURE__ */ zod.object({
    project_id: zod
        .string()
        .describe(
            "Project ID of the project you're trying to access. To find the ID of the project, make a call to \/api\/projects\/."
        ),
})

export const stampDigestChannelsCreateBodyAudienceKeyMax = 255

export const stampDigestChannelsCreateBodySlackIntegrationIdMin = -2147483648
export const stampDigestChannelsCreateBodySlackIntegrationIdMax = 2147483647

export const stampDigestChannelsCreateBodySlackChannelIdMax = 64

export const stampDigestChannelsCreateBodySlackChannelNameMax = 255

export const StampDigestChannelsCreateBody = /* @__PURE__ */ zod.object({
    audience_key: zod
        .string()
        .max(stampDigestChannelsCreateBodyAudienceKeyMax)
        .describe(
            "Opaque digest bucket this channel receives, e.g. 'repo:Insights\/insights'. Immutable after creation — it anchors the audience and its opt-out tombstone."
        ),
    slack_integration_id: zod
        .number()
        .min(stampDigestChannelsCreateBodySlackIntegrationIdMin)
        .max(stampDigestChannelsCreateBodySlackIntegrationIdMax)
        .describe("ID of the team's Slack integration used to post the digest."),
    slack_channel_id: zod
        .string()
        .max(stampDigestChannelsCreateBodySlackChannelIdMax)
        .describe("Slack channel ID to post the digest to, e.g. 'C012AB3CD'."),
    slack_channel_name: zod
        .string()
        .max(stampDigestChannelsCreateBodySlackChannelNameMax)
        .optional()
        .describe('Human-readable Slack channel name, for display only.'),
    enabled: zod.boolean().optional().describe('Whether this channel is included in the daily digest fan-out.'),
})

/**
 * Per-audience Slack destinations for the daily merged-PR digest.
 */
export const StampDigestChannelsDestroyParams = /* @__PURE__ */ zod.object({
    id: zod.string().describe('A UUID string identifying this digest channel.'),
    project_id: zod
        .string()
        .describe(
            "Project ID of the project you're trying to access. To find the ID of the project, make a call to \/api\/projects\/."
        ),
})

/**
 * Read-only history of posted (or attempted) digests, filterable by digest channel.
 */
export const StampDigestRunsListParams = /* @__PURE__ */ zod.object({
    project_id: zod
        .string()
        .describe(
            "Project ID of the project you're trying to access. To find the ID of the project, make a call to \/api\/projects\/."
        ),
})

export const StampDigestRunsListQueryParams = /* @__PURE__ */ zod.object({
    digest_channel: zod.string().optional().describe('Filter by digest channel ID.'),
    limit: zod.number().optional().describe('Number of results to return per page.'),
    offset: zod.number().optional().describe('The initial index from which to return the results.'),
})

/**
 * Read-only pull requests stamp knows about, filterable by PR number and merge state.
 */
export const StampPullRequestsListParams = /* @__PURE__ */ zod.object({
    project_id: zod
        .string()
        .describe(
            "Project ID of the project you're trying to access. To find the ID of the project, make a call to \/api\/projects\/."
        ),
})

export const StampPullRequestsListQueryParams = /* @__PURE__ */ zod.object({
    limit: zod.number().optional().describe('Number of results to return per page.'),
    merged: zod
        .boolean()
        .optional()
        .describe('Filter by merge state: true for merged pull requests, false for unmerged.'),
    offset: zod.number().optional().describe('The initial index from which to return the results.'),
    pr_number: zod.number().optional().describe('Filter by pull request number.'),
})

/**
 * Read-only pull requests stamp knows about, filterable by PR number and merge state.
 */
export const StampPullRequestsRetrieveParams = /* @__PURE__ */ zod.object({
    id: zod.string().describe('A UUID string identifying this pull request.'),
    project_id: zod
        .string()
        .describe(
            "Project ID of the project you're trying to access. To find the ID of the project, make a call to \/api\/projects\/."
        ),
})

/**
 * Per-repo stamp settings — enable/disable review, GitHub App installation, policy overrides.
 */
export const StampRepoConfigsListParams = /* @__PURE__ */ zod.object({
    project_id: zod
        .string()
        .describe(
            "Project ID of the project you're trying to access. To find the ID of the project, make a call to \/api\/projects\/."
        ),
})

export const StampRepoConfigsListQueryParams = /* @__PURE__ */ zod.object({
    limit: zod.number().optional().describe('Number of results to return per page.'),
    offset: zod.number().optional().describe('The initial index from which to return the results.'),
})

/**
 * Per-repo stamp settings — enable/disable review, GitHub App installation, policy overrides.
 */
export const StampRepoConfigsRetrieveParams = /* @__PURE__ */ zod.object({
    id: zod.string().describe('A UUID string identifying this stamp repo config.'),
    project_id: zod
        .string()
        .describe(
            "Project ID of the project you're trying to access. To find the ID of the project, make a call to \/api\/projects\/."
        ),
})

/**
 * Per-repo stamp settings — enable/disable review, GitHub App installation, policy overrides.
 */
export const StampRepoConfigsDestroyParams = /* @__PURE__ */ zod.object({
    id: zod.string().describe('A UUID string identifying this stamp repo config.'),
    project_id: zod
        .string()
        .describe(
            "Project ID of the project you're trying to access. To find the ID of the project, make a call to \/api\/projects\/."
        ),
})

/**
 * Read-only history of stamp review runs, filterable by repository, PR number, and status.
 */
export const StampReviewRunsListParams = /* @__PURE__ */ zod.object({
    project_id: zod
        .string()
        .describe(
            "Project ID of the project you're trying to access. To find the ID of the project, make a call to \/api\/projects\/."
        ),
})

export const StampReviewRunsListQueryParams = /* @__PURE__ */ zod.object({
    limit: zod.number().optional().describe('Number of results to return per page.'),
    offset: zod.number().optional().describe('The initial index from which to return the results.'),
    pr_number: zod.number().optional().describe('Filter by pull request number.'),
    repository: zod.string().optional().describe("Filter by repository full name, e.g. 'Insights\/insights'."),
    status: zod.string().optional().describe('Filter by review run status.'),
})

/**
 * Read-only history of stamp review runs, filterable by repository, PR number, and status.
 */
export const StampReviewRunsRetrieveParams = /* @__PURE__ */ zod.object({
    id: zod.string().describe('A UUID string identifying this review run.'),
    project_id: zod
        .string()
        .describe(
            "Project ID of the project you're trying to access. To find the ID of the project, make a call to \/api\/projects\/."
        ),
})
