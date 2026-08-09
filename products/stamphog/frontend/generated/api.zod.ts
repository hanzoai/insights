/**
 * Auto-generated Zod validation schemas from the Django backend OpenAPI schema.
 * To modify these schemas, update the Django serializers or views, then run:
 *   insightscli build:openapi
 * Questions or issues? #team-devex on Slack
 *
 * Insights API - generated
 * OpenAPI spec version: 1.0.0
 */
import * as zod from 'zod'

/**
 * Per-audience Slack destinations for the daily merged-PR digest.
 */
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
export const stampDigestChannelsUpdateBodyAudienceKeyMax = 255

export const stampDigestChannelsUpdateBodySlackIntegrationIdMin = -2147483648
export const stampDigestChannelsUpdateBodySlackIntegrationIdMax = 2147483647

export const stampDigestChannelsUpdateBodySlackChannelIdMax = 64

export const stampDigestChannelsUpdateBodySlackChannelNameMax = 255

export const StampDigestChannelsUpdateBody = /* @__PURE__ */ zod.object({
    audience_key: zod
        .string()
        .max(stampDigestChannelsUpdateBodyAudienceKeyMax)
        .describe(
            "Opaque digest bucket this channel receives, e.g. 'repo:Insights\/insights'. Immutable after creation — it anchors the audience and its opt-out tombstone."
        ),
    slack_integration_id: zod
        .number()
        .min(stampDigestChannelsUpdateBodySlackIntegrationIdMin)
        .max(stampDigestChannelsUpdateBodySlackIntegrationIdMax)
        .describe("ID of the team's Slack integration used to post the digest."),
    slack_channel_id: zod
        .string()
        .max(stampDigestChannelsUpdateBodySlackChannelIdMax)
        .describe("Slack channel ID to post the digest to, e.g. 'C012AB3CD'."),
    slack_channel_name: zod
        .string()
        .max(stampDigestChannelsUpdateBodySlackChannelNameMax)
        .optional()
        .describe('Human-readable Slack channel name, for display only.'),
    enabled: zod.boolean().optional().describe('Whether this channel is included in the daily digest fan-out.'),
})

/**
 * Per-audience Slack destinations for the daily merged-PR digest.
 */
export const stampDigestChannelsPartialUpdateBodyAudienceKeyMax = 255

export const stampDigestChannelsPartialUpdateBodySlackIntegrationIdMin = -2147483648
export const stampDigestChannelsPartialUpdateBodySlackIntegrationIdMax = 2147483647

export const stampDigestChannelsPartialUpdateBodySlackChannelIdMax = 64

export const stampDigestChannelsPartialUpdateBodySlackChannelNameMax = 255

export const StampDigestChannelsPartialUpdateBody = /* @__PURE__ */ zod.object({
    audience_key: zod
        .string()
        .max(stampDigestChannelsPartialUpdateBodyAudienceKeyMax)
        .optional()
        .describe(
            "Opaque digest bucket this channel receives, e.g. 'repo:Insights\/insights'. Immutable after creation — it anchors the audience and its opt-out tombstone."
        ),
    slack_integration_id: zod
        .number()
        .min(stampDigestChannelsPartialUpdateBodySlackIntegrationIdMin)
        .max(stampDigestChannelsPartialUpdateBodySlackIntegrationIdMax)
        .optional()
        .describe("ID of the team's Slack integration used to post the digest."),
    slack_channel_id: zod
        .string()
        .max(stampDigestChannelsPartialUpdateBodySlackChannelIdMax)
        .optional()
        .describe("Slack channel ID to post the digest to, e.g. 'C012AB3CD'."),
    slack_channel_name: zod
        .string()
        .max(stampDigestChannelsPartialUpdateBodySlackChannelNameMax)
        .optional()
        .describe('Human-readable Slack channel name, for display only.'),
    enabled: zod.boolean().optional().describe('Whether this channel is included in the daily digest fan-out.'),
})

/**
 * Per-repo stamp settings — enable/disable review, GitHub App installation, policy overrides.
 */
export const stampRepoConfigsCreateBodyProviderDefault = `github`
export const stampRepoConfigsCreateBodyProviderMax = 32

export const stampRepoConfigsCreateBodyRepositoryMax = 255

export const stampRepoConfigsCreateBodyTriggerLabelMax = 100

export const StampRepoConfigsCreateBody = /* @__PURE__ */ zod.object({
    provider: zod
        .string()
        .max(stampRepoConfigsCreateBodyProviderMax)
        .default(stampRepoConfigsCreateBodyProviderDefault)
        .describe("SCM provider this config talks to. Defaults to 'github'."),
    repository: zod
        .string()
        .max(stampRepoConfigsCreateBodyRepositoryMax)
        .describe("Repository full name, e.g. 'Insights\/insights'."),
    enabled: zod.boolean().optional().describe('Whether stamp actively reviews pull requests for this repo.'),
    digest_enabled: zod
        .boolean()
        .optional()
        .describe('Whether merged PRs on this repo are captured for the daily Slack digest.'),
    review_mode: zod
        .enum(['all', 'label'])
        .describe('\* `all` - all\n\* `label` - label')
        .optional()
        .describe(
            "When reviews run: 'all' reviews every pull request (the default); 'label' reviews only pull requests carrying the trigger label, mirroring the Action's opt-in flow.\n\n\* `all` - all\n\* `label` - label"
        ),
    trigger_label: zod
        .string()
        .max(stampRepoConfigsCreateBodyTriggerLabelMax)
        .optional()
        .describe("Pull request label that triggers a review when review_mode is 'label'. Defaults to 'stamp'."),
})

/**
 * Per-repo stamp settings — enable/disable review, GitHub App installation, policy overrides.
 */
export const stampRepoConfigsUpdateBodyProviderDefault = `github`
export const stampRepoConfigsUpdateBodyProviderMax = 32

export const stampRepoConfigsUpdateBodyRepositoryMax = 255

export const stampRepoConfigsUpdateBodyTriggerLabelMax = 100

export const StampRepoConfigsUpdateBody = /* @__PURE__ */ zod.object({
    provider: zod
        .string()
        .max(stampRepoConfigsUpdateBodyProviderMax)
        .default(stampRepoConfigsUpdateBodyProviderDefault)
        .describe("SCM provider this config talks to. Defaults to 'github'."),
    repository: zod
        .string()
        .max(stampRepoConfigsUpdateBodyRepositoryMax)
        .describe("Repository full name, e.g. 'Insights\/insights'."),
    enabled: zod.boolean().optional().describe('Whether stamp actively reviews pull requests for this repo.'),
    digest_enabled: zod
        .boolean()
        .optional()
        .describe('Whether merged PRs on this repo are captured for the daily Slack digest.'),
    review_mode: zod
        .enum(['all', 'label'])
        .describe('\* `all` - all\n\* `label` - label')
        .optional()
        .describe(
            "When reviews run: 'all' reviews every pull request (the default); 'label' reviews only pull requests carrying the trigger label, mirroring the Action's opt-in flow.\n\n\* `all` - all\n\* `label` - label"
        ),
    trigger_label: zod
        .string()
        .max(stampRepoConfigsUpdateBodyTriggerLabelMax)
        .optional()
        .describe("Pull request label that triggers a review when review_mode is 'label'. Defaults to 'stamp'."),
})

/**
 * Per-repo stamp settings — enable/disable review, GitHub App installation, policy overrides.
 */
export const stampRepoConfigsPartialUpdateBodyProviderDefault = `github`
export const stampRepoConfigsPartialUpdateBodyProviderMax = 32

export const stampRepoConfigsPartialUpdateBodyRepositoryMax = 255

export const stampRepoConfigsPartialUpdateBodyTriggerLabelMax = 100

export const StampRepoConfigsPartialUpdateBody = /* @__PURE__ */ zod.object({
    provider: zod
        .string()
        .max(stampRepoConfigsPartialUpdateBodyProviderMax)
        .default(stampRepoConfigsPartialUpdateBodyProviderDefault)
        .describe("SCM provider this config talks to. Defaults to 'github'."),
    repository: zod
        .string()
        .max(stampRepoConfigsPartialUpdateBodyRepositoryMax)
        .optional()
        .describe("Repository full name, e.g. 'Insights\/insights'."),
    enabled: zod.boolean().optional().describe('Whether stamp actively reviews pull requests for this repo.'),
    digest_enabled: zod
        .boolean()
        .optional()
        .describe('Whether merged PRs on this repo are captured for the daily Slack digest.'),
    review_mode: zod
        .enum(['all', 'label'])
        .describe('\* `all` - all\n\* `label` - label')
        .optional()
        .describe(
            "When reviews run: 'all' reviews every pull request (the default); 'label' reviews only pull requests carrying the trigger label, mirroring the Action's opt-in flow.\n\n\* `all` - all\n\* `label` - label"
        ),
    trigger_label: zod
        .string()
        .max(stampRepoConfigsPartialUpdateBodyTriggerLabelMax)
        .optional()
        .describe("Pull request label that triggers a review when review_mode is 'label'. Defaults to 'stamp'."),
})

/**
 * Per-repo stamp settings — enable/disable review, GitHub App installation, policy overrides.
 */
export const stampRepoConfigsSyncInstallationCreateBodyInstallationIdDefault = ``

export const StampRepoConfigsSyncInstallationCreateBody = /* @__PURE__ */ zod
    .object({
        installation_id: zod
            .string()
            .default(stampRepoConfigsSyncInstallationCreateBodyInstallationIdDefault)
            .describe(
                "GitHub App installation ID from the fresh-install Setup URL redirect. Optional: absent or blank means discover the caller's installations from the OAuth code instead (authorize-first flow). The id is not trusted on its own — ownership is always proven via the code."
            ),
        code: zod
            .string()
            .describe(
                "GitHub user-to-server OAuth code from the post-install redirect (present when the App has 'Request user authorization during installation' enabled). Exchanged server-side to prove the caller owns the installation before its repos are bound."
            ),
        state: zod
            .string()
            .describe(
                "Signed state token minted by install_info and round-tripped through GitHub's install redirect. Binds the callback to the team and user that started the flow, so a stolen installation_id + code can't be replayed against another team's session."
            ),
    })
    .describe(
        "Request body for binding a GitHub App installation to the current team.\n\nAlways requires the user-to-server OAuth ``code`` (the ownership proof) and the ``state`` token.\n``installation_id`` is optional: when present (the fresh-install redirect) exactly that installation\nis verified and synced; when absent or blank (the authorize-first redirect) the caller's accessible\ninstallations are discovered server-side from the code, so the client never has to supply a\nforgeable id."
    )
