import {
    MOCK_DATA_COLOR_THEMES,
    MOCK_DEFAULT_COHORT,
    MOCK_DEFAULT_ORGANIZATION,
    MOCK_DEFAULT_ORGANIZATION_INVITE,
    MOCK_DEFAULT_ORGANIZATION_MEMBER,
    MOCK_DEFAULT_PLUGIN,
    MOCK_DEFAULT_PLUGIN_CONFIG,
    MOCK_DEFAULT_TEAM,
    MOCK_DEFAULT_USER,
    MOCK_PERSON_PROPERTIES,
    MOCK_SECOND_ORGANIZATION_MEMBER,
} from 'lib/api.mock'

import { ResponseComposition, RestContext, RestRequest } from 'msw'

import sdkVersions from '~/mocks/fixtures/api/sdk_versions.json'
import teamSdkVersions from '~/mocks/fixtures/api/team_sdk_versions.json'
import { SharingConfigurationType } from '~/types'

import { getAvailableProductFeatures } from './features'
import { billingJson } from './fixtures/_billing'
import _insightsFunctionTemplatesDestinations from './fixtures/_insightsFunctionTemplatesDestinations.json'
import _insightsFunctionTemplatesTransformations from './fixtures/_insightsFunctionTemplatesTransformations.json'
import { MockSignature, Mocks, mocksToHandlers } from './utils'

export const EMPTY_PAGINATED_RESPONSE = { count: 0, results: [] as any[], next: null, previous: null }
export const toPaginatedResponse = (results: any[]): typeof EMPTY_PAGINATED_RESPONSE => ({
    count: results.length,
    results,
    next: null,
    previous: null,
})

const insightsFunctionTemplateRetrieveMock: MockSignature = (req, res, ctx) => {
    const insightsFunctionTemplate =
        _insightsFunctionTemplatesDestinations.results.find((conf) => conf.id === req.params.id) ||
        _insightsFunctionTemplatesTransformations.results.find((conf) => conf.id === req.params.id)
    if (!insightsFunctionTemplate) {
        return res(ctx.status(404))
    }
    return res(ctx.json({ ...insightsFunctionTemplate }))
}

const insightsFunctionTemplatesMock: MockSignature = (req, res, ctx) => {
    const results = req.url.searchParams.get('types')?.includes('transformation')
        ? _insightsFunctionTemplatesTransformations
        : req.url.searchParams.get('types')?.includes('destination')
          ? _insightsFunctionTemplatesDestinations
          : []

    return res(ctx.json(results))
}

// this really returns MaybePromise<ResponseFunction<any>>
// but MSW doesn't export MaybePromise 🤷
function insightsCORSResponse(req: RestRequest, res: ResponseComposition, ctx: RestContext): any {
    return res(
        ctx.status(200),
        ctx.json('ok'),
        // some of our tests try to make requests via insights-js e.g. userLogic calls identify
        // they have to have CORS allowed, or they pass but print noise to the console
        ctx.set('Access-Control-Allow-Origin', req.referrer.length ? req.referrer : 'http://localhost'),
        ctx.set('Access-Control-Allow-Credentials', 'true'),
        ctx.set('Access-Control-Allow-Headers', '*')
    )
}

export const defaultMocks: Mocks = {
    get: {
        '/v1/projects/:team_id/my_notifications/': EMPTY_PAGINATED_RESPONSE,
        '/v1/projects/:team_id/actions/': EMPTY_PAGINATED_RESPONSE,
        '/v1/projects/:team_id/annotations/': EMPTY_PAGINATED_RESPONSE,
        '/v1/projects/:team_id/event_definitions/': EMPTY_PAGINATED_RESPONSE,
        '/v1/projects/:team_id/cohorts/': toPaginatedResponse([MOCK_DEFAULT_COHORT]),
        '/v1/environments/:team_id/dashboards/': EMPTY_PAGINATED_RESPONSE,
        '/v1/environments/:team_id/alerts/': EMPTY_PAGINATED_RESPONSE,
        '/v1/environments/:team_id/insights_functions/': EMPTY_PAGINATED_RESPONSE,
        '/v1/environments/:team_id/user_product_list/': EMPTY_PAGINATED_RESPONSE,
        '/v1/projects/:team_id/dashboard_templates': EMPTY_PAGINATED_RESPONSE,
        '/v1/projects/:team_id/dashboard_templates/repository/': [],
        '/v1/environments/:team_id/external_data_sources/': EMPTY_PAGINATED_RESPONSE,
        '/v1/projects/:team_id/notebooks': () => {
            // this was matching on `?contains=query` but that made MSW unhappy and seems unnecessary
            return [
                200,
                {
                    count: 0,
                    results: [],
                },
            ]
        },
        'v1/projects/:team/notebooks/recording_comments': {
            results: [],
        },
        '/v1/projects/:team_id/groups/': EMPTY_PAGINATED_RESPONSE,
        '/v1/projects/:team_id/groups_types/': [],
        '/v1/environments/:team_id/groups/': EMPTY_PAGINATED_RESPONSE,
        '/v1/environments/:team_id/groups_types/': [],
        '/v1/environments/:team_id/insights/': EMPTY_PAGINATED_RESPONSE,
        '/v1/environments/:team_id/insights/:insight_id/sharing/': {
            enabled: false,
            access_token: 'foo',
            created_at: '2020-11-11T00:00:00Z',
            settings: {},
        } as SharingConfigurationType,
        '/v1/projects/': EMPTY_PAGINATED_RESPONSE,
        '/v1/projects/:team_id/property_definitions/': EMPTY_PAGINATED_RESPONSE,
        '/v1/projects/:team_id/feature_flags/': EMPTY_PAGINATED_RESPONSE,
        '/v1/projects/:team_id/feature_flags/:feature_flag_id/role_access': EMPTY_PAGINATED_RESPONSE,
        '/v1/projects/:team_id/experiments/': EMPTY_PAGINATED_RESPONSE,
        '/v1/environments/:team_id/warehouse_view_link/': EMPTY_PAGINATED_RESPONSE,
        '/v1/environments/:team_id/warehouse_saved_queries/': EMPTY_PAGINATED_RESPONSE,
        '/v1/environments/:team_id/warehouse_tables/': EMPTY_PAGINATED_RESPONSE,
        '/v1/environments/:team_id/core_memory/': { results: [] },
        '/v1/environments/:team_id/conversations/': EMPTY_PAGINATED_RESPONSE,
        '/v1/organizations/@current/': (): MockSignature => [
            200,
            { ...MOCK_DEFAULT_ORGANIZATION, available_product_features: getAvailableProductFeatures() },
        ],
        '/v1/organizations/@current/roles/': EMPTY_PAGINATED_RESPONSE,
        '/v1/organizations/@current/resource_access': EMPTY_PAGINATED_RESPONSE,
        '/v1/organizations/@current/members/': toPaginatedResponse([
            MOCK_DEFAULT_ORGANIZATION_MEMBER,
            MOCK_SECOND_ORGANIZATION_MEMBER,
        ]),
        '/v1/organizations/@current/invites/': toPaginatedResponse([MOCK_DEFAULT_ORGANIZATION_INVITE]),
        '/v1/organizations/@current/plugins/': toPaginatedResponse([MOCK_DEFAULT_PLUGIN]),
        '/v1/organizations/@current/plugins/repository/': [],
        '/v1/organizations/@current/plugins/unused/': [],
        '/v1/plugin_config/': toPaginatedResponse([MOCK_DEFAULT_PLUGIN_CONFIG]),
        [`/v1/environments/:team_id/plugin_configs/${MOCK_DEFAULT_PLUGIN_CONFIG.id}/`]: MOCK_DEFAULT_PLUGIN_CONFIG,
        '/v1/environments/:team_id/persons': EMPTY_PAGINATED_RESPONSE,
        '/v1/environments/:team_id/persons/properties/': toPaginatedResponse(MOCK_PERSON_PROPERTIES),
        '/v1/personal_api_keys/': [],
        '/v1/users/@me/': (): MockSignature => [
            200,
            {
                ...MOCK_DEFAULT_USER,
                organization: {
                    ...MOCK_DEFAULT_ORGANIZATION,
                    available_product_features: getAvailableProductFeatures(),
                },
            },
        ],
        '/v1/users/@me/two_factor_status/': () => [200, { is_enabled: true, backup_codes: [], method: 'TOTP' }],
        '/v1/environments/@current/': MOCK_DEFAULT_TEAM,
        '/v1/projects/@current/': MOCK_DEFAULT_TEAM,
        '/v1/projects/:team_id/comments/count': { count: 0 },
        '/v1/projects/:team_id/comments': { results: [] },
        '/_preflight': require('./fixtures/_preflight.json'),
        '/_system_status': require('./fixtures/_system_status.json'),
        '/v1/instance_status': require('./fixtures/_instance_status.json'),
        // TODO: Add a real mock once we know why this endpoint returns an error inside a 200 response
        '/v1/sentry_stats/': {
            error: 'Error fetching stats from sentry',
            exception: "[ErrorDetail(string='Sentry integration not configured', code='invalid')]",
        },
        // We don't want to show the "new version available" banner in tests
        'https://api.github.com/repos/insights/insights-js/tags': () => [200, []],
        'https://us.i.hanzo.ai/api/early_access_features': {
            earlyAccessFeatures: [],
        },
        '/v1/billing/': {
            ...billingJson,
        },
        '/v1/billing/get_invoices': {
            link: null,
            count: 0,
        },
        '/v1/billing/credits/overview': {
            status: 'None',
            eligible: false,
        },

        '/v1/billing/spend/': { results: [] },
        '/v1/billing/usage/': { results: [] },
        '/v1/projects/:team_id/insights_function_templates': insightsFunctionTemplatesMock,
        '/v1/projects/:team_id/insights_function_templates/:id': insightsFunctionTemplateRetrieveMock,
        '/v1/projects/:team_id/insights_functions': EMPTY_PAGINATED_RESPONSE,
        '/v1/environments/:team_id/data_color_themes': MOCK_DATA_COLOR_THEMES,
        '/v1/projects/:team_id/session_recording_playlists': EMPTY_PAGINATED_RESPONSE,
        '/v1/environments/:team_id/session_recording_playlists': EMPTY_PAGINATED_RESPONSE,
        '/v1/projects/:team_id/session_recordings': EMPTY_PAGINATED_RESPONSE,
        '/v1/environments/:team_id/session_recordings': EMPTY_PAGINATED_RESPONSE,
        '/v1/projects/:team_id/insights/my_last_viewed': EMPTY_PAGINATED_RESPONSE,
        '/v1/environments/:team_id/insights/my_last_viewed': EMPTY_PAGINATED_RESPONSE,
        'v1/projects/:team_id/early_access_feature': EMPTY_PAGINATED_RESPONSE,
        'v1/environments/:team_id/early_access_feature': EMPTY_PAGINATED_RESPONSE,
        '/v1/organizations/:organization_id/proxy_records/': [],
        '/v1/projects/:team_id/dashboard_templates/json_schema/': EMPTY_PAGINATED_RESPONSE,
        '/v1/organizations/:organization_id/domains/': EMPTY_PAGINATED_RESPONSE,
        '/v1/environments/:team_id/default_evaluation_tags/': EMPTY_PAGINATED_RESPONSE,
        '/v1/environments/:team_id/file_system/unfiled/': { count: 0 },
        '/v1/environments/:team_id/file_system/log_view': {},
        '/v1/environments/:team_id/file_system': EMPTY_PAGINATED_RESPONSE,
        '/v1/environments/:team_id/file_system_shortcut/': EMPTY_PAGINATED_RESPONSE,
        '/v1/environments/:team_id/insight_variables/': EMPTY_PAGINATED_RESPONSE,
        '/v1/environments/:team_id/event_ingestion_restrictions/': [],
        '/v1/projects/:team_id/persisted_folder/': EMPTY_PAGINATED_RESPONSE,
        'v1/projects/:team_id/surveys': EMPTY_PAGINATED_RESPONSE,
        'v1/projects/:team_id/surveys/responses_count': {},
        'v1/environments/:team_id/integrations': EMPTY_PAGINATED_RESPONSE,
        'v1/environments/:team_id/error_tracking/assignment_rules': EMPTY_PAGINATED_RESPONSE,
        'v1/environments/:team_id/error_tracking/grouping_rules': EMPTY_PAGINATED_RESPONSE,
        'v1/environments/:team_id/error_tracking/suppression_rules': EMPTY_PAGINATED_RESPONSE,
        'v1/environments/:team_id/error_tracking/symbol_sets': EMPTY_PAGINATED_RESPONSE,
        'v1/projects/@current/resource_access_controls': EMPTY_PAGINATED_RESPONSE,
        'v1/projects/@current/access_controls': EMPTY_PAGINATED_RESPONSE,
        'v1/projects/:team_id/notebooks/recording_comments': EMPTY_PAGINATED_RESPONSE,
        '/v1/sdk_versions/': sdkVersions,
        '/v1/team_sdk_versions/': teamSdkVersions,
        '/v1/environments/:team_id/endpoints/': EMPTY_PAGINATED_RESPONSE,
    },
    post: {
        'https://us.i.hanzo.ai/e/': (req, res, ctx): MockSignature => insightsCORSResponse(req, res, ctx),
        '/e/': (req, res, ctx): MockSignature => insightsCORSResponse(req, res, ctx),
        'https://us.i.hanzo.ai/decide/': (req, res, ctx): MockSignature => insightsCORSResponse(req, res, ctx),
        'https://us.i.hanzo.ai/flags/': (req, res, ctx): MockSignature => insightsCORSResponse(req, res, ctx),
        '/decide/': (req, res, ctx): MockSignature => insightsCORSResponse(req, res, ctx),
        '/flags/': (req, res, ctx): MockSignature => insightsCORSResponse(req, res, ctx),
        'https://us.i.hanzo.ai/engage/': (req, res, ctx): MockSignature => insightsCORSResponse(req, res, ctx),
        '/v1/environments/:team_id/insights/viewed/': (): MockSignature => [201, null],
        'v1/environments/:team_id/query': [200, { results: [] }],
        '/v1/environments/:team_id/file_system/log_view/': {},
    },
    patch: {
        '/v1/projects/:team_id/session_recording_playlists/:playlist_id/': {},
        '/v1/environments/@current/add_product_intent/': MOCK_DEFAULT_TEAM,
        '/v1/environments/:team_id/': MOCK_DEFAULT_TEAM,
    },
    options: {
        'https://us.i.hanzo.ai/decide/': (req, res, ctx): MockSignature => insightsCORSResponse(req, res, ctx),
    },
}
export const handlers = mocksToHandlers(defaultMocks)
