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
    DigestChannelApi,
    DigestRunApi,
    PaginatedDigestChannelListApi,
    PaginatedDigestRunListApi,
    PaginatedReviewRunListApi,
    PaginatedStampPullRequestListApi,
    PaginatedStampRepoConfigListApi,
    PatchedDigestChannelApi,
    PatchedStampRepoConfigApi,
    ReviewRunApi,
    StampDigestChannelsListParams,
    StampDigestRunsListParams,
    StampInstallInfoApi,
    StampPullRequestApi,
    StampPullRequestsListParams,
    StampRepoConfigApi,
    StampRepoConfigsListParams,
    StampReviewRunsListParams,
    StampSyncInstallationRequestApi,
    StampSyncInstallationResponseApi,
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

export const getStampDigestChannelsListUrl = (projectId: string, params?: StampDigestChannelsListParams) => {
    const normalizedParams = new URLSearchParams()

    Object.entries(params || {}).forEach(([key, value]) => {
        if (value !== undefined) {
            normalizedParams.append(key, value === null ? 'null' : String(value))
        }
    })

    const stringifiedParams = normalizedParams.toString()

    return stringifiedParams.length > 0
        ? `/api/projects/${projectId}/stamp/digest_channels/?${stringifiedParams}`
        : `/api/projects/${projectId}/stamp/digest_channels/`
}

/**
 * Per-audience Slack destinations for the daily merged-PR digest.
 */
export const stampDigestChannelsList = async (
    projectId: string,
    params?: StampDigestChannelsListParams,
    options?: RequestInit
): Promise<PaginatedDigestChannelListApi> => {
    return apiMutator<PaginatedDigestChannelListApi>(getStampDigestChannelsListUrl(projectId, params), {
        ...options,
        method: 'GET',
    })
}

export const getStampDigestChannelsCreateUrl = (projectId: string) => {
    return `/api/projects/${projectId}/stamp/digest_channels/`
}

/**
 * Per-audience Slack destinations for the daily merged-PR digest.
 */
export const stampDigestChannelsCreate = async (
    projectId: string,
    digestChannelApi: NonReadonly<DigestChannelApi>,
    options?: RequestInit
): Promise<DigestChannelApi> => {
    return apiMutator<DigestChannelApi>(getStampDigestChannelsCreateUrl(projectId), {
        ...options,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        body: JSON.stringify(digestChannelApi),
    })
}

export const getStampDigestChannelsRetrieveUrl = (projectId: string, id: string) => {
    return `/api/projects/${projectId}/stamp/digest_channels/${id}/`
}

/**
 * Per-audience Slack destinations for the daily merged-PR digest.
 */
export const stampDigestChannelsRetrieve = async (
    projectId: string,
    id: string,
    options?: RequestInit
): Promise<DigestChannelApi> => {
    return apiMutator<DigestChannelApi>(getStampDigestChannelsRetrieveUrl(projectId, id), {
        ...options,
        method: 'GET',
    })
}

export const getStampDigestChannelsUpdateUrl = (projectId: string, id: string) => {
    return `/api/projects/${projectId}/stamp/digest_channels/${id}/`
}

/**
 * Per-audience Slack destinations for the daily merged-PR digest.
 */
export const stampDigestChannelsUpdate = async (
    projectId: string,
    id: string,
    digestChannelApi: NonReadonly<DigestChannelApi>,
    options?: RequestInit
): Promise<DigestChannelApi> => {
    return apiMutator<DigestChannelApi>(getStampDigestChannelsUpdateUrl(projectId, id), {
        ...options,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        body: JSON.stringify(digestChannelApi),
    })
}

export const getStampDigestChannelsPartialUpdateUrl = (projectId: string, id: string) => {
    return `/api/projects/${projectId}/stamp/digest_channels/${id}/`
}

/**
 * Per-audience Slack destinations for the daily merged-PR digest.
 */
export const stampDigestChannelsPartialUpdate = async (
    projectId: string,
    id: string,
    patchedDigestChannelApi?: NonReadonly<PatchedDigestChannelApi>,
    options?: RequestInit
): Promise<DigestChannelApi> => {
    return apiMutator<DigestChannelApi>(getStampDigestChannelsPartialUpdateUrl(projectId, id), {
        ...options,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        body: JSON.stringify(patchedDigestChannelApi),
    })
}

export const getStampDigestChannelsDestroyUrl = (projectId: string, id: string) => {
    return `/api/projects/${projectId}/stamp/digest_channels/${id}/`
}

/**
 * Per-audience Slack destinations for the daily merged-PR digest.
 */
export const stampDigestChannelsDestroy = async (
    projectId: string,
    id: string,
    options?: RequestInit
): Promise<void> => {
    return apiMutator<void>(getStampDigestChannelsDestroyUrl(projectId, id), {
        ...options,
        method: 'DELETE',
    })
}

export const getStampDigestRunsListUrl = (projectId: string, params?: StampDigestRunsListParams) => {
    const normalizedParams = new URLSearchParams()

    Object.entries(params || {}).forEach(([key, value]) => {
        if (value !== undefined) {
            normalizedParams.append(key, value === null ? 'null' : String(value))
        }
    })

    const stringifiedParams = normalizedParams.toString()

    return stringifiedParams.length > 0
        ? `/api/projects/${projectId}/stamp/digest_runs/?${stringifiedParams}`
        : `/api/projects/${projectId}/stamp/digest_runs/`
}

/**
 * Read-only history of posted (or attempted) digests, filterable by digest channel.
 */
export const stampDigestRunsList = async (
    projectId: string,
    params?: StampDigestRunsListParams,
    options?: RequestInit
): Promise<PaginatedDigestRunListApi> => {
    return apiMutator<PaginatedDigestRunListApi>(getStampDigestRunsListUrl(projectId, params), {
        ...options,
        method: 'GET',
    })
}

export const getStampDigestRunsRetrieveUrl = (projectId: string, id: string) => {
    return `/api/projects/${projectId}/stamp/digest_runs/${id}/`
}

/**
 * Read-only history of posted (or attempted) digests, filterable by digest channel.
 */
export const stampDigestRunsRetrieve = async (
    projectId: string,
    id: string,
    options?: RequestInit
): Promise<DigestRunApi> => {
    return apiMutator<DigestRunApi>(getStampDigestRunsRetrieveUrl(projectId, id), {
        ...options,
        method: 'GET',
    })
}

export const getStampPullRequestsListUrl = (projectId: string, params?: StampPullRequestsListParams) => {
    const normalizedParams = new URLSearchParams()

    Object.entries(params || {}).forEach(([key, value]) => {
        if (value !== undefined) {
            normalizedParams.append(key, value === null ? 'null' : String(value))
        }
    })

    const stringifiedParams = normalizedParams.toString()

    return stringifiedParams.length > 0
        ? `/api/projects/${projectId}/stamp/pull_requests/?${stringifiedParams}`
        : `/api/projects/${projectId}/stamp/pull_requests/`
}

/**
 * Read-only pull requests stamp knows about, filterable by PR number and merge state.
 */
export const stampPullRequestsList = async (
    projectId: string,
    params?: StampPullRequestsListParams,
    options?: RequestInit
): Promise<PaginatedStampPullRequestListApi> => {
    return apiMutator<PaginatedStampPullRequestListApi>(getStampPullRequestsListUrl(projectId, params), {
        ...options,
        method: 'GET',
    })
}

export const getStampPullRequestsRetrieveUrl = (projectId: string, id: string) => {
    return `/api/projects/${projectId}/stamp/pull_requests/${id}/`
}

/**
 * Read-only pull requests stamp knows about, filterable by PR number and merge state.
 */
export const stampPullRequestsRetrieve = async (
    projectId: string,
    id: string,
    options?: RequestInit
): Promise<StampPullRequestApi> => {
    return apiMutator<StampPullRequestApi>(getStampPullRequestsRetrieveUrl(projectId, id), {
        ...options,
        method: 'GET',
    })
}

export const getStampRepoConfigsListUrl = (projectId: string, params?: StampRepoConfigsListParams) => {
    const normalizedParams = new URLSearchParams()

    Object.entries(params || {}).forEach(([key, value]) => {
        if (value !== undefined) {
            normalizedParams.append(key, value === null ? 'null' : String(value))
        }
    })

    const stringifiedParams = normalizedParams.toString()

    return stringifiedParams.length > 0
        ? `/api/projects/${projectId}/stamp/repo_configs/?${stringifiedParams}`
        : `/api/projects/${projectId}/stamp/repo_configs/`
}

/**
 * Per-repo stamp settings — enable/disable review, GitHub App installation, policy overrides.
 */
export const stampRepoConfigsList = async (
    projectId: string,
    params?: StampRepoConfigsListParams,
    options?: RequestInit
): Promise<PaginatedStampRepoConfigListApi> => {
    return apiMutator<PaginatedStampRepoConfigListApi>(getStampRepoConfigsListUrl(projectId, params), {
        ...options,
        method: 'GET',
    })
}

export const getStampRepoConfigsCreateUrl = (projectId: string) => {
    return `/api/projects/${projectId}/stamp/repo_configs/`
}

/**
 * Per-repo stamp settings — enable/disable review, GitHub App installation, policy overrides.
 */
export const stampRepoConfigsCreate = async (
    projectId: string,
    stampRepoConfigApi: NonReadonly<StampRepoConfigApi>,
    options?: RequestInit
): Promise<StampRepoConfigApi> => {
    return apiMutator<StampRepoConfigApi>(getStampRepoConfigsCreateUrl(projectId), {
        ...options,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        body: JSON.stringify(stampRepoConfigApi),
    })
}

export const getStampRepoConfigsRetrieveUrl = (projectId: string, id: string) => {
    return `/api/projects/${projectId}/stamp/repo_configs/${id}/`
}

/**
 * Per-repo stamp settings — enable/disable review, GitHub App installation, policy overrides.
 */
export const stampRepoConfigsRetrieve = async (
    projectId: string,
    id: string,
    options?: RequestInit
): Promise<StampRepoConfigApi> => {
    return apiMutator<StampRepoConfigApi>(getStampRepoConfigsRetrieveUrl(projectId, id), {
        ...options,
        method: 'GET',
    })
}

export const getStampRepoConfigsUpdateUrl = (projectId: string, id: string) => {
    return `/api/projects/${projectId}/stamp/repo_configs/${id}/`
}

/**
 * Per-repo stamp settings — enable/disable review, GitHub App installation, policy overrides.
 */
export const stampRepoConfigsUpdate = async (
    projectId: string,
    id: string,
    stampRepoConfigApi: NonReadonly<StampRepoConfigApi>,
    options?: RequestInit
): Promise<StampRepoConfigApi> => {
    return apiMutator<StampRepoConfigApi>(getStampRepoConfigsUpdateUrl(projectId, id), {
        ...options,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        body: JSON.stringify(stampRepoConfigApi),
    })
}

export const getStampRepoConfigsPartialUpdateUrl = (projectId: string, id: string) => {
    return `/api/projects/${projectId}/stamp/repo_configs/${id}/`
}

/**
 * Per-repo stamp settings — enable/disable review, GitHub App installation, policy overrides.
 */
export const stampRepoConfigsPartialUpdate = async (
    projectId: string,
    id: string,
    patchedStampRepoConfigApi?: NonReadonly<PatchedStampRepoConfigApi>,
    options?: RequestInit
): Promise<StampRepoConfigApi> => {
    return apiMutator<StampRepoConfigApi>(getStampRepoConfigsPartialUpdateUrl(projectId, id), {
        ...options,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        body: JSON.stringify(patchedStampRepoConfigApi),
    })
}

export const getStampRepoConfigsDestroyUrl = (projectId: string, id: string) => {
    return `/api/projects/${projectId}/stamp/repo_configs/${id}/`
}

/**
 * Per-repo stamp settings — enable/disable review, GitHub App installation, policy overrides.
 */
export const stampRepoConfigsDestroy = async (
    projectId: string,
    id: string,
    options?: RequestInit
): Promise<void> => {
    return apiMutator<void>(getStampRepoConfigsDestroyUrl(projectId, id), {
        ...options,
        method: 'DELETE',
    })
}

export const getStampRepoConfigsInstallInfoRetrieveUrl = (projectId: string) => {
    return `/api/projects/${projectId}/stamp/repo_configs/install_info/`
}

/**
 * Per-repo stamp settings — enable/disable review, GitHub App installation, policy overrides.
 */
export const stampRepoConfigsInstallInfoRetrieve = async (
    projectId: string,
    options?: RequestInit
): Promise<StampInstallInfoApi> => {
    return apiMutator<StampInstallInfoApi>(getStampRepoConfigsInstallInfoRetrieveUrl(projectId), {
        ...options,
        method: 'GET',
    })
}

export const getStampRepoConfigsSyncInstallationCreateUrl = (projectId: string) => {
    return `/api/projects/${projectId}/stamp/repo_configs/sync_installation/`
}

/**
 * Per-repo stamp settings — enable/disable review, GitHub App installation, policy overrides.
 */
export const stampRepoConfigsSyncInstallationCreate = async (
    projectId: string,
    stampSyncInstallationRequestApi: StampSyncInstallationRequestApi,
    options?: RequestInit
): Promise<StampSyncInstallationResponseApi> => {
    return apiMutator<StampSyncInstallationResponseApi>(getStampRepoConfigsSyncInstallationCreateUrl(projectId), {
        ...options,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        body: JSON.stringify(stampSyncInstallationRequestApi),
    })
}

export const getStampReviewRunsListUrl = (projectId: string, params?: StampReviewRunsListParams) => {
    const normalizedParams = new URLSearchParams()

    Object.entries(params || {}).forEach(([key, value]) => {
        if (value !== undefined) {
            normalizedParams.append(key, value === null ? 'null' : String(value))
        }
    })

    const stringifiedParams = normalizedParams.toString()

    return stringifiedParams.length > 0
        ? `/api/projects/${projectId}/stamp/review_runs/?${stringifiedParams}`
        : `/api/projects/${projectId}/stamp/review_runs/`
}

/**
 * Read-only history of stamp review runs, filterable by repository, PR number, and status.
 */
export const stampReviewRunsList = async (
    projectId: string,
    params?: StampReviewRunsListParams,
    options?: RequestInit
): Promise<PaginatedReviewRunListApi> => {
    return apiMutator<PaginatedReviewRunListApi>(getStampReviewRunsListUrl(projectId, params), {
        ...options,
        method: 'GET',
    })
}

export const getStampReviewRunsRetrieveUrl = (projectId: string, id: string) => {
    return `/api/projects/${projectId}/stamp/review_runs/${id}/`
}

/**
 * Read-only history of stamp review runs, filterable by repository, PR number, and status.
 */
export const stampReviewRunsRetrieve = async (
    projectId: string,
    id: string,
    options?: RequestInit
): Promise<ReviewRunApi> => {
    return apiMutator<ReviewRunApi>(getStampReviewRunsRetrieveUrl(projectId, id), {
        ...options,
        method: 'GET',
    })
}
