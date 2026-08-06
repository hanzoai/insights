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
    BlastRadiusApi,
    BlastRadiusRequestApi,
    EmailSendingSuspensionStatusApi,
    InsightsFlowApi,
    InsightsFlowBatchJobApi,
    InsightsFlowInvocationApi,
    InsightsFlowPublishRequestApi,
    InsightsFlowPublishResponseApi,
    InsightsFlowRevisionApi,
    InsightsFlowRevisionRestoreRequestApi,
    InsightsFlowScheduleApi,
    InsightsFlowTemplateApi,
    InsightsFlowTemplatesListParams,
    InsightsFlowTemplatesLogsRetrieveParams,
    InsightsFlowsAssetContentRetrieveParams,
    InsightsFlowsAssetsRetrieveParams,
    InsightsFlowsInvocationResultsRetrieveParams,
    InsightsFlowsListParams,
    InsightsFlowsLogsRetrieveParams,
    InsightsFlowsMetricsGlobalRetrieveParams,
    InsightsFlowsMetricsRetrieveParams,
    InsightsFlowsMetricsTotalsRetrieveParams,
    InsightsFlowsReputationRetrieveParams,
    InsightsFlowsRevisionsListParams,
    HogInvocationRerunRequestApi,
    HogInvocationRerunResponseApi,
    HogInvocationResultApi,
    HogInvocationResultDetailApi,
    MessageAssetApi,
    PaginatedInsightsFlowMinimalListApi,
    PaginatedInsightsFlowRevisionBasicListApi,
    PaginatedInsightsFlowTemplateListApi,
    PatchedInsightsFlowApi,
    PatchedInsightsFlowGraphUpdateApi,
    PatchedInsightsFlowScheduleApi,
    PatchedInsightsFlowTemplateApi,
    TeamEmailReputationResponseApi,
    WorkflowStatsRowApi,
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

export const getInternalInsightsFlowsProcessDueSchedulesCreateUrl = () => {
    return `/api/internal/hog_flows/process_due_schedules`
}

/**
 * Internal endpoint called by the scheduler service to process due schedules.
 * Handles both executing due schedules and initializing next_run_at for new ones.
 */
export const internalInsightsFlowsProcessDueSchedulesCreate = async (options?: RequestInit): Promise<void> => {
    return apiMutator<void>(getInternalInsightsFlowsProcessDueSchedulesCreateUrl(), {
        ...options,
        method: 'POST',
    })
}

export const getInsightsFlowTemplatesListUrl = (projectId: string, params?: InsightsFlowTemplatesListParams) => {
    const normalizedParams = new URLSearchParams()

    Object.entries(params || {}).forEach(([key, value]) => {
        if (value !== undefined) {
            normalizedParams.append(key, value === null ? 'null' : String(value))
        }
    })

    const stringifiedParams = normalizedParams.toString()

    return stringifiedParams.length > 0
        ? `/api/projects/${projectId}/hog_flow_templates/?${stringifiedParams}`
        : `/api/projects/${projectId}/hog_flow_templates/`
}

/**
 * Override list to include global templates from files alongside team templates from DB.
 */
export const hogFlowTemplatesList = async (
    projectId: string,
    params?: InsightsFlowTemplatesListParams,
    options?: RequestInit
): Promise<PaginatedInsightsFlowTemplateListApi> => {
    return apiMutator<PaginatedInsightsFlowTemplateListApi>(getInsightsFlowTemplatesListUrl(projectId, params), {
        ...options,
        method: 'GET',
    })
}

export const getInsightsFlowTemplatesCreateUrl = (projectId: string) => {
    return `/api/projects/${projectId}/hog_flow_templates/`
}

export const hogFlowTemplatesCreate = async (
    projectId: string,
    hogFlowTemplateApi: NonReadonly<InsightsFlowTemplateApi>,
    options?: RequestInit
): Promise<InsightsFlowTemplateApi> => {
    return apiMutator<InsightsFlowTemplateApi>(getInsightsFlowTemplatesCreateUrl(projectId), {
        ...options,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        body: JSON.stringify(hogFlowTemplateApi),
    })
}

export const getInsightsFlowTemplatesRetrieveUrl = (projectId: string, id: string) => {
    return `/api/projects/${projectId}/hog_flow_templates/${id}/`
}

/**
 * Check file-based global templates first, then DB team templates.
 * The queryset excludes all global templates from DB, so this only returns team templates from DB.
 */
export const hogFlowTemplatesRetrieve = async (
    projectId: string,
    id: string,
    options?: RequestInit
): Promise<InsightsFlowTemplateApi> => {
    return apiMutator<InsightsFlowTemplateApi>(getInsightsFlowTemplatesRetrieveUrl(projectId, id), {
        ...options,
        method: 'GET',
    })
}

export const getInsightsFlowTemplatesUpdateUrl = (projectId: string, id: string) => {
    return `/api/projects/${projectId}/hog_flow_templates/${id}/`
}

export const hogFlowTemplatesUpdate = async (
    projectId: string,
    id: string,
    hogFlowTemplateApi: NonReadonly<InsightsFlowTemplateApi>,
    options?: RequestInit
): Promise<InsightsFlowTemplateApi> => {
    return apiMutator<InsightsFlowTemplateApi>(getInsightsFlowTemplatesUpdateUrl(projectId, id), {
        ...options,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        body: JSON.stringify(hogFlowTemplateApi),
    })
}

export const getInsightsFlowTemplatesPartialUpdateUrl = (projectId: string, id: string) => {
    return `/api/projects/${projectId}/hog_flow_templates/${id}/`
}

export const hogFlowTemplatesPartialUpdate = async (
    projectId: string,
    id: string,
    patchedInsightsFlowTemplateApi?: NonReadonly<PatchedInsightsFlowTemplateApi>,
    options?: RequestInit
): Promise<InsightsFlowTemplateApi> => {
    return apiMutator<InsightsFlowTemplateApi>(getInsightsFlowTemplatesPartialUpdateUrl(projectId, id), {
        ...options,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        body: JSON.stringify(patchedInsightsFlowTemplateApi),
    })
}

export const getInsightsFlowTemplatesDestroyUrl = (projectId: string, id: string) => {
    return `/api/projects/${projectId}/hog_flow_templates/${id}/`
}

export const hogFlowTemplatesDestroy = async (projectId: string, id: string, options?: RequestInit): Promise<void> => {
    return apiMutator<void>(getInsightsFlowTemplatesDestroyUrl(projectId, id), {
        ...options,
        method: 'DELETE',
    })
}

export const getInsightsFlowTemplatesLogsRetrieveUrl = (
    projectId: string,
    id: string,
    params?: InsightsFlowTemplatesLogsRetrieveParams
) => {
    const normalizedParams = new URLSearchParams()

    Object.entries(params || {}).forEach(([key, value]) => {
        if (value !== undefined) {
            normalizedParams.append(key, value === null ? 'null' : String(value))
        }
    })

    const stringifiedParams = normalizedParams.toString()

    return stringifiedParams.length > 0
        ? `/api/projects/${projectId}/hog_flow_templates/${id}/logs/?${stringifiedParams}`
        : `/api/projects/${projectId}/hog_flow_templates/${id}/logs/`
}

export const hogFlowTemplatesLogsRetrieve = async (
    projectId: string,
    id: string,
    params?: InsightsFlowTemplatesLogsRetrieveParams,
    options?: RequestInit
): Promise<void> => {
    return apiMutator<void>(getInsightsFlowTemplatesLogsRetrieveUrl(projectId, id, params), {
        ...options,
        method: 'GET',
    })
}

export const getInsightsFlowsListUrl = (projectId: string, params?: InsightsFlowsListParams) => {
    const normalizedParams = new URLSearchParams()

    Object.entries(params || {}).forEach(([key, value]) => {
        if (value !== undefined) {
            normalizedParams.append(key, value === null ? 'null' : String(value))
        }
    })

    const stringifiedParams = normalizedParams.toString()

    return stringifiedParams.length > 0
        ? `/api/projects/${projectId}/hog_flows/?${stringifiedParams}`
        : `/api/projects/${projectId}/hog_flows/`
}

export const hogFlowsList = async (
    projectId: string,
    params?: InsightsFlowsListParams,
    options?: RequestInit
): Promise<PaginatedInsightsFlowMinimalListApi> => {
    return apiMutator<PaginatedInsightsFlowMinimalListApi>(getInsightsFlowsListUrl(projectId, params), {
        ...options,
        method: 'GET',
    })
}

export const getInsightsFlowsCreateUrl = (projectId: string) => {
    return `/api/projects/${projectId}/hog_flows/`
}

export const hogFlowsCreate = async (
    projectId: string,
    hogFlowApi: NonReadonly<InsightsFlowApi>,
    options?: RequestInit
): Promise<InsightsFlowApi> => {
    return apiMutator<InsightsFlowApi>(getInsightsFlowsCreateUrl(projectId), {
        ...options,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        body: JSON.stringify(hogFlowApi),
    })
}

export const getInsightsFlowsRetrieveUrl = (projectId: string, id: string) => {
    return `/api/projects/${projectId}/hog_flows/${id}/`
}

export const hogFlowsRetrieve = async (projectId: string, id: string, options?: RequestInit): Promise<InsightsFlowApi> => {
    return apiMutator<InsightsFlowApi>(getInsightsFlowsRetrieveUrl(projectId, id), {
        ...options,
        method: 'GET',
    })
}

export const getInsightsFlowsUpdateUrl = (projectId: string, id: string) => {
    return `/api/projects/${projectId}/hog_flows/${id}/`
}

export const hogFlowsUpdate = async (
    projectId: string,
    id: string,
    hogFlowApi: NonReadonly<InsightsFlowApi>,
    options?: RequestInit
): Promise<InsightsFlowApi> => {
    return apiMutator<InsightsFlowApi>(getInsightsFlowsUpdateUrl(projectId, id), {
        ...options,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        body: JSON.stringify(hogFlowApi),
    })
}

export const getInsightsFlowsPartialUpdateUrl = (projectId: string, id: string) => {
    return `/api/projects/${projectId}/hog_flows/${id}/`
}

export const hogFlowsPartialUpdate = async (
    projectId: string,
    id: string,
    patchedInsightsFlowApi?: NonReadonly<PatchedInsightsFlowApi>,
    options?: RequestInit
): Promise<InsightsFlowApi> => {
    return apiMutator<InsightsFlowApi>(getInsightsFlowsPartialUpdateUrl(projectId, id), {
        ...options,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        body: JSON.stringify(patchedInsightsFlowApi),
    })
}

export const getInsightsFlowsDestroyUrl = (projectId: string, id: string) => {
    return `/api/projects/${projectId}/hog_flows/${id}/`
}

export const hogFlowsDestroy = async (projectId: string, id: string, options?: RequestInit): Promise<void> => {
    return apiMutator<void>(getInsightsFlowsDestroyUrl(projectId, id), {
        ...options,
        method: 'DELETE',
    })
}

export const getInsightsFlowsAssetsRetrieveUrl = (projectId: string, id: string, params?: InsightsFlowsAssetsRetrieveParams) => {
    const normalizedParams = new URLSearchParams()

    Object.entries(params || {}).forEach(([key, value]) => {
        if (value !== undefined) {
            normalizedParams.append(key, value === null ? 'null' : String(value))
        }
    })

    const stringifiedParams = normalizedParams.toString()

    return stringifiedParams.length > 0
        ? `/api/projects/${projectId}/hog_flows/${id}/assets/?${stringifiedParams}`
        : `/api/projects/${projectId}/hog_flows/${id}/assets/`
}

export const hogFlowsAssetsRetrieve = async (
    projectId: string,
    id: string,
    params?: InsightsFlowsAssetsRetrieveParams,
    options?: RequestInit
): Promise<MessageAssetApi[]> => {
    return apiMutator<MessageAssetApi[]>(getInsightsFlowsAssetsRetrieveUrl(projectId, id, params), {
        ...options,
        method: 'GET',
    })
}

export const getInsightsFlowsAssetContentRetrieveUrl = (
    projectId: string,
    id: string,
    params: InsightsFlowsAssetContentRetrieveParams
) => {
    const normalizedParams = new URLSearchParams()

    Object.entries(params || {}).forEach(([key, value]) => {
        if (value !== undefined) {
            normalizedParams.append(key, value === null ? 'null' : String(value))
        }
    })

    const stringifiedParams = normalizedParams.toString()

    return stringifiedParams.length > 0
        ? `/api/projects/${projectId}/hog_flows/${id}/assets/content/?${stringifiedParams}`
        : `/api/projects/${projectId}/hog_flows/${id}/assets/content/`
}

export const hogFlowsAssetContentRetrieve = async (
    projectId: string,
    id: string,
    params: InsightsFlowsAssetContentRetrieveParams,
    options?: RequestInit
): Promise<string> => {
    return apiMutator<string>(getInsightsFlowsAssetContentRetrieveUrl(projectId, id, params), {
        ...options,
        method: 'GET',
    })
}

export const getInsightsFlowsBatchJobsListUrl = (projectId: string, id: string) => {
    return `/api/projects/${projectId}/hog_flows/${id}/batch_jobs/`
}

export const hogFlowsBatchJobsList = async (
    projectId: string,
    id: string,
    options?: RequestInit
): Promise<InsightsFlowBatchJobApi[]> => {
    return apiMutator<InsightsFlowBatchJobApi[]>(getInsightsFlowsBatchJobsListUrl(projectId, id), {
        ...options,
        method: 'GET',
    })
}

export const getInsightsFlowsBatchJobsCreateUrl = (projectId: string, id: string) => {
    return `/api/projects/${projectId}/hog_flows/${id}/batch_jobs/`
}

export const hogFlowsBatchJobsCreate = async (
    projectId: string,
    id: string,
    hogFlowBatchJobApi: NonReadonly<InsightsFlowBatchJobApi>,
    options?: RequestInit
): Promise<InsightsFlowBatchJobApi> => {
    return apiMutator<InsightsFlowBatchJobApi>(getInsightsFlowsBatchJobsCreateUrl(projectId, id), {
        ...options,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        body: JSON.stringify(hogFlowBatchJobApi),
    })
}

export const getInsightsFlowsDiscardDraftCreateUrl = (projectId: string, id: string) => {
    return `/api/projects/${projectId}/hog_flows/${id}/discard_draft/`
}

export const hogFlowsDiscardDraftCreate = async (
    projectId: string,
    id: string,
    options?: RequestInit
): Promise<InsightsFlowApi> => {
    return apiMutator<InsightsFlowApi>(getInsightsFlowsDiscardDraftCreateUrl(projectId, id), {
        ...options,
        method: 'POST',
    })
}

export const getInsightsFlowsGraphPartialUpdateUrl = (projectId: string, id: string) => {
    return `/api/projects/${projectId}/hog_flows/${id}/graph/`
}

export const hogFlowsGraphPartialUpdate = async (
    projectId: string,
    id: string,
    patchedInsightsFlowGraphUpdateApi?: PatchedInsightsFlowGraphUpdateApi,
    options?: RequestInit
): Promise<InsightsFlowApi> => {
    return apiMutator<InsightsFlowApi>(getInsightsFlowsGraphPartialUpdateUrl(projectId, id), {
        ...options,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        body: JSON.stringify(patchedInsightsFlowGraphUpdateApi),
    })
}

export const getInsightsFlowsInvocationResultsRetrieveUrl = (
    projectId: string,
    id: string,
    params?: InsightsFlowsInvocationResultsRetrieveParams
) => {
    const normalizedParams = new URLSearchParams()

    Object.entries(params || {}).forEach(([key, value]) => {
        if (value !== undefined) {
            normalizedParams.append(key, value === null ? 'null' : String(value))
        }
    })

    const stringifiedParams = normalizedParams.toString()

    return stringifiedParams.length > 0
        ? `/api/projects/${projectId}/hog_flows/${id}/invocation_results/?${stringifiedParams}`
        : `/api/projects/${projectId}/hog_flows/${id}/invocation_results/`
}

export const hogFlowsInvocationResultsRetrieve = async (
    projectId: string,
    id: string,
    params?: InsightsFlowsInvocationResultsRetrieveParams,
    options?: RequestInit
): Promise<HogInvocationResultApi[]> => {
    return apiMutator<HogInvocationResultApi[]>(getInsightsFlowsInvocationResultsRetrieveUrl(projectId, id, params), {
        ...options,
        method: 'GET',
    })
}

export const getInsightsFlowsInvocationResultRetrieveUrl = (projectId: string, id: string, invocationId: string) => {
    return `/api/projects/${projectId}/hog_flows/${id}/invocation_results/${invocationId}/`
}

export const hogFlowsInvocationResultRetrieve = async (
    projectId: string,
    id: string,
    invocationId: string,
    options?: RequestInit
): Promise<HogInvocationResultDetailApi> => {
    return apiMutator<HogInvocationResultDetailApi>(
        getInsightsFlowsInvocationResultRetrieveUrl(projectId, id, invocationId),
        {
            ...options,
            method: 'GET',
        }
    )
}

export const getInsightsFlowsInvocationsCreateUrl = (projectId: string, id: string) => {
    return `/api/projects/${projectId}/hog_flows/${id}/invocations/`
}

export const hogFlowsInvocationsCreate = async (
    projectId: string,
    id: string,
    hogFlowInvocationApi?: NonReadonly<InsightsFlowInvocationApi>,
    options?: RequestInit
): Promise<void> => {
    return apiMutator<void>(getInsightsFlowsInvocationsCreateUrl(projectId, id), {
        ...options,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        body: JSON.stringify(hogFlowInvocationApi),
    })
}

export const getInsightsFlowsLogsRetrieveUrl = (projectId: string, id: string, params?: InsightsFlowsLogsRetrieveParams) => {
    const normalizedParams = new URLSearchParams()

    Object.entries(params || {}).forEach(([key, value]) => {
        if (value !== undefined) {
            normalizedParams.append(key, value === null ? 'null' : String(value))
        }
    })

    const stringifiedParams = normalizedParams.toString()

    return stringifiedParams.length > 0
        ? `/api/projects/${projectId}/hog_flows/${id}/logs/?${stringifiedParams}`
        : `/api/projects/${projectId}/hog_flows/${id}/logs/`
}

export const hogFlowsLogsRetrieve = async (
    projectId: string,
    id: string,
    params?: InsightsFlowsLogsRetrieveParams,
    options?: RequestInit
): Promise<void> => {
    return apiMutator<void>(getInsightsFlowsLogsRetrieveUrl(projectId, id, params), {
        ...options,
        method: 'GET',
    })
}

export const getInsightsFlowsMetricsRetrieveUrl = (
    projectId: string,
    id: string,
    params?: InsightsFlowsMetricsRetrieveParams
) => {
    const normalizedParams = new URLSearchParams()

    Object.entries(params || {}).forEach(([key, value]) => {
        if (value !== undefined) {
            normalizedParams.append(key, value === null ? 'null' : String(value))
        }
    })

    const stringifiedParams = normalizedParams.toString()

    return stringifiedParams.length > 0
        ? `/api/projects/${projectId}/hog_flows/${id}/metrics/?${stringifiedParams}`
        : `/api/projects/${projectId}/hog_flows/${id}/metrics/`
}

export const hogFlowsMetricsRetrieve = async (
    projectId: string,
    id: string,
    params?: InsightsFlowsMetricsRetrieveParams,
    options?: RequestInit
): Promise<AppMetricsResponseApi> => {
    return apiMutator<AppMetricsResponseApi>(getInsightsFlowsMetricsRetrieveUrl(projectId, id, params), {
        ...options,
        method: 'GET',
    })
}

export const getInsightsFlowsMetricsTotalsRetrieveUrl = (
    projectId: string,
    id: string,
    params?: InsightsFlowsMetricsTotalsRetrieveParams
) => {
    const normalizedParams = new URLSearchParams()

    Object.entries(params || {}).forEach(([key, value]) => {
        if (value !== undefined) {
            normalizedParams.append(key, value === null ? 'null' : String(value))
        }
    })

    const stringifiedParams = normalizedParams.toString()

    return stringifiedParams.length > 0
        ? `/api/projects/${projectId}/hog_flows/${id}/metrics/totals/?${stringifiedParams}`
        : `/api/projects/${projectId}/hog_flows/${id}/metrics/totals/`
}

export const hogFlowsMetricsTotalsRetrieve = async (
    projectId: string,
    id: string,
    params?: InsightsFlowsMetricsTotalsRetrieveParams,
    options?: RequestInit
): Promise<AppMetricsTotalsResponseApi> => {
    return apiMutator<AppMetricsTotalsResponseApi>(getInsightsFlowsMetricsTotalsRetrieveUrl(projectId, id, params), {
        ...options,
        method: 'GET',
    })
}

export const getInsightsFlowsPublishCreateUrl = (projectId: string, id: string) => {
    return `/api/projects/${projectId}/hog_flows/${id}/publish/`
}

export const hogFlowsPublishCreate = async (
    projectId: string,
    id: string,
    hogFlowPublishRequestApi?: InsightsFlowPublishRequestApi,
    options?: RequestInit
): Promise<InsightsFlowPublishResponseApi> => {
    return apiMutator<InsightsFlowPublishResponseApi>(getInsightsFlowsPublishCreateUrl(projectId, id), {
        ...options,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        body: JSON.stringify(hogFlowPublishRequestApi),
    })
}

export const getInsightsFlowsRerunCreateUrl = (projectId: string, id: string) => {
    return `/api/projects/${projectId}/hog_flows/${id}/rerun/`
}

/**
 * Rerun past invocations of this script flow from their stored payloads.
 *
 * Same shape and semantics as the script function rerun endpoint —
 * proxies through to the CDP worker, which reads matching rows from
 * Datastore, rehydrates from `invocation_globals`, and re-enqueues
 * onto cyclotron with `is_retry=1`.
 *
 * Because rerun replays historical event/person/group data, it requires
 * `person:read` and `group:read` on top of `hog_flow:write`.
 */
export const hogFlowsRerunCreate = async (
    projectId: string,
    id: string,
    hogInvocationRerunRequestApi: HogInvocationRerunRequestApi,
    options?: RequestInit
): Promise<HogInvocationRerunResponseApi> => {
    return apiMutator<HogInvocationRerunResponseApi>(getInsightsFlowsRerunCreateUrl(projectId, id), {
        ...options,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        body: JSON.stringify(hogInvocationRerunRequestApi),
    })
}

export const getInsightsFlowsRevisionsListUrl = (projectId: string, id: string, params?: InsightsFlowsRevisionsListParams) => {
    const normalizedParams = new URLSearchParams()

    Object.entries(params || {}).forEach(([key, value]) => {
        if (value !== undefined) {
            normalizedParams.append(key, value === null ? 'null' : String(value))
        }
    })

    const stringifiedParams = normalizedParams.toString()

    return stringifiedParams.length > 0
        ? `/api/projects/${projectId}/hog_flows/${id}/revisions/?${stringifiedParams}`
        : `/api/projects/${projectId}/hog_flows/${id}/revisions/`
}

export const hogFlowsRevisionsList = async (
    projectId: string,
    id: string,
    params?: InsightsFlowsRevisionsListParams,
    options?: RequestInit
): Promise<PaginatedInsightsFlowRevisionBasicListApi> => {
    return apiMutator<PaginatedInsightsFlowRevisionBasicListApi>(getInsightsFlowsRevisionsListUrl(projectId, id, params), {
        ...options,
        method: 'GET',
    })
}

export const getInsightsFlowsRevisionsRetrieveUrl = (projectId: string, id: string, version: number) => {
    return `/api/projects/${projectId}/hog_flows/${id}/revisions/${version}/`
}

export const hogFlowsRevisionsRetrieve = async (
    projectId: string,
    id: string,
    version: number,
    options?: RequestInit
): Promise<InsightsFlowRevisionApi> => {
    return apiMutator<InsightsFlowRevisionApi>(getInsightsFlowsRevisionsRetrieveUrl(projectId, id, version), {
        ...options,
        method: 'GET',
    })
}

export const getInsightsFlowsRevisionsRestoreCreateUrl = (projectId: string, id: string, version: number) => {
    return `/api/projects/${projectId}/hog_flows/${id}/revisions/${version}/restore/`
}

export const hogFlowsRevisionsRestoreCreate = async (
    projectId: string,
    id: string,
    version: number,
    hogFlowRevisionRestoreRequestApi?: InsightsFlowRevisionRestoreRequestApi,
    options?: RequestInit
): Promise<InsightsFlowApi> => {
    return apiMutator<InsightsFlowApi>(getInsightsFlowsRevisionsRestoreCreateUrl(projectId, id, version), {
        ...options,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        body: JSON.stringify(hogFlowRevisionRestoreRequestApi),
    })
}

export const getInsightsFlowsSchedulesListUrl = (projectId: string, id: string) => {
    return `/api/projects/${projectId}/hog_flows/${id}/schedules/`
}

export const hogFlowsSchedulesList = async (
    projectId: string,
    id: string,
    options?: RequestInit
): Promise<InsightsFlowScheduleApi[]> => {
    return apiMutator<InsightsFlowScheduleApi[]>(getInsightsFlowsSchedulesListUrl(projectId, id), {
        ...options,
        method: 'GET',
    })
}

export const getInsightsFlowsSchedulesCreateUrl = (projectId: string, id: string) => {
    return `/api/projects/${projectId}/hog_flows/${id}/schedules/`
}

export const hogFlowsSchedulesCreate = async (
    projectId: string,
    id: string,
    hogFlowScheduleApi: NonReadonly<InsightsFlowScheduleApi>,
    options?: RequestInit
): Promise<InsightsFlowScheduleApi> => {
    return apiMutator<InsightsFlowScheduleApi>(getInsightsFlowsSchedulesCreateUrl(projectId, id), {
        ...options,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        body: JSON.stringify(hogFlowScheduleApi),
    })
}

export const getInsightsFlowsSchedulesPartialUpdateUrl = (projectId: string, id: string, scheduleId: string) => {
    return `/api/projects/${projectId}/hog_flows/${id}/schedules/${scheduleId}/`
}

export const hogFlowsSchedulesPartialUpdate = async (
    projectId: string,
    id: string,
    scheduleId: string,
    patchedInsightsFlowScheduleApi?: NonReadonly<PatchedInsightsFlowScheduleApi>,
    options?: RequestInit
): Promise<InsightsFlowScheduleApi> => {
    return apiMutator<InsightsFlowScheduleApi>(getInsightsFlowsSchedulesPartialUpdateUrl(projectId, id, scheduleId), {
        ...options,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        body: JSON.stringify(patchedInsightsFlowScheduleApi),
    })
}

export const getInsightsFlowsSchedulesDestroyUrl = (projectId: string, id: string, scheduleId: string) => {
    return `/api/projects/${projectId}/hog_flows/${id}/schedules/${scheduleId}/`
}

export const hogFlowsSchedulesDestroy = async (
    projectId: string,
    id: string,
    scheduleId: string,
    options?: RequestInit
): Promise<void> => {
    return apiMutator<void>(getInsightsFlowsSchedulesDestroyUrl(projectId, id, scheduleId), {
        ...options,
        method: 'DELETE',
    })
}

export const getInsightsFlowsBulkDeleteCreateUrl = (projectId: string) => {
    return `/api/projects/${projectId}/hog_flows/bulk_delete/`
}

export const hogFlowsBulkDeleteCreate = async (
    projectId: string,
    hogFlowApi: NonReadonly<InsightsFlowApi>,
    options?: RequestInit
): Promise<InsightsFlowApi> => {
    return apiMutator<InsightsFlowApi>(getInsightsFlowsBulkDeleteCreateUrl(projectId), {
        ...options,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        body: JSON.stringify(hogFlowApi),
    })
}

export const getInsightsFlowsEmailSendingSuspensionRetrieveUrl = (projectId: string) => {
    return `/api/projects/${projectId}/hog_flows/email_sending_suspension/`
}

/**
 * Cheap read for the scene-wide suspension banner: single-row `TeamWorkflowsConfig` lookup
 * with no reputation computation. Every project member sees this — a suspension stops
 * everyone's email, so hiding it would leave silent send failures unexplained.
 */
export const hogFlowsEmailSendingSuspensionRetrieve = async (
    projectId: string,
    options?: RequestInit
): Promise<EmailSendingSuspensionStatusApi> => {
    return apiMutator<EmailSendingSuspensionStatusApi>(getInsightsFlowsEmailSendingSuspensionRetrieveUrl(projectId), {
        ...options,
        method: 'GET',
    })
}

export const getInsightsFlowsMetricsGlobalRetrieveUrl = (
    projectId: string,
    params?: InsightsFlowsMetricsGlobalRetrieveParams
) => {
    const normalizedParams = new URLSearchParams()

    Object.entries(params || {}).forEach(([key, value]) => {
        if (value !== undefined) {
            normalizedParams.append(key, value === null ? 'null' : String(value))
        }
    })

    const stringifiedParams = normalizedParams.toString()

    return stringifiedParams.length > 0
        ? `/api/projects/${projectId}/hog_flows/metrics/global/?${stringifiedParams}`
        : `/api/projects/${projectId}/hog_flows/metrics/global/`
}

export const hogFlowsMetricsGlobalRetrieve = async (
    projectId: string,
    params?: InsightsFlowsMetricsGlobalRetrieveParams,
    options?: RequestInit
): Promise<WorkflowStatsRowApi[]> => {
    return apiMutator<WorkflowStatsRowApi[]>(getInsightsFlowsMetricsGlobalRetrieveUrl(projectId, params), {
        ...options,
        method: 'GET',
    })
}

export const getInsightsFlowsReputationRetrieveUrl = (projectId: string, params?: InsightsFlowsReputationRetrieveParams) => {
    const normalizedParams = new URLSearchParams()

    Object.entries(params || {}).forEach(([key, value]) => {
        if (value !== undefined) {
            normalizedParams.append(key, value === null ? 'null' : String(value))
        }
    })

    const stringifiedParams = normalizedParams.toString()

    return stringifiedParams.length > 0
        ? `/api/projects/${projectId}/hog_flows/reputation/?${stringifiedParams}`
        : `/api/projects/${projectId}/hog_flows/reputation/`
}

/**
 * Bounce/complaint rates for this project's workflow email over the last 30 days, computed on
 * the fly from app metrics (a project-wide aggregate plus per-workflow rows, worst first,
 * capped), together with the authoritative AWS SES tenant verdict — sending status and open
 * reputation findings. Our rates are the per-workflow diagnosis; AWS judges and enforces.
 */
export const hogFlowsReputationRetrieve = async (
    projectId: string,
    params?: InsightsFlowsReputationRetrieveParams,
    options?: RequestInit
): Promise<TeamEmailReputationResponseApi> => {
    return apiMutator<TeamEmailReputationResponseApi>(getInsightsFlowsReputationRetrieveUrl(projectId, params), {
        ...options,
        method: 'GET',
    })
}

export const getInsightsFlowsUserBlastRadiusCreateUrl = (projectId: string) => {
    return `/api/projects/${projectId}/hog_flows/user_blast_radius/`
}

export const hogFlowsUserBlastRadiusCreate = async (
    projectId: string,
    blastRadiusRequestApi: BlastRadiusRequestApi,
    options?: RequestInit
): Promise<BlastRadiusApi> => {
    return apiMutator<BlastRadiusApi>(getInsightsFlowsUserBlastRadiusCreateUrl(projectId), {
        ...options,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        body: JSON.stringify(blastRadiusRequestApi),
    })
}

export const getInternalInsightsFlowsBatchJobsStatusUpdateUrl = (teamId: string, batchJobId: string) => {
    return `/api/projects/${teamId}/internal/hog_flows/batch_jobs/${batchJobId}/status`
}

/**
 * Internal endpoint for the Node-side batch resolver to write the terminal
 * status of a InsightsFlowBatchJob run. Idempotent: if the row is already in a
 * terminal status, returns 200 without re-writing — the resolver retries
 * this call via cyclotron retry semantics, so safe repeats are required.
 *
 * Accepts: { status: "completed" | "failed" }
 */
export const internalInsightsFlowsBatchJobsStatusUpdate = async (
    teamId: string,
    batchJobId: string,
    options?: RequestInit
): Promise<void> => {
    return apiMutator<void>(getInternalInsightsFlowsBatchJobsStatusUpdateUrl(teamId, batchJobId), {
        ...options,
        method: 'PUT',
    })
}

export const getInternalInsightsFlowsUserBlastRadiusCreateUrl = (teamId: string) => {
    return `/api/projects/${teamId}/internal/hog_flows/user_blast_radius`
}

/**
 * Internal endpoint for Node.js services to query user blast radius.
 * Requires Bearer token authentication via INTERNAL_API_SECRET.
 */
export const internalInsightsFlowsUserBlastRadiusCreate = async (teamId: string, options?: RequestInit): Promise<void> => {
    return apiMutator<void>(getInternalInsightsFlowsUserBlastRadiusCreateUrl(teamId), {
        ...options,
        method: 'POST',
    })
}

export const getInternalInsightsFlowsUserBlastRadiusPersonsCreateUrl = (teamId: string) => {
    return `/api/projects/${teamId}/internal/hog_flows/user_blast_radius_persons`
}

/**
 * Internal endpoint for Node.js services to query user blast radius persons with pagination.
 * Requires Bearer token authentication via INTERNAL_API_SECRET.
 */
export const internalInsightsFlowsUserBlastRadiusPersonsCreate = async (
    teamId: string,
    options?: RequestInit
): Promise<void> => {
    return apiMutator<void>(getInternalInsightsFlowsUserBlastRadiusPersonsCreateUrl(teamId), {
        ...options,
        method: 'POST',
    })
}
