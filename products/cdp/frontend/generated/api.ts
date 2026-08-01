import { apiMutator } from '../../../../frontend/src/lib/api-orval-mutator'
/**
 * Auto-generated from the Django backend OpenAPI schema.
 * To modify these types, update the Django serializers or views, then run:
 *   insightscli build:openapi
 * Questions or issues? #team-devex on Slack
 *
 * Insights API - generated
 * OpenAPI spec version: 1.0.0
 */
import type {
    AppMetricsResponseApi,
    AppMetricsTotalsResponseApi,
    InsightsFunctionApi,
    InsightsFunctionInvocationApi,
    InsightsFunctionTemplateApi,
    InsightsFunctionTemplatesListParams,
    InsightsFunctionsListParams,
    InsightsFunctionsLogsRetrieveParams,
    InsightsFunctionsMetricsRetrieveParams,
    InsightsFunctionsMetricsTotalsRetrieveParams,
    HogInvocationRerunRequestApi,
    HogInvocationRerunResponseApi,
    PaginatedInsightsFunctionMinimalListApi,
    PaginatedInsightsFunctionTemplateListApi,
    PaginatedPluginLogEntryListApi,
    PatchedInsightsFunctionApi,
    PatchedInsightsFunctionRearrangeApi,
    PluginConfigsLogsListParams,
    PublicInsightsFunctionTemplatesListParams,
} from './api.schemas'

// https://stackoverflow.com/questions/49579094/typescript-conditional-types-filter-out-readonly-properties-pick-only-requir/49579497#49579497
type IfEquals<X, Y, A = X, B = never> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? A : B

type WritableKeys<T> = {
    [P in keyof T]-?: IfEquals<{ [Q in P]: T[P] }, { -readonly [Q in P]: T[P] }, P>
}[keyof T]

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never
type DistributeReadOnlyOverUnions<T> = T extends any ? NonReadonly<T> : never

type Writable<T> = Pick<T, WritableKeys<T>>
type NonReadonly<T> = [T] extends [UnionToIntersection<T>]
    ? {
          [P in keyof Writable<T>]: T[P] extends object ? NonReadonly<NonNullable<T[P]>> : T[P]
      }
    : DistributeReadOnlyOverUnions<T>

export const getInsightsFunctionTemplatesListUrl = (projectId: string, params?: InsightsFunctionTemplatesListParams) => {
    const normalizedParams = new URLSearchParams()

    Object.entries(params || {}).forEach(([key, value]) => {
        if (value !== undefined) {
            normalizedParams.append(key, value === null ? 'null' : String(value))
        }
    })

    const stringifiedParams = normalizedParams.toString()

    return stringifiedParams.length > 0
        ? `/api/projects/${projectId}/insights_function_templates/?${stringifiedParams}`
        : `/api/projects/${projectId}/insights_function_templates/`
}

export const insightsFunctionTemplatesList = async (
    projectId: string,
    params?: InsightsFunctionTemplatesListParams,
    options?: RequestInit
): Promise<PaginatedInsightsFunctionTemplateListApi> => {
    return apiMutator<PaginatedInsightsFunctionTemplateListApi>(getInsightsFunctionTemplatesListUrl(projectId, params), {
        ...options,
        method: 'GET',
    })
}

export const getInsightsFunctionTemplatesRetrieveUrl = (projectId: string, templateId: string) => {
    return `/api/projects/${projectId}/insights_function_templates/${templateId}/`
}

export const insightsFunctionTemplatesRetrieve = async (
    projectId: string,
    templateId: string,
    options?: RequestInit
): Promise<InsightsFunctionTemplateApi> => {
    return apiMutator<InsightsFunctionTemplateApi>(getInsightsFunctionTemplatesRetrieveUrl(projectId, templateId), {
        ...options,
        method: 'GET',
    })
}

export const getInsightsFunctionsListUrl = (projectId: string, params?: InsightsFunctionsListParams) => {
    const normalizedParams = new URLSearchParams()

    Object.entries(params || {}).forEach(([key, value]) => {
        if (value !== undefined) {
            normalizedParams.append(key, value === null ? 'null' : String(value))
        }
    })

    const stringifiedParams = normalizedParams.toString()

    return stringifiedParams.length > 0
        ? `/api/projects/${projectId}/insights_functions/?${stringifiedParams}`
        : `/api/projects/${projectId}/insights_functions/`
}

export const insightsFunctionsList = async (
    projectId: string,
    params?: InsightsFunctionsListParams,
    options?: RequestInit
): Promise<PaginatedInsightsFunctionMinimalListApi> => {
    return apiMutator<PaginatedInsightsFunctionMinimalListApi>(getInsightsFunctionsListUrl(projectId, params), {
        ...options,
        method: 'GET',
    })
}

export const getInsightsFunctionsCreateUrl = (projectId: string) => {
    return `/api/projects/${projectId}/insights_functions/`
}

export const insightsFunctionsCreate = async (
    projectId: string,
    insightsFunctionApi?: NonReadonly<InsightsFunctionApi>,
    options?: RequestInit
): Promise<InsightsFunctionApi> => {
    return apiMutator<InsightsFunctionApi>(getInsightsFunctionsCreateUrl(projectId), {
        ...options,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        body: JSON.stringify(insightsFunctionApi),
    })
}

export const getInsightsFunctionsRetrieveUrl = (projectId: string, id: string) => {
    return `/api/projects/${projectId}/insights_functions/${id}/`
}

export const insightsFunctionsRetrieve = async (
    projectId: string,
    id: string,
    options?: RequestInit
): Promise<InsightsFunctionApi> => {
    return apiMutator<InsightsFunctionApi>(getInsightsFunctionsRetrieveUrl(projectId, id), {
        ...options,
        method: 'GET',
    })
}

export const getInsightsFunctionsUpdateUrl = (projectId: string, id: string) => {
    return `/api/projects/${projectId}/insights_functions/${id}/`
}

export const insightsFunctionsUpdate = async (
    projectId: string,
    id: string,
    insightsFunctionApi?: NonReadonly<InsightsFunctionApi>,
    options?: RequestInit
): Promise<InsightsFunctionApi> => {
    return apiMutator<InsightsFunctionApi>(getInsightsFunctionsUpdateUrl(projectId, id), {
        ...options,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        body: JSON.stringify(insightsFunctionApi),
    })
}

export const getInsightsFunctionsPartialUpdateUrl = (projectId: string, id: string) => {
    return `/api/projects/${projectId}/insights_functions/${id}/`
}

export const insightsFunctionsPartialUpdate = async (
    projectId: string,
    id: string,
    patchedInsightsFunctionApi?: NonReadonly<PatchedInsightsFunctionApi>,
    options?: RequestInit
): Promise<InsightsFunctionApi> => {
    return apiMutator<InsightsFunctionApi>(getInsightsFunctionsPartialUpdateUrl(projectId, id), {
        ...options,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        body: JSON.stringify(patchedInsightsFunctionApi),
    })
}

export const getInsightsFunctionsDestroyUrl = (projectId: string, id: string) => {
    return `/api/projects/${projectId}/insights_functions/${id}/`
}

/**
 * Hard delete of this model is not allowed. Use a patch API call to set "deleted" to true
 */
export const insightsFunctionsDestroy = async (projectId: string, id: string, options?: RequestInit): Promise<unknown> => {
    return apiMutator<unknown>(getInsightsFunctionsDestroyUrl(projectId, id), {
        ...options,
        method: 'DELETE',
    })
}

export const getInsightsFunctionsEnableBackfillsCreateUrl = (projectId: string, id: string) => {
    return `/api/projects/${projectId}/insights_functions/${id}/enable_backfills/`
}

export const insightsFunctionsEnableBackfillsCreate = async (
    projectId: string,
    id: string,
    insightsFunctionApi?: NonReadonly<InsightsFunctionApi>,
    options?: RequestInit
): Promise<void> => {
    return apiMutator<void>(getInsightsFunctionsEnableBackfillsCreateUrl(projectId, id), {
        ...options,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        body: JSON.stringify(insightsFunctionApi),
    })
}

export const getInsightsFunctionsInvocationsCreateUrl = (projectId: string, id: string) => {
    return `/api/projects/${projectId}/insights_functions/${id}/invocations/`
}

export const insightsFunctionsInvocationsCreate = async (
    projectId: string,
    id: string,
    insightsFunctionInvocationApi: NonReadonly<InsightsFunctionInvocationApi>,
    options?: RequestInit
): Promise<InsightsFunctionInvocationApi> => {
    return apiMutator<InsightsFunctionInvocationApi>(getInsightsFunctionsInvocationsCreateUrl(projectId, id), {
        ...options,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        body: JSON.stringify(insightsFunctionInvocationApi),
    })
}

export const getInsightsFunctionsLogsRetrieveUrl = (
    projectId: string,
    id: string,
    params?: InsightsFunctionsLogsRetrieveParams
) => {
    const normalizedParams = new URLSearchParams()

    Object.entries(params || {}).forEach(([key, value]) => {
        if (value !== undefined) {
            normalizedParams.append(key, value === null ? 'null' : String(value))
        }
    })

    const stringifiedParams = normalizedParams.toString()

    return stringifiedParams.length > 0
        ? `/api/projects/${projectId}/insights_functions/${id}/logs/?${stringifiedParams}`
        : `/api/projects/${projectId}/insights_functions/${id}/logs/`
}

export const insightsFunctionsLogsRetrieve = async (
    projectId: string,
    id: string,
    params?: InsightsFunctionsLogsRetrieveParams,
    options?: RequestInit
): Promise<void> => {
    return apiMutator<void>(getInsightsFunctionsLogsRetrieveUrl(projectId, id, params), {
        ...options,
        method: 'GET',
    })
}

export const getInsightsFunctionsMetricsRetrieveUrl = (
    projectId: string,
    id: string,
    params?: InsightsFunctionsMetricsRetrieveParams
) => {
    const normalizedParams = new URLSearchParams()

    Object.entries(params || {}).forEach(([key, value]) => {
        if (value !== undefined) {
            normalizedParams.append(key, value === null ? 'null' : String(value))
        }
    })

    const stringifiedParams = normalizedParams.toString()

    return stringifiedParams.length > 0
        ? `/api/projects/${projectId}/insights_functions/${id}/metrics/?${stringifiedParams}`
        : `/api/projects/${projectId}/insights_functions/${id}/metrics/`
}

export const insightsFunctionsMetricsRetrieve = async (
    projectId: string,
    id: string,
    params?: InsightsFunctionsMetricsRetrieveParams,
    options?: RequestInit
): Promise<AppMetricsResponseApi> => {
    return apiMutator<AppMetricsResponseApi>(getInsightsFunctionsMetricsRetrieveUrl(projectId, id, params), {
        ...options,
        method: 'GET',
    })
}

export const getInsightsFunctionsMetricsTotalsRetrieveUrl = (
    projectId: string,
    id: string,
    params?: InsightsFunctionsMetricsTotalsRetrieveParams
) => {
    const normalizedParams = new URLSearchParams()

    Object.entries(params || {}).forEach(([key, value]) => {
        if (value !== undefined) {
            normalizedParams.append(key, value === null ? 'null' : String(value))
        }
    })

    const stringifiedParams = normalizedParams.toString()

    return stringifiedParams.length > 0
        ? `/api/projects/${projectId}/insights_functions/${id}/metrics/totals/?${stringifiedParams}`
        : `/api/projects/${projectId}/insights_functions/${id}/metrics/totals/`
}

export const insightsFunctionsMetricsTotalsRetrieve = async (
    projectId: string,
    id: string,
    params?: InsightsFunctionsMetricsTotalsRetrieveParams,
    options?: RequestInit
): Promise<AppMetricsTotalsResponseApi> => {
    return apiMutator<AppMetricsTotalsResponseApi>(getInsightsFunctionsMetricsTotalsRetrieveUrl(projectId, id, params), {
        ...options,
        method: 'GET',
    })
}

export const getInsightsFunctionsRerunCreateUrl = (projectId: string, id: string) => {
    return `/api/projects/${projectId}/insights_functions/${id}/rerun/`
}

/**
 * Rerun past invocations of this script function from their stored payloads.
 *
 * The CDP worker reads matching rows from the `hog_invocation_results`
 * Datastore table, rehydrates the invocation from the stored
 * `invocation_globals`, and re-enqueues onto cyclotron. Each rerun
 * run reuses the original `invocation_id` with `is_retry=1` set on the
 * new lifecycle row so the UI can surface that it was a rerun.
 *
 * Only types a cyclotron worker executes (`TYPES_THAT_CAN_RERUN`) can be
 * rerun: rerun re-enqueues onto the cyclotron script queue, and other types
 * run elsewhere (source webhooks inline in the cdp-api HTTP handler,
 * transformations during ingestion, `site_*` transpiled to client-side
 * JS). A re-enqueued invocation of one of those would never drain and
 * wedges the partition, so a rerun of a non-rerunnable type is rejected
 * with a 400 here.
 *
 * Because rerun replays historical event/person/group data, it requires
 * `person:read` and `group:read` on top of `insights_function:write`.
 */
export const insightsFunctionsRerunCreate = async (
    projectId: string,
    id: string,
    hogInvocationRerunRequestApi: HogInvocationRerunRequestApi,
    options?: RequestInit
): Promise<HogInvocationRerunResponseApi> => {
    return apiMutator<HogInvocationRerunResponseApi>(getInsightsFunctionsRerunCreateUrl(projectId, id), {
        ...options,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        body: JSON.stringify(hogInvocationRerunRequestApi),
    })
}

export const getInsightsFunctionsIconRetrieveUrl = (projectId: string) => {
    return `/api/projects/${projectId}/insights_functions/icon/`
}

export const insightsFunctionsIconRetrieve = async (projectId: string, options?: RequestInit): Promise<void> => {
    return apiMutator<void>(getInsightsFunctionsIconRetrieveUrl(projectId), {
        ...options,
        method: 'GET',
    })
}

export const getInsightsFunctionsIconsRetrieveUrl = (projectId: string) => {
    return `/api/projects/${projectId}/insights_functions/icons/`
}

export const insightsFunctionsIconsRetrieve = async (projectId: string, options?: RequestInit): Promise<void> => {
    return apiMutator<void>(getInsightsFunctionsIconsRetrieveUrl(projectId), {
        ...options,
        method: 'GET',
    })
}

export const getInsightsFunctionsRearrangePartialUpdateUrl = (projectId: string) => {
    return `/api/projects/${projectId}/insights_functions/rearrange/`
}

/**
 * Update the execution order of multiple InsightsFunctions.
 */
export const insightsFunctionsRearrangePartialUpdate = async (
    projectId: string,
    patchedInsightsFunctionRearrangeApi?: PatchedInsightsFunctionRearrangeApi,
    options?: RequestInit
): Promise<InsightsFunctionApi[]> => {
    return apiMutator<InsightsFunctionApi[]>(getInsightsFunctionsRearrangePartialUpdateUrl(projectId), {
        ...options,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        body: JSON.stringify(patchedInsightsFunctionRearrangeApi),
    })
}

export const getPluginConfigsLogsListUrl = (
    projectId: string,
    pluginConfigId: number,
    params?: PluginConfigsLogsListParams
) => {
    const normalizedParams = new URLSearchParams()

    Object.entries(params || {}).forEach(([key, value]) => {
        if (value !== undefined) {
            normalizedParams.append(key, value === null ? 'null' : String(value))
        }
    })

    const stringifiedParams = normalizedParams.toString()

    return stringifiedParams.length > 0
        ? `/api/projects/${projectId}/plugin_configs/${pluginConfigId}/logs/?${stringifiedParams}`
        : `/api/projects/${projectId}/plugin_configs/${pluginConfigId}/logs/`
}

export const pluginConfigsLogsList = async (
    projectId: string,
    pluginConfigId: number,
    params?: PluginConfigsLogsListParams,
    options?: RequestInit
): Promise<PaginatedPluginLogEntryListApi> => {
    return apiMutator<PaginatedPluginLogEntryListApi>(getPluginConfigsLogsListUrl(projectId, pluginConfigId, params), {
        ...options,
        method: 'GET',
    })
}

export const getPublicInsightsFunctionTemplatesListUrl = (params?: PublicInsightsFunctionTemplatesListParams) => {
    const normalizedParams = new URLSearchParams()

    Object.entries(params || {}).forEach(([key, value]) => {
        if (value !== undefined) {
            normalizedParams.append(key, value === null ? 'null' : String(value))
        }
    })

    const stringifiedParams = normalizedParams.toString()

    return stringifiedParams.length > 0
        ? `/api/public_insights_function_templates/?${stringifiedParams}`
        : `/api/public_insights_function_templates/`
}

export const publicInsightsFunctionTemplatesList = async (
    params?: PublicInsightsFunctionTemplatesListParams,
    options?: RequestInit
): Promise<PaginatedInsightsFunctionTemplateListApi> => {
    return apiMutator<PaginatedInsightsFunctionTemplateListApi>(getPublicInsightsFunctionTemplatesListUrl(params), {
        ...options,
        method: 'GET',
    })
}
