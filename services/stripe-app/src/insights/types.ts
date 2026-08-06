// Insights API response types. Keep in sync with:
//   - frontend/src/queries/schema/schema-general.ts (WebOverviewItem)
//   - insights/api/feature_flag.py / insights/api/experiment.py

// -- Feature flags --

export interface InsightsFlagProperty {
    key: string
    value?: string | number | boolean | Array<string | number>
    operator?: string
    type?: 'event' | 'person' | 'group' | 'cohort' | 'element' | 'insightsql' | 'session' | 'behavioral'
    negation?: boolean
}

export interface InsightsFlagGroup {
    properties?: InsightsFlagProperty[]
    rollout_percentage?: number | null
    variant?: string | null
}

export interface InsightsFlagVariant {
    key: string
    name?: string
    rollout_percentage: number
}

export interface InsightsFeatureFlag {
    id: number
    key: string
    name: string
    active: boolean
    deleted: boolean
    rollout_percentage: number | null
    filters?: {
        groups?: InsightsFlagGroup[]
        multivariate?: { variants: InsightsFlagVariant[] } | null
        payloads?: Record<string, unknown>
        aggregation_group_type_index?: number
    }
    created_at: string
    updated_at: string
    status: string
    tags: string[]
    experiment_set: number[]
}

// -- Experiments --

export interface InsightsExperiment {
    id: number
    name: string
    description: string | null
    start_date: string | null
    end_date: string | null
    feature_flag_key: string
    archived: boolean
    created_at: string
    updated_at: string
    parameters?: {
        recommended_sample_size?: number
        minimum_detectable_effect?: number
    }
}

// -- Customer journeys --

export interface InsightsCustomerJourney {
    id: string
    insight: number
    name: string
    description: string | null
    created_at: string
    updated_at: string | null
}

// -- Insights / Funnels --

export interface FunnelStepResult {
    action_id: string
    name: string
    custom_name?: string | null
    order: number
    count: number
}

export interface InsightsInsight {
    id: number
    name: string | null
    result?: FunnelStepResult[] | null
    query?: {
        kind?: string
        source?: {
            kind?: string
            series?: Array<{
                kind?: string
                event?: string
                name?: string
                custom_name?: string
            }>
            [key: string]: unknown
        }
        [key: string]: unknown
    }
}

// -- Web analytics --

export interface WebOverviewItem {
    key: string
    value?: number
    previous?: number
    kind: 'unit' | 'duration_s' | 'percentage' | 'currency'
    changeFromPreviousPct?: number
    isIncreaseBad?: boolean
}

// -- Generic --

export interface ListResponse<T> {
    count?: number
    next?: string | null
    previous?: string | null
    results: T[]
}
