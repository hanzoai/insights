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
    MOCK_EXPERIMENTS_STATS_RESPONSE,
} from 'lib/api.mock'

import { HttpResponse } from 'msw'

import { STATUS_PAGE_BASE } from 'lib/components/HelpMenu/incidentStatusLogic'

import sdkVersions from '~/mocks/fixtures/api/sdk_versions.json'
import teamSdkVersions from '~/mocks/fixtures/api/team_sdk_versions.json'
import { SharingConfigurationType } from '~/types'

import { getAvailableProductFeatures } from './features'
import { billingJson } from './fixtures/_billing'
import _insightsFunctionTemplatesDestinations from './fixtures/_insightsFunctionTemplatesDestinations.json'
import _insightsFunctionTemplatesTransformations from './fixtures/_insightsFunctionTemplatesTransformations.json'
import _instanceStatus from './fixtures/_instance_status.json'
import _preflight from './fixtures/_preflight.json'
import * as statusPageAllOK from './fixtures/_status_page_all_ok.json'
import _systemStatus from './fixtures/_system_status.json'
import { MockResolverInfo, MockSignature, Mocks, mocksToHandlers } from './utils'

export const EMPTY_PAGINATED_RESPONSE = {
    count: 0,
    results: [] as any[],
    next: null,
    previous: null,
}
export const toPaginatedResponse = (results: any[]): typeof EMPTY_PAGINATED_RESPONSE => ({
    count: results.length,
    results,
    next: null,
    previous: null,
})

const insightsFunctionTemplateRetrieveMock: MockSignature = ({ params }) => {
    const insightsFunctionTemplate =
        _insightsFunctionTemplatesDestinations.results.find((conf) => conf.id === params.id) ||
        _insightsFunctionTemplatesTransformations.results.find((conf) => conf.id === params.id)
    if (!insightsFunctionTemplate) {
        return new HttpResponse(null, { status: 404 })
    }
    return HttpResponse.json({ ...insightsFunctionTemplate })
}

const insightsFunctionTemplatesMock: MockSignature = ({ request }) => {
    const types = new URL(request.url).searchParams.get('types')
    const results = types?.includes('transformation')
        ? _insightsFunctionTemplatesTransformations
        : types?.includes('destination')
          ? _insightsFunctionTemplatesDestinations
          : []

    return HttpResponse.json(results)
}

// Access-Control-Allow-Origin must be an origin (scheme + host + port), not a URL with a path.
// Prefer the Origin header; fall back to deriving the origin from Referer (which often carries a path).
function corsAllowOrigin({ request }: MockResolverInfo): string {
    const origin = request.headers.get('origin')
    if (origin && origin.length) {
        return origin
    }
    const referer = request.headers.get('referer')
    if (referer && referer.length) {
        try {
            return new URL(referer).origin
        } catch {
            // malformed referer — fall through to the default
        }
    }
    return 'http://localhost'
}

function insightsCORSResponse(info: MockResolverInfo): Response {
    return HttpResponse.json('ok', {
        status: 200,
        // some of our tests try to make requests via insights-js e.g. userLogic calls identify
        // they have to have CORS allowed, or they pass but print noise to the console
        headers: {
            'Access-Control-Allow-Origin': corsAllowOrigin(info),
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Headers': '*',
        },
    })
}

export const defaultMocks: Mocks = {
    get: {
        '/v1/projects/:team_id/my_notifications/': EMPTY_PAGINATED_RESPONSE,
        '/v1/projects/:team_id/tasks/': EMPTY_PAGINATED_RESPONSE,
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
        // Property values endpoints - prevent 'Failed to load property values' error toasts
        '/v1/event/values/': [],
        '/v1/person/values/': [],
        '/v1/group/values/': [],
        '/v1/environments/:team_id/sessions/values/': [],
        '/v1/projects/:team_id/flag_value/values/': [],
        '/v1/projects/:team_id/groups/property_values/': [],
        '/v1/environments/:team_id/data_warehouse/property_values/': [],
        '/v1/projects/:team_id/feature_flags/': EMPTY_PAGINATED_RESPONSE,
        '/v1/projects/:team_id/feature_flags/:feature_flag_id/role_access': EMPTY_PAGINATED_RESPONSE,
        '/v1/projects/:team_id/experiments/': EMPTY_PAGINATED_RESPONSE,
        '/v1/projects/:team_id/experiments/stats/': MOCK_EXPERIMENTS_STATS_RESPONSE,
        '/v1/environments/:team_id/warehouse_view_link/': EMPTY_PAGINATED_RESPONSE,
        '/v1/environments/:team_id/warehouse_saved_query_folders/': [],
        '/v1/environments/:team_id/warehouse_saved_queries/': EMPTY_PAGINATED_RESPONSE,
        '/v1/environments/:team_id/warehouse_tables/': EMPTY_PAGINATED_RESPONSE,
        '/v1/environments/:team_id/core_memory/': { results: [] },
        '/v1/environments/:team_id/conversations/': EMPTY_PAGINATED_RESPONSE,
        '/v1/user_home_settings/@me/': { tabs: [], homepage: null },
        '/v1/organizations/@current/': () => [
            200,
            {
                ...MOCK_DEFAULT_ORGANIZATION,
                available_product_features: getAvailableProductFeatures(),
            },
        ],
        '/v1/organizations/:organization_id/roles/': EMPTY_PAGINATED_RESPONSE,
        '/v1/organizations/:organization_id/resource_access': EMPTY_PAGINATED_RESPONSE,
        '/v1/organizations/:organization_id/members/': toPaginatedResponse([
            MOCK_DEFAULT_ORGANIZATION_MEMBER,
            MOCK_SECOND_ORGANIZATION_MEMBER,
        ]),
        '/v1/organizations/:organization_id/invites/': toPaginatedResponse([MOCK_DEFAULT_ORGANIZATION_INVITE]),
        '/v1/organizations/:organization_id/plugins/': toPaginatedResponse([MOCK_DEFAULT_PLUGIN]),
        '/v1/organizations/:organization_id/plugins/repository/': [],
        '/v1/organizations/:organization_id/plugins/unused/': [],
        '/v1/plugin_config/': toPaginatedResponse([MOCK_DEFAULT_PLUGIN_CONFIG]),
        [`/v1/environments/:team_id/plugin_configs/${MOCK_DEFAULT_PLUGIN_CONFIG.id}/`]: MOCK_DEFAULT_PLUGIN_CONFIG,
        '/v1/environments/:team_id/persons': EMPTY_PAGINATED_RESPONSE,
        '/v1/environments/:team_id/persons/properties/': toPaginatedResponse(MOCK_PERSON_PROPERTIES),
        '/v1/personal_api_keys/': [],
        '/v1/users/@me/': () => [
            200,
            {
                ...MOCK_DEFAULT_USER,
                organization: {
                    ...MOCK_DEFAULT_ORGANIZATION,
                    available_product_features: getAvailableProductFeatures(),
                },
                pending_invites: [],
            },
        ],
        '/v1/users/@me/mascot_config/': {
            color: null,
            enabled: false,
            accessories: ['tophat', 'sunglasses'],
            use_as_profile: true,
            walking_enabled: true,
            controls_enabled: true,
            party_mode_enabled: true,
            interactions_enabled: true,
        },
        '/v1/environments/@current/': MOCK_DEFAULT_TEAM, // bootstrap endpoint — intentionally @current
        '/v1/projects/@current/': MOCK_DEFAULT_TEAM, // bootstrap endpoint — intentionally @current
        '/v1/projects/:team_id/comments/count': { count: 0 },
        '/v1/projects/:team_id/comments': { results: [] },
        '/_preflight': _preflight,
        '/_system_status': _systemStatus,
        '/v1/instance_status': _instanceStatus,
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
        [`${STATUS_PAGE_BASE}/api/v1/summary`]: statusPageAllOK,
        '/v1/projects/:team_id/insights_function_templates': insightsFunctionTemplatesMock,
        '/v1/projects/:team_id/insights_function_templates/:id': insightsFunctionTemplateRetrieveMock,
        '/v1/projects/:team_id/insights_functions': EMPTY_PAGINATED_RESPONSE,
        '/v1/environments/:team_id/data_color_themes': MOCK_DATA_COLOR_THEMES,
        '/v1/projects/:team_id/session_recording_playlists': EMPTY_PAGINATED_RESPONSE,
        '/v1/environments/:team_id/session_recording_playlists': EMPTY_PAGINATED_RESPONSE,
        '/v1/projects/:team_id/session_recordings': EMPTY_PAGINATED_RESPONSE,
        '/v1/environments/:team_id/session_recordings': EMPTY_PAGINATED_RESPONSE,
        '/v1/environments/:team_id/session_recordings/:id/capture_diagnostics': { properties: null },
        '/v1/projects/:team_id/insights/my_last_viewed': EMPTY_PAGINATED_RESPONSE,
        '/v1/environments/:team_id/insights/my_last_viewed': EMPTY_PAGINATED_RESPONSE,
        'v1/projects/:team_id/early_access_feature': EMPTY_PAGINATED_RESPONSE,
        'v1/environments/:team_id/early_access_feature': EMPTY_PAGINATED_RESPONSE,
        // projectNoticeLogic reads `.results` off this response. A configured proxy so the
        // date-gated missing-reverse-proxy notice can't render (and shift every scene
        // story's snapshot) during the first week of each month.
        '/v1/organizations/:organization_id/proxy_records/': {
            results: [
                {
                    id: '018f6b3f-0000-0000-0000-000000000000',
                    domain: 'ph.example.com',
                    status: 'valid',
                    target_cname: 'proxy.insights.example',
                },
            ],
        },
        '/v1/projects/:team_id/dashboard_templates/json_schema/': EMPTY_PAGINATED_RESPONSE,
        '/v1/organizations/:organization_id/domains/': EMPTY_PAGINATED_RESPONSE,
        '/v1/environments/:team_id/default_evaluation_contexts/': {
            default_evaluation_contexts: [],
            available_contexts: [],
            hidden_contexts: [],
            enabled: false,
        },
        '/v1/environments/:team_id/file_system/unfiled/': { count: 0 },
        '/v1/environments/:team_id/file_system/log_view': {},
        '/v1/environments/:team_id/file_system': EMPTY_PAGINATED_RESPONSE,
        '/v1/environments/:team_id/file_system_shortcut/': EMPTY_PAGINATED_RESPONSE,
        '/v1/environments/:team_id/insight_variables/': EMPTY_PAGINATED_RESPONSE,
        '/v1/environments/:team_id/event_ingestion_restrictions/': [],
        'v1/projects/:team_id/surveys': EMPTY_PAGINATED_RESPONSE,
        'v1/projects/:team_id/surveys/responses_count': {},
        'v1/environments/:team_id/integrations': EMPTY_PAGINATED_RESPONSE,
        '/v1/organizations/:organization_id/integrations/': EMPTY_PAGINATED_RESPONSE,
        '/v1/environments/:team_id/quick_filters/': EMPTY_PAGINATED_RESPONSE,
        'v1/environments/:team_id/error_tracking/assignment_rules': EMPTY_PAGINATED_RESPONSE,
        'v1/environments/:team_id/error_tracking/grouping_rules': EMPTY_PAGINATED_RESPONSE,
        'v1/environments/:team_id/error_tracking/suppression_rules': EMPTY_PAGINATED_RESPONSE,
        'v1/environments/:team_id/error_tracking/symbol_sets': EMPTY_PAGINATED_RESPONSE,
        'v1/projects/:team_id/resource_access_controls': EMPTY_PAGINATED_RESPONSE,
        'v1/projects/:team_id/access_controls': EMPTY_PAGINATED_RESPONSE,
        'v1/projects/:team_id/notebooks/recording_comments': EMPTY_PAGINATED_RESPONSE,
        '/v1/sdk_versions/': sdkVersions,
        '/v1/team_sdk_versions/': teamSdkVersions,
        '/v1/environments/:team_id/endpoints/': EMPTY_PAGINATED_RESPONSE,
        '/v1/projects/:team_id/signals/source_configs/': EMPTY_PAGINATED_RESPONSE,
        '/v1/projects/:team_id/feature_flags/:feature_flag_id/dependent_flags/': EMPTY_PAGINATED_RESPONSE,
        '/v1/environments/:team_id/llm_prompts/resolve/': {},
        '/v1/environments/:team_id/llm_analytics/': {},
        '/v1/projects/:team_id/tags/': [],
    },
    post: {
        'https://us.i.hanzo.ai/e/': insightsCORSResponse,
        '/e/': insightsCORSResponse,
        'https://us.i.hanzo.ai/decide/': insightsCORSResponse,
        'https://us.i.hanzo.ai/flags/': insightsCORSResponse,
        '/decide/': insightsCORSResponse,
        '/flags/': insightsCORSResponse,
        'https://us.i.hanzo.ai/engage/': insightsCORSResponse,
        '/v1/environments/:team_id/query/': { results: [] },
        '/v1/environments/:team_id/query/:query_kind/': { results: [] },
        '/v1/environments/:team_id/insights/viewed/': () => [201, null],
        // Background telemetry beacon fired by metalyticsLogic when a scene is viewed — stub it so
        // stories that render insights don't hit an unhandled 405 during play.
        '/v1/projects/:team_id/metalytics/': () => [201, null],
        'v1/environments/:team_id/query': { results: [] },
        'v1/environments/:team_id/query/:query_kind/': { results: [] },
        '/v1/environments/:team_id/file_system/log_view/': {},
    },
    patch: {
        '/v1/projects/:team_id/session_recording_playlists/:playlist_id/': {},
        '/v1/environments/:team_id/add_product_intent/': MOCK_DEFAULT_TEAM,
        '/v1/environments/:team_id/': MOCK_DEFAULT_TEAM,
        '/v1/user_home_settings/@me/': { tabs: [], homepage: null },
    },
    options: {
        'https://us.i.hanzo.ai/decide/': insightsCORSResponse,
    },
}
export const handlers = mocksToHandlers(defaultMocks)
