/**
 * Auto-generated from the Django backend OpenAPI schema.
 * To modify these types, update the Django serializers or views, then run:
 *   insightscli build:openapi
 * Questions or issues? #team-devex on Slack
 *
 * Insights API - generated
 * OpenAPI spec version: 1.0.0
 */
/**
 * * `team` - Only team
 * * `organization` - Organization
 * * `global` - Global
 */
export type InsightsFlowTemplateScopeEnumApi = (typeof InsightsFlowTemplateScopeEnumApi)[keyof typeof InsightsFlowTemplateScopeEnumApi]

export const InsightsFlowTemplateScopeEnumApi = {
    Team: 'team',
    Organization: 'organization',
    Global: 'global',
} as const

export interface InsightsFlowMaskingApi {
    /**
     * Seconds (60 to ~94M / 3y) to suppress repeat firings of the same hash.
     * @minimum 60
     * @maximum 94608000
     * @nullable
     */
    ttl?: number | null
    /**
     * Fire once per N matches of the same hash within ttl — a sampler: N=3 fires on the 1st, 4th, 7th… match. Omit to fire on the first match, then suppress repeats within ttl.
     * @nullable
     */
    threshold?: number | null
    /** InsightsQL template defining the dedup/grouping key, e.g. '{person.id}' (once per person) within ttl. */
    hash: string
    /** Auto-compiled from hash. Do not set. */
    bytecode?: unknown
}

/**
 * * `exit_on_conversion` - Conversion
 * * `exit_on_trigger_not_matched` - Trigger Not Matched
 * * `exit_on_trigger_not_matched_or_conversion` - Trigger Not Matched Or Conversion
 * * `exit_only_at_end` - Only At End
 */
export type ExitConditionEnumApi = (typeof ExitConditionEnumApi)[keyof typeof ExitConditionEnumApi]

export const ExitConditionEnumApi = {
    ExitOnConversion: 'exit_on_conversion',
    ExitOnTriggerNotMatched: 'exit_on_trigger_not_matched',
    ExitOnTriggerNotMatchedOrConversion: 'exit_on_trigger_not_matched_or_conversion',
    ExitOnlyAtEnd: 'exit_only_at_end',
} as const

/**
 * * `continue` - continue
 * * `abort` - abort
 */
export type OnErrorEnumApi = (typeof OnErrorEnumApi)[keyof typeof OnErrorEnumApi]

export const OnErrorEnumApi = {
    Continue: 'continue',
    Abort: 'abort',
} as const

/**
 * * `events` - events
 * * `person-updates` - person-updates
 * * `data-warehouse-table` - data-warehouse-table
 */
export type InsightsFunctionFiltersSourceEnumApi =
    (typeof InsightsFunctionFiltersSourceEnumApi)[keyof typeof InsightsFunctionFiltersSourceEnumApi]

export const InsightsFunctionFiltersSourceEnumApi = {
    Events: 'events',
    PersonUpdates: 'person-updates',
    DataWarehouseTable: 'data-warehouse-table',
} as const

export type InsightsFunctionFiltersApiActionsItem = { [key: string]: unknown }

export type InsightsFunctionFiltersApiEventsItem = { [key: string]: unknown }

export type InsightsFunctionFiltersApiDataWarehouseItem = { [key: string]: unknown }

export type InsightsFunctionFiltersApiPropertiesItem = { [key: string]: unknown }

export interface InsightsFunctionFiltersApi {
    source?: InsightsFunctionFiltersSourceEnumApi
    actions?: InsightsFunctionFiltersApiActionsItem[]
    events?: InsightsFunctionFiltersApiEventsItem[]
    data_warehouse?: InsightsFunctionFiltersApiDataWarehouseItem[]
    properties?: InsightsFunctionFiltersApiPropertiesItem[]
    bytecode?: unknown
    transpiled?: unknown
    filter_test_accounts?: boolean
    bytecode_error?: string
}

/**
 * Custom action serializer for templates that skips input validation
 * (since templates should have default/empty values).
 */
export interface InsightsFlowTemplateActionApi {
    id: string
    /** @maxLength 400 */
    name: string
    description?: string
    /** On failure: continue (skip the action and proceed) or abort (stop the run).
     *
     * * `continue` - continue
     * * `abort` - abort */
    on_error?: OnErrorEnumApi | null
    created_at?: number
    updated_at?: number
    filters?: InsightsFunctionFiltersApi | null
    /** @maxLength 100 */
    type: string
    config: unknown
    output_variable?: unknown
}

/**
 * @nullable
 */
export type InsightsFlowTemplateApiCreatedBy = { [key: string]: unknown } | null

/**
 * Variable: {key, type: string|number|boolean, default}.
 */
export type InsightsFlowTemplateApiVariablesItem = { [key: string]: string }

/**
 * Serializer for creating script flow templates.
 * Validates and sanitizes the workflow before creating it as a template.
 */
export interface InsightsFlowTemplateApi {
    readonly id: string
    /** @maxLength 400 */
    name: string
    description?: string
    /**
     * @maxLength 8201
     * @nullable
     */
    image_url?: string | null
    tags?: string[]
    scope: InsightsFlowTemplateScopeEnumApi
    readonly created_at: string
    /** @nullable */
    readonly created_by: InsightsFlowTemplateApiCreatedBy
    readonly updated_at: string
    trigger?: unknown
    trigger_masking?: InsightsFlowMaskingApi | null
    conversion?: unknown
    exit_condition?: ExitConditionEnumApi
    edges?: unknown
    actions: InsightsFlowTemplateActionApi[]
    /**
     * @maxLength 400
     * @nullable
     */
    abort_action?: string | null
    variables?: InsightsFlowTemplateApiVariablesItem[]
}

export interface PaginatedInsightsFlowTemplateListApi {
    count: number
    /** @nullable */
    next?: string | null
    /** @nullable */
    previous?: string | null
    results: InsightsFlowTemplateApi[]
}

/**
 * @nullable
 */
export type PatchedInsightsFlowTemplateApiCreatedBy = { [key: string]: unknown } | null

/**
 * Variable: {key, type: string|number|boolean, default}.
 */
export type PatchedInsightsFlowTemplateApiVariablesItem = { [key: string]: string }

/**
 * Serializer for creating script flow templates.
 * Validates and sanitizes the workflow before creating it as a template.
 */
export interface PatchedInsightsFlowTemplateApi {
    readonly id?: string
    /** @maxLength 400 */
    name?: string
    description?: string
    /**
     * @maxLength 8201
     * @nullable
     */
    image_url?: string | null
    tags?: string[]
    scope?: InsightsFlowTemplateScopeEnumApi
    readonly created_at?: string
    /** @nullable */
    readonly created_by?: PatchedInsightsFlowTemplateApiCreatedBy
    readonly updated_at?: string
    trigger?: unknown
    trigger_masking?: InsightsFlowMaskingApi | null
    conversion?: unknown
    exit_condition?: ExitConditionEnumApi
    edges?: unknown
    actions?: InsightsFlowTemplateActionApi[]
    /**
     * @maxLength 400
     * @nullable
     */
    abort_action?: string | null
    variables?: PatchedInsightsFlowTemplateApiVariablesItem[]
}

/**
 * * `draft` - Draft
 * * `active` - Active
 * * `archived` - Archived
 */
export type InsightsFlowStatusEnumApi = (typeof InsightsFlowStatusEnumApi)[keyof typeof InsightsFlowStatusEnumApi]

export const InsightsFlowStatusEnumApi = {
    Draft: 'draft',
    Active: 'active',
    Archived: 'archived',
} as const

/**
 * * `engineering` - Engineering
 * * `data` - Data
 * * `product` - Product Management
 * * `founder` - Founder
 * * `leadership` - Leadership
 * * `marketing` - Marketing
 * * `sales` - Sales / Success
 * * `other` - Other
 */
export type RoleAtOrganizationEnumApi = (typeof RoleAtOrganizationEnumApi)[keyof typeof RoleAtOrganizationEnumApi]

export const RoleAtOrganizationEnumApi = {
    Engineering: 'engineering',
    Data: 'data',
    Product: 'product',
    Founder: 'founder',
    Leadership: 'leadership',
    Marketing: 'marketing',
    Sales: 'sales',
    Other: 'other',
} as const

export type BlankEnumApi = (typeof BlankEnumApi)[keyof typeof BlankEnumApi]

export const BlankEnumApi = {
    '': '',
} as const

/**
 * @nullable
 */
export type UserBasicApiMascotConfig = { [key: string]: unknown } | null

export interface UserBasicApi {
    readonly id: number
    readonly uuid: string
    /**
     * @maxLength 200
     * @nullable
     */
    distinct_id?: string | null
    /** @maxLength 150 */
    first_name?: string
    /** @maxLength 150 */
    last_name?: string
    /** @maxLength 254 */
    email: string
    /** @nullable */
    is_email_verified?: boolean | null
    /** @nullable */
    readonly mascot_config: UserBasicApiMascotConfig
    role_at_organization?: RoleAtOrganizationEnumApi | BlankEnumApi | null
}

/**
 * Mixin for serializers to add user access control fields
 */
export interface InsightsFlowMinimalApi {
    readonly id: string
    /** @nullable */
    readonly name: string | null
    readonly description: string
    readonly version: number
    readonly status: InsightsFlowStatusEnumApi
    readonly created_at: string
    readonly created_by: UserBasicApi
    readonly updated_at: string
    readonly trigger: unknown
    readonly trigger_masking: unknown
    readonly conversion: unknown
    readonly exit_condition: ExitConditionEnumApi
    readonly edges: unknown
    readonly actions: unknown
    /** @nullable */
    readonly abort_action: string | null
    readonly variables: unknown
    readonly billable_action_types: unknown
    /**
     * The effective access level the user has for this object
     * @nullable
     */
    readonly user_access_level: string | null
}

export interface PaginatedInsightsFlowMinimalListApi {
    count: number
    /** @nullable */
    next?: string | null
    /** @nullable */
    previous?: string | null
    results: InsightsFlowMinimalApi[]
}

/**
 * Variable: {key, type: string|number|boolean, default}.
 */
export type InsightsFlowApiVariablesItem = { [key: string]: string }

/**
 * Skip-forward map for deleted steps: {deleted_action_id: next surviving action_id}. Maintained automatically when a live graph edit deletes actions, so in-flight runs parked on a deleted step continue at its surviving successor instead of exiting. Null when no live deletions have occurred.
 * @nullable
 */
export type InsightsFlowApiActionRedirects = { [key: string]: string } | null

export interface InsightsFlowConversionEventApi {
    /** Event/action filters for this conversion event, same shape as trigger filters: {events: [{id, name, type: 'events', properties?: [<cond>]}], actions?: [...], properties?: [<cond>]}. bytecode is compiled server-side. */
    filters: InsightsFunctionFiltersApi
}

export type InsightsFlowConversionApiFiltersItem = { [key: string]: unknown }

export interface InsightsFlowConversionApi {
    /** Property-based conversion conditions, as an ARRAY of property filters: [{key, value, operator, type: event|person|group}, ...]. Event-based goals do NOT go here — put them in 'events'. Empty array = any event within the window converts. */
    filters?: InsightsFlowConversionApiFiltersItem[]
    /** Event-based conversion goals: [{filters: {events: [{id, name, type: 'events'}], ...}}]. */
    events?: InsightsFlowConversionEventApi[]
    /**
     * Conversion window in minutes after a person enters the workflow. null = no explicit window.
     * @nullable
     */
    window_minutes?: number | null
    /** Compiled server-side from 'filters'. Do not set; ignored if sent. */
    bytecode?: unknown
}

/**
 * * `continue` - continue
 * * `branch` - branch
 */
export type InsightsFlowEdgeTypeEnumApi = (typeof InsightsFlowEdgeTypeEnumApi)[keyof typeof InsightsFlowEdgeTypeEnumApi]

export const InsightsFlowEdgeTypeEnumApi = {
    Continue: 'continue',
    Branch: 'branch',
} as const

export interface InsightsFlowEdgeApi {
    /** Target action id. */
    to: string
    /** continue: fall-through (sequential or the no-match path of conditional_branch). branch: requires 'index' matching config.conditions[index].
     *
     * * `continue` - continue
     * * `branch` - branch */
    type: InsightsFlowEdgeTypeEnumApi
    /** Required for type='branch'. conditional_branch: index into config.conditions[index]. random_cohort_branch: index into config.cohorts[index]. wait_until_condition: use index:0 — it advances via the index:0 branch edge when it resolves (a condition match or an events entry firing). */
    index?: number
    /** Source action id. */
    from: string
}

/**
 * * `trigger` - trigger
 * * `function` - function
 * * `function_email` - function_email
 * * `function_sms` - function_sms
 * * `function_push` - function_push
 * * `delay` - delay
 * * `wait_until_condition` - wait_until_condition
 * * `wait_until_time_window` - wait_until_time_window
 * * `conditional_branch` - conditional_branch
 * * `random_cohort_branch` - random_cohort_branch
 * * `exit` - exit
 */
export type InsightsFlowActionTypeEnumApi = (typeof InsightsFlowActionTypeEnumApi)[keyof typeof InsightsFlowActionTypeEnumApi]

export const InsightsFlowActionTypeEnumApi = {
    Trigger: 'trigger',
    Function: 'function',
    FunctionEmail: 'function_email',
    FunctionSms: 'function_sms',
    FunctionPush: 'function_push',
    Delay: 'delay',
    WaitUntilCondition: 'wait_until_condition',
    WaitUntilTimeWindow: 'wait_until_time_window',
    ConditionalBranch: 'conditional_branch',
    RandomCohortBranch: 'random_cohort_branch',
    Exit: 'exit',
} as const

/**
 * Type-specific config keyed by action type. trigger: {type: event|webhook|manual|batch|schedule|tracking_pixel, filters?}. webhook and manual triggers also require template_id: 'template-source-webhook', and tracking_pixel requires template_id: 'template-source-webhook-pixel'. filters shape: {events: [{id, name, type:'events', properties:[<cond>]}], properties:[<cond>], actions:[...], filter_test_accounts:<bool>}. <cond>: {key, value, operator, type: event|person|group}, or {key: 'id', type: 'cohort', value: <cohort_id>, operator: 'in'} to reference a cohort. function*: {template_id, inputs: {<key>: {value: <str>}}}. Wrap values in {value:...} to enable script templating ({person.x}, {event.x}); flat strings won't interpolate. function_email also accepts tracking_enabled?: <bool> (default true) - when false, no open pixel is injected, links are not rewritten, and the send skips ESP-level open/click tracking, so opens and clicks are not recorded for that step (delivery/bounce/unsubscribe still are). Dictionary input values are template strings too — write booleans/numbers as single-expression templates ('{true}', '{42}'), which evaluate to the typed value. delay: {delay_duration: '<number><unit>'} where unit is m|h|d. Fractions OK ('0.5m'=30s; seconds unsupported). Per-unit max m<=60, h<=24, d<=30; values above are SILENTLY CLAMPED. Max 30d. conditional_branch: {conditions: [{filters}, ...]}. Index N matches the 'branch' edge with index:N. random_cohort_branch: {cohorts: [{percentage: <number>, name?}, ...]}. Index N matches the 'branch' edge with index:N; percentages should sum to 100 (an unallocated remainder routes to the last cohort). wait_until_condition: {condition: {filters}, events?: [{filters: {events: [{id, name, type: 'events'}], actions?: [...]}, name?}], max_wait_duration: <duration>} (same rules as delay). Continues when condition.filters match OR any events entry fires; each events entry must target at least one event or action. On resolution (a condition match or any events entry firing) it advances via the 'branch' edge with index:0; the max_wait_duration timeout falls through the 'continue' edge. exit: {reason}.
 */
export type InsightsFlowActionApiConfig =
    | { [key: string]: unknown }
    | {
          /** Property-based wait condition; continues when the person matches. A condition with no property filters is ignored — the wait then relies on 'events' and the max_wait_duration timeout. */
          condition?: {
              /** Property conditions, e.g. {properties: [{key, value, operator, type}]}. */
              filters?: InsightsFunctionFiltersApi | null
              /** Optional display name. */
              name?: string
          }
          /** Events to wait for: continues when ANY entry fires (OR'd with 'condition'). Each entry: {filters: {events: [{id, name, type: 'events'}], actions?: [...]}, name?}. */
          events?: {
              /** Event/action filters; the workflow wakes when a matching event fires. Must target at least one event or action (entries targeting neither are dropped). */
              filters?: InsightsFunctionFiltersApi | null
              /** Optional display name. */
              name?: string
          }[]
          /** '<number><unit>' with unit m|h|d, e.g. '30m' (same rules as delay). */
          max_wait_duration: string
      }

export interface InsightsFlowActionApi {
    /**
     * Unique node ID within the workflow.
     * @maxLength 200
     */
    id: string
    /**
     * Display name.
     * @maxLength 400
     */
    name: string
    /** Optional description. */
    description?: string
    /** On failure: continue (skip the action and proceed) or abort (stop the run).
     *
     * * `continue` - continue
     * * `abort` - abort */
    on_error?: OnErrorEnumApi | null
    /** Created at (epoch ms). Frontend-managed. */
    created_at?: number
    /** Updated at (epoch ms). Frontend-managed. */
    updated_at?: number
    /** Property filters gating this action. */
    filters?: InsightsFunctionFiltersApi | null
    /** One of: trigger | function | function_email | function_sms | function_push | delay | wait_until_condition | wait_until_time_window | conditional_branch | random_cohort_branch | exit.
     *
     * * `trigger` - trigger
     * * `function` - function
     * * `function_email` - function_email
     * * `function_sms` - function_sms
     * * `function_push` - function_push
     * * `delay` - delay
     * * `wait_until_condition` - wait_until_condition
     * * `wait_until_time_window` - wait_until_time_window
     * * `conditional_branch` - conditional_branch
     * * `random_cohort_branch` - random_cohort_branch
     * * `exit` - exit */
    type: InsightsFlowActionTypeEnumApi
    /** Type-specific config keyed by action type. trigger: {type: event|webhook|manual|batch|schedule|tracking_pixel, filters?}. webhook and manual triggers also require template_id: 'template-source-webhook', and tracking_pixel requires template_id: 'template-source-webhook-pixel'. filters shape: {events: [{id, name, type:'events', properties:[<cond>]}], properties:[<cond>], actions:[...], filter_test_accounts:<bool>}. <cond>: {key, value, operator, type: event|person|group}, or {key: 'id', type: 'cohort', value: <cohort_id>, operator: 'in'} to reference a cohort. function*: {template_id, inputs: {<key>: {value: <str>}}}. Wrap values in {value:...} to enable script templating ({person.x}, {event.x}); flat strings won't interpolate. function_email also accepts tracking_enabled?: <bool> (default true) - when false, no open pixel is injected, links are not rewritten, and the send skips ESP-level open/click tracking, so opens and clicks are not recorded for that step (delivery/bounce/unsubscribe still are). Dictionary input values are template strings too — write booleans/numbers as single-expression templates ('{true}', '{42}'), which evaluate to the typed value. delay: {delay_duration: '<number><unit>'} where unit is m|h|d. Fractions OK ('0.5m'=30s; seconds unsupported). Per-unit max m<=60, h<=24, d<=30; values above are SILENTLY CLAMPED. Max 30d. conditional_branch: {conditions: [{filters}, ...]}. Index N matches the 'branch' edge with index:N. random_cohort_branch: {cohorts: [{percentage: <number>, name?}, ...]}. Index N matches the 'branch' edge with index:N; percentages should sum to 100 (an unallocated remainder routes to the last cohort). wait_until_condition: {condition: {filters}, events?: [{filters: {events: [{id, name, type: 'events'}], actions?: [...]}, name?}], max_wait_duration: <duration>} (same rules as delay). Continues when condition.filters match OR any events entry fires; each events entry must target at least one event or action. On resolution (a condition match or any events entry firing) it advances via the 'branch' edge with index:0; the max_wait_duration timeout falls through the 'continue' edge. exit: {reason}. */
    config: InsightsFlowActionApiConfig
    /** Output variable for downstream actions: {key, result_path?, spread?, label?} or a list of those. */
    output_variable?: unknown
}

/**
 * * `active` - Active
 * * `paused` - Paused
 * * `completed` - Completed
 */
export type InsightsFlowScheduleStatusEnumApi =
    (typeof InsightsFlowScheduleStatusEnumApi)[keyof typeof InsightsFlowScheduleStatusEnumApi]

export const InsightsFlowScheduleStatusEnumApi = {
    Active: 'active',
    Paused: 'paused',
    Completed: 'completed',
} as const

export interface InsightsFlowScheduleApi {
    readonly id: string
    /** iCalendar RRULE string (e.g. 'FREQ=DAILY;INTERVAL=1'). Must produce occurrences at most once per hour. */
    rrule: string
    /** ISO 8601 datetime the schedule starts from. */
    starts_at: string
    /**
     * IANA timezone for interpreting the RRULE (default 'UTC').
     * @maxLength 64
     */
    timezone?: string
    /** Variable value overrides merged with the workflow defaults on each run. */
    variables?: unknown
    /** active, paused, or completed (set once the RRULE's COUNT/UNTIL is exhausted).
     *
     * * `active` - Active
     * * `paused` - Paused
     * * `completed` - Completed */
    readonly status: InsightsFlowScheduleStatusEnumApi
    /**
     * Next scheduled fire time, computed by the scheduler.
     * @nullable
     */
    readonly next_run_at: string | null
    readonly created_at: string
    readonly updated_at: string
}

/**
 * Mixin for serializers to add user access control fields
 */
export interface InsightsFlowApi {
    readonly id: string
    /**
     * Workflow name.
     * @maxLength 400
     * @nullable
     */
    name?: string | null
    /** Optional description. */
    description?: string
    readonly version: number
    /** draft (no execution), active (live), archived (disabled).
     *
     * * `draft` - Draft
     * * `active` - Active
     * * `archived` - Archived */
    status?: InsightsFlowStatusEnumApi
    readonly created_at: string
    readonly created_by: UserBasicApi
    readonly updated_at: string
    readonly trigger: unknown
    /** Optional dedup/throttle on an already-matched trigger: {hash: <InsightsQL template>, ttl: <seconds, 60-94608000>, threshold?: <int>}. Without threshold: fire once per hash, then suppress repeats within ttl (hash '{person.id}' = once per person per ttl). With threshold N: fire once per N matches of the same hash — a sampler, the 1st then every Nth. Throttles an already-qualifying trigger; it doesn't decide who enters. Server compiles bytecode from hash; omit to disable. */
    trigger_masking?: InsightsFlowMaskingApi | null
    /** Conversion goal. filters: ARRAY of property conditions [{key, value, operator, type: event|person|group}]; events: event-based goals [{filters: {events: [...]}}]; window_minutes: minutes after entry. Required for exit_on_conversion / exit_on_trigger_not_matched_or_conversion. bytecode compiled server-side. */
    conversion?: InsightsFlowConversionApi | null
    /** exit_only_at_end: only at exit node (default). exit_on_conversion: also on conversion (needs 'conversion'; silent no-op otherwise). exit_on_trigger_not_matched: also when trigger filter stops matching. exit_on_trigger_not_matched_or_conversion: both (needs 'conversion').
     *
     * * `exit_on_conversion` - Conversion
     * * `exit_on_trigger_not_matched` - Trigger Not Matched
     * * `exit_on_trigger_not_matched_or_conversion` - Trigger Not Matched Or Conversion
     * * `exit_only_at_end` - Only At End */
    exit_condition?: ExitConditionEnumApi
    /** Graph edges: [{from, to, type: 'continue'|'branch', index?}]. 'continue' = fall-through (sequential, or no-match path of conditional_branch). 'branch' requires 'index': matches config.conditions[index] on conditional_branch / wait_until_condition. Every non-exit action needs a reachable next action ('No next action found' otherwise). */
    edges?: InsightsFlowEdgeApi[]
    /** Ordered action nodes. Exactly one type='trigger' required. Typically one type='exit' too. */
    actions: InsightsFlowActionApi[]
    /** @nullable */
    readonly abort_action: string | null
    /** Workflow vars (key, type, default). Total <5KB. */
    variables?: InsightsFlowApiVariablesItem[]
    readonly billable_action_types: unknown
    /** Recurring schedules attached to this workflow (read-only here; manage via the schedules sub-resource). A batch/schedule workflow only fires when it's active AND has an active schedule. Empty for non-scheduled workflows. */
    readonly schedules: readonly InsightsFlowScheduleApi[]
    /**
     * The effective access level the user has for this object
     * @nullable
     */
    readonly user_access_level: string | null
    /** Staged content changes awaiting publish — a full snapshot of the workflow's actions, edges and settings. Null when there's nothing staged. Test it with a use_draft test run, then promote it with the publish endpoint or throw it away with discard_draft. */
    readonly draft: unknown
    /**
     * When the draft was last written; null when there's no staged draft. Pass this to publish (and as base_updated_at on further draft edits) so a concurrent editor's changes aren't clobbered — a mismatch returns 409.
     * @nullable
     */
    readonly draft_updated_at: string | null
    /**
     * Skip-forward map for deleted steps: {deleted_action_id: next surviving action_id}. Maintained automatically when a live graph edit deletes actions, so in-flight runs parked on a deleted step continue at its surviving successor instead of exiting. Null when no live deletions have occurred.
     * @nullable
     */
    readonly action_redirects: InsightsFlowApiActionRedirects
}

/**
 * Variable: {key, type: string|number|boolean, default}.
 */
export type PatchedInsightsFlowApiVariablesItem = { [key: string]: string }

/**
 * Skip-forward map for deleted steps: {deleted_action_id: next surviving action_id}. Maintained automatically when a live graph edit deletes actions, so in-flight runs parked on a deleted step continue at its surviving successor instead of exiting. Null when no live deletions have occurred.
 * @nullable
 */
export type PatchedInsightsFlowApiActionRedirects = { [key: string]: string } | null

/**
 * Mixin for serializers to add user access control fields
 */
export interface PatchedInsightsFlowApi {
    readonly id?: string
    /**
     * Workflow name.
     * @maxLength 400
     * @nullable
     */
    name?: string | null
    /** Optional description. */
    description?: string
    readonly version?: number
    /** draft (no execution), active (live), archived (disabled).
     *
     * * `draft` - Draft
     * * `active` - Active
     * * `archived` - Archived */
    status?: InsightsFlowStatusEnumApi
    readonly created_at?: string
    readonly created_by?: UserBasicApi
    readonly updated_at?: string
    readonly trigger?: unknown
    /** Optional dedup/throttle on an already-matched trigger: {hash: <InsightsQL template>, ttl: <seconds, 60-94608000>, threshold?: <int>}. Without threshold: fire once per hash, then suppress repeats within ttl (hash '{person.id}' = once per person per ttl). With threshold N: fire once per N matches of the same hash — a sampler, the 1st then every Nth. Throttles an already-qualifying trigger; it doesn't decide who enters. Server compiles bytecode from hash; omit to disable. */
    trigger_masking?: InsightsFlowMaskingApi | null
    /** Conversion goal. filters: ARRAY of property conditions [{key, value, operator, type: event|person|group}]; events: event-based goals [{filters: {events: [...]}}]; window_minutes: minutes after entry. Required for exit_on_conversion / exit_on_trigger_not_matched_or_conversion. bytecode compiled server-side. */
    conversion?: InsightsFlowConversionApi | null
    /** exit_only_at_end: only at exit node (default). exit_on_conversion: also on conversion (needs 'conversion'; silent no-op otherwise). exit_on_trigger_not_matched: also when trigger filter stops matching. exit_on_trigger_not_matched_or_conversion: both (needs 'conversion').
     *
     * * `exit_on_conversion` - Conversion
     * * `exit_on_trigger_not_matched` - Trigger Not Matched
     * * `exit_on_trigger_not_matched_or_conversion` - Trigger Not Matched Or Conversion
     * * `exit_only_at_end` - Only At End */
    exit_condition?: ExitConditionEnumApi
    /** Graph edges: [{from, to, type: 'continue'|'branch', index?}]. 'continue' = fall-through (sequential, or no-match path of conditional_branch). 'branch' requires 'index': matches config.conditions[index] on conditional_branch / wait_until_condition. Every non-exit action needs a reachable next action ('No next action found' otherwise). */
    edges?: InsightsFlowEdgeApi[]
    /** Ordered action nodes. Exactly one type='trigger' required. Typically one type='exit' too. */
    actions?: InsightsFlowActionApi[]
    /** @nullable */
    readonly abort_action?: string | null
    /** Workflow vars (key, type, default). Total <5KB. */
    variables?: PatchedInsightsFlowApiVariablesItem[]
    readonly billable_action_types?: unknown
    /** Recurring schedules attached to this workflow (read-only here; manage via the schedules sub-resource). A batch/schedule workflow only fires when it's active AND has an active schedule. Empty for non-scheduled workflows. */
    readonly schedules?: readonly InsightsFlowScheduleApi[]
    /**
     * The effective access level the user has for this object
     * @nullable
     */
    readonly user_access_level?: string | null
    /** Staged content changes awaiting publish — a full snapshot of the workflow's actions, edges and settings. Null when there's nothing staged. Test it with a use_draft test run, then promote it with the publish endpoint or throw it away with discard_draft. */
    readonly draft?: unknown
    /**
     * When the draft was last written; null when there's no staged draft. Pass this to publish (and as base_updated_at on further draft edits) so a concurrent editor's changes aren't clobbered — a mismatch returns 409.
     * @nullable
     */
    readonly draft_updated_at?: string | null
    /**
     * Skip-forward map for deleted steps: {deleted_action_id: next surviving action_id}. Maintained automatically when a live graph edit deletes actions, so in-flight runs parked on a deleted step continue at its surviving successor instead of exiting. Null when no live deletions have occurred.
     * @nullable
     */
    readonly action_redirects?: PatchedInsightsFlowApiActionRedirects
}

export interface MessageAssetApi {
    /** The workflow run this email was sent in. */
    invocation_id: string
    /** The email step (action node) within the workflow that sent this email. */
    action_id: string
    /** The workflow id that sent this email — used to navigate from a person's Emails tab back into the originating workflow. */
    function_id: string
    /** Human-readable workflow name for display. Empty when the workflow has been deleted; clients should fall back to function_id in that case. */
    function_name: string
    /** The batch run this email belongs to, for batch-triggered workflows. Empty for event-triggered runs. */
    parent_run_id: string
    /** Message channel this asset was sent on: 'email' or 'push'. The per-person endpoints return one channel each. */
    kind: string
    /** The recipient's distinct_id. */
    distinct_id: string
    /** The recipient's person UUID, if resolved. */
    person_id: string
    /** Who the message went to: the email address for 'email', or the recipient's distinct ID for 'push'. */
    recipient: string
    /** The email subject line, or the push notification title. */
    subject: string
    /** Delivery status at capture time. Currently always 'sent' - only delivered messages are captured. */
    status: string
    /** When the message was sent. */
    sent_at: string
}

/**
 * * `waiting` - Waiting
 * * `queued` - Queued
 * * `active` - Active
 * * `completed` - Completed
 * * `cancelled` - Cancelled
 * * `failed` - Failed
 */
export type InsightsFlowBatchJobStatusEnumApi =
    (typeof InsightsFlowBatchJobStatusEnumApi)[keyof typeof InsightsFlowBatchJobStatusEnumApi]

export const InsightsFlowBatchJobStatusEnumApi = {
    Waiting: 'waiting',
    Queued: 'queued',
    Active: 'active',
    Completed: 'completed',
    Cancelled: 'cancelled',
    Failed: 'failed',
} as const

export interface InsightsFlowBatchJobApi {
    readonly id: string
    /** Not currently tracked — stays at its initial value. Use the workflow logs/metrics endpoints for run outcome.
     *
     * * `waiting` - Waiting
     * * `queued` - Queued
     * * `active` - Active
     * * `completed` - Completed
     * * `cancelled` - Cancelled
     * * `failed` - Failed */
    status?: InsightsFlowBatchJobStatusEnumApi
    /** ID of the workflow this batch run belongs to. */
    hog_flow: string
    /** Audience snapshot the run fanned out to, taken from the workflow's batch trigger filters. */
    readonly filters: unknown
    /** Variable value overrides applied to this run. */
    variables?: unknown
    readonly created_at: string
    readonly created_by: UserBasicApi
    readonly updated_at: string
}

/**
 * * `update_action` - update_action
 * * `add_action` - add_action
 * * `remove_action` - remove_action
 * * `add_edge` - add_edge
 * * `remove_edge` - remove_edge
 * * `replace_action_edges` - replace_action_edges
 */
export type InsightsFlowGraphOperationOpEnumApi =
    (typeof InsightsFlowGraphOperationOpEnumApi)[keyof typeof InsightsFlowGraphOperationOpEnumApi]

export const InsightsFlowGraphOperationOpEnumApi = {
    UpdateAction: 'update_action',
    AddAction: 'add_action',
    RemoveAction: 'remove_action',
    AddEdge: 'add_edge',
    RemoveEdge: 'remove_edge',
    ReplaceActionEdges: 'replace_action_edges',
} as const

export interface InsightsFlowGraphOperationApi {
    /** Graph edit. update_action {id, patch}: deep-merge patch into the action's fields (a null leaf deletes that key) — the surgical path for tweaking one config value. add_action {action, edges?}: append a full action node, optionally wiring its edges in the same op. remove_action {id}: delete a node and reconnect its incoming edges to its first outgoer. add_edge {edge} / remove_edge {edge}: add or delete one edge. replace_action_edges {id, edges}: replace this action's outgoing edges with the given set (use when adding/removing branch conditions); incoming edges are left intact.
     *
     * * `update_action` - update_action
     * * `add_action` - add_action
     * * `remove_action` - remove_action
     * * `add_edge` - add_edge
     * * `remove_edge` - remove_edge
     * * `replace_action_edges` - replace_action_edges */
    op: InsightsFlowGraphOperationOpEnumApi
    /** Action id. Required for update_action, remove_action, replace_action_edges. */
    id?: string
    /** update_action only. Partial action fields, deep-merged into the existing action; a null leaf deletes that key. e.g. {config: {inputs: {subject: {value: 'Hi'}}}} changes only that input. */
    patch?: unknown
    /** add_action only. A full action node {id, name, type, config, ...}; same shape as in actions. */
    action?: unknown
    /** add_edge / remove_edge only. The edge {from, to, type, index?}. */
    edge?: InsightsFlowEdgeApi
    /** replace_action_edges: the complete set of the action's outgoing edges (incoming edges are preserved). add_action: optional edges to wire the new node in the same op. */
    edges?: InsightsFlowEdgeApi[]
}

export interface PatchedInsightsFlowGraphUpdateApi {
    /** Optimistic concurrency: the updated_at (or draft_updated_at) last loaded. If the stored graph is newer, the patch is rejected with 409 instead of clobbering a concurrent edit. */
    base_updated_at?: string
    /** Ordered graph edits applied atomically to a draft workflow: the stored graph is read, the ops are applied in order, the result is fully validated, and it's saved only if valid — otherwise the workflow is unchanged. Reference nodes/edges by id so you never resend the whole graph. The full updated workflow is returned. */
    operations?: InsightsFlowGraphOperationApi[]
}

export interface HogInvocationResultApi {
    invocation_id: string
    status: string
    error_kind: string
    error_message: string
    distinct_id: string
    person_id: string
    scheduled_at: string
    /** @nullable */
    started_at: string | null
    /** @nullable */
    finished_at: string | null
    /** @nullable */
    duration_ms: number | null
    attempts: number
    is_retry: boolean
}

/**
 * The triggering payload (event/person/groups) the run executed against, as a JSON object.
 */
export type HogInvocationResultDetailApiInvocationGlobals = { [key: string]: unknown }

export interface HogInvocationResultDetailApi {
    /** The triggering payload (event/person/groups) the run executed against, as a JSON object. */
    invocation_globals: HogInvocationResultDetailApiInvocationGlobals
    invocation_id: string
    status: string
    error_kind: string
    error_message: string
    distinct_id: string
    person_id: string
    scheduled_at: string
    /** @nullable */
    started_at: string | null
    /** @nullable */
    finished_at: string | null
    /** @nullable */
    duration_ms: number | null
    attempts: number
    is_retry: boolean
}

/**
 * Test trigger payload, typically {event, person, groups}.
 */
export type InsightsFlowInvocationApiGlobals = { [key: string]: unknown }

export interface InsightsFlowInvocationApi {
    /** Optional override; omit to use saved definition. */
    configuration?: InsightsFlowApi
    /** Test trigger payload, typically {event, person, groups}. */
    globals?: InsightsFlowInvocationApiGlobals
    /** True (default) mocks HTTP/email/SMS. False fires real side effects. */
    mock_async_functions?: boolean
    /** Start execution from this action ID instead of the trigger. Each test run executes a single node and returns the next action id. */
    current_action_id?: string
    /** Test the workflow's staged draft instead of its live config. Set this only when workflows-get returns a non-null 'draft'; it can't be combined with an explicit configuration override. */
    use_draft?: boolean
}

export interface AppMetricSeriesApi {
    name: string
    values: number[]
}

export interface AppMetricsResponseApi {
    labels: string[]
    series: AppMetricSeriesApi[]
}

export type AppMetricsTotalsResponseApiTotals = { [key: string]: number }

export interface AppMetricsTotalsResponseApi {
    totals: AppMetricsTotalsResponseApiTotals
}

export interface InsightsFlowPublishRequestApi {
    /** False (default) previews the publish: returns the impact on people in-flight without changing anything. True applies the staged draft to the live workflow. */
    confirm?: boolean
    /** From the preview response — required when confirm=true. Expires after 15 minutes, and any draft edit invalidates it (409), so you always publish the exact draft you previewed. */
    confirm_token?: string
}

export interface InsightsFlowPublishImpactMoveTargetApi {
    /** Id of the surviving step runs will continue at. */
    action_id: string
    /** Name of the surviving step. */
    name: string
}

export interface InsightsFlowPublishImpactDeletedStepApi {
    /** Id of the step this publish deletes. */
    action_id: string
    /** Name of the deleted step. */
    name: string
    /**
     * About how many in-flight runs are parked on this step. Null when the count is unavailable.
     * @nullable
     */
    runs: number | null
    /** Where those runs continue (skip-forward). Null when nothing downstream survives. */
    moves_to: InsightsFlowPublishImpactMoveTargetApi | null
    /** True when runs parked here exit the workflow instead of moving forward. */
    exits: boolean
}

export interface InsightsFlowPublishImpactEmptyVariableApi {
    /** Variable that renders empty for runs already past its producer. */
    variable: string
    /**
     * Id of the new action that sets it; null when the draft newly declares it as a workflow variable.
     * @nullable
     */
    set_by: string | null
    /** Ids of steps whose content references the variable. */
    referenced_by: string[]
}

export interface InsightsFlowPublishImpactScheduleConflictApi {
    /** Schedule whose variable overrides reference removed variables. */
    schedule_id: string
    /** Override keys the draft no longer declares as workflow variables. */
    variables: string[]
}

export interface InsightsFlowPublishImpactApi {
    /** Per deleted step: how many runs are parked there and where they go. Empty for content-only edits. */
    deleted_steps: InsightsFlowPublishImpactDeletedStepApi[]
    /**
     * In-flight runs whose current step is unknown. Null when the count is unavailable.
     * @nullable
     */
    position_unknown: number | null
    /** Variables that render empty for runs predating their producer. */
    empty_variables: InsightsFlowPublishImpactEmptyVariableApi[]
    /** Schedules overriding variables the draft removes. */
    schedule_conflicts: InsightsFlowPublishImpactScheduleConflictApi[]
}

export interface InsightsFlowPublishResponseApi {
    /** Whether the draft was applied to the live workflow. */
    published: boolean
    /**
     * Runs currently in flight (parked on waits/delays or executing) that will follow the new config once published. Null when the count is unavailable.
     * @nullable
     */
    in_flight_runs: number | null
    /**
     * The staged draft's timestamp, for reference; publishing is confirmed via confirm_token.
     * @nullable
     */
    draft_updated_at: string | null
    /**
     * Echo this back with confirm=true to publish the previewed draft. Only set on previews.
     * @nullable
     */
    confirm_token: string | null
    /** What publishing does to people in-flight. Only set on previews; counts are approximate. */
    impact: InsightsFlowPublishImpactApi | null
    /** The workflow after publishing (only set when published=true). */
    workflow?: InsightsFlowApi | null
}

/**
 * * `running` - running
 * * `succeeded` - succeeded
 * * `failed` - failed
 */
export type HogInvocationRerunFilterStatusEnumApi =
    (typeof HogInvocationRerunFilterStatusEnumApi)[keyof typeof HogInvocationRerunFilterStatusEnumApi]

export const HogInvocationRerunFilterStatusEnumApi = {
    Running: 'running',
    Succeeded: 'succeeded',
    Failed: 'failed',
} as const

/**
 * Filter shape for the rerun endpoint. `window_start`/`window_end` are required.
 */
export interface HogInvocationRerunFilterApi {
    /** Inclusive lower bound on `scheduled_at` (UTC). */
    window_start: string
    /** Exclusive upper bound on `scheduled_at` (UTC). */
    window_end: string
    /** Restrict to invocations whose latest status is one of these. Defaults to ['failed']. */
    status?: HogInvocationRerunFilterStatusEnumApi[]
    /** Restrict to invocations whose error_kind matches one of these (e.g. 'http_5xx', 'timeout'). */
    error_kind?: string[]
    /**
     * Skip invocations that have already been attempted this many times or more.
     * @minimum 1
     * @maximum 255
     */
    max_attempts?: number
    /**
     * Maximum number of invocations to rerun in this request. Server-side cap is 10000.
     * @minimum 1
     * @maximum 10000
     */
    max_count?: number
    /**
     * Optional restriction to specific invocation IDs within the window. Capped at 10000 per request. Always combined with `window_start`/`window_end` so the Datastore query can be partition-pruned.
     * @maxItems 10000
     */
    invocation_ids?: string[]
}

/**
 * Rerun invocations of a script function or script flow from their stored payloads.
 */
export interface HogInvocationRerunRequestApi {
    /** Required. `window_start` / `window_end` pin the query to a small set of date partitions on the `hog_invocation_results` table. Optional `invocation_ids` restricts to specific invocations within that window. */
    filter: HogInvocationRerunFilterApi
}

/**
 * Response from the rerun endpoint. The endpoint only enqueues a wrapper
 * job onto the cyclotron `rerun` queue — the actual Datastore paging and
 * re-enqueue work happens asynchronously in the `cdp-rerun-worker` service.
 * Use `rerun_job_id` to look up progress on the wrapper job later.
 */
export interface HogInvocationRerunResponseApi {
    /** ID of the cyclotron wrapper job that will run the rerun. Use this to poll status. */
    rerun_job_id: string
    /** Always 0 — rerun runs asynchronously. Kept for response shape stability. */
    queued_count: number
    /** Always 0 — rerun runs asynchronously. Kept for response shape stability. */
    skipped_count: number
}

export interface InsightsFlowRevisionBasicApi {
    /** Workflow version this snapshot was published as. */
    readonly version: number
    readonly created_at: string
    readonly created_by: UserBasicApi | null
}

export interface PaginatedInsightsFlowRevisionBasicListApi {
    count: number
    /** @nullable */
    next?: string | null
    /** @nullable */
    previous?: string | null
    results: InsightsFlowRevisionBasicApi[]
}

export interface InsightsFlowRevisionApi {
    /** Workflow version this snapshot was published as. */
    readonly version: number
    readonly created_at: string
    readonly created_by: UserBasicApi | null
    /** Full snapshot of the workflow's content fields (actions, edges, trigger, etc.) at this version. */
    readonly content: unknown
}

export interface InsightsFlowRevisionRestoreRequestApi {
    /** Replace the open staged draft with this revision's content. Without it, restoring while a draft is open returns 409. */
    overwrite?: boolean
}

export interface PatchedInsightsFlowScheduleApi {
    readonly id?: string
    /** iCalendar RRULE string (e.g. 'FREQ=DAILY;INTERVAL=1'). Must produce occurrences at most once per hour. */
    rrule?: string
    /** ISO 8601 datetime the schedule starts from. */
    starts_at?: string
    /**
     * IANA timezone for interpreting the RRULE (default 'UTC').
     * @maxLength 64
     */
    timezone?: string
    /** Variable value overrides merged with the workflow defaults on each run. */
    variables?: unknown
    /** active, paused, or completed (set once the RRULE's COUNT/UNTIL is exhausted).
     *
     * * `active` - Active
     * * `paused` - Paused
     * * `completed` - Completed */
    readonly status?: InsightsFlowScheduleStatusEnumApi
    /**
     * Next scheduled fire time, computed by the scheduler.
     * @nullable
     */
    readonly next_run_at?: string | null
    readonly created_at?: string
    readonly updated_at?: string
}

/**
 * Cheap suspension-only read for the persistent scene-wide banner — no reputation computation.
 */
export interface EmailSendingSuspensionStatusApi {
    /** True while workflow email sending is suspended for this project to protect deliverability. */
    readonly email_sending_suspended: boolean
    /**
     * When email sending was suspended; null while sending is enabled.
     * @nullable
     */
    readonly email_sending_suspended_at: string | null
    /** Staff-authored reason shown to customers alongside the suspension notice; empty when not suspended. */
    readonly email_sending_suspension_reason: string
}

export interface WorkflowStatsRowApi {
    /** The workflow these counts are for. */
    workflow_id: string
    /** Successful invocations in the window. */
    succeeded: number
    /** Failed invocations in the window. */
    failed: number
}

/**
 * * `healthy` - healthy
 * * `warning` - warning
 * * `critical` - critical
 * * `suspended` - suspended
 */
export type AwsTenantReputationHealthEnumApi =
    (typeof AwsTenantReputationHealthEnumApi)[keyof typeof AwsTenantReputationHealthEnumApi]

export const AwsTenantReputationHealthEnumApi = {
    Healthy: 'healthy',
    Warning: 'warning',
    Critical: 'critical',
    Suspended: 'suspended',
} as const

/**
 * * `ENABLED` - ENABLED
 * * `REINSTATED` - REINSTATED
 * * `DISABLED` - DISABLED
 */
export type SendingStatusEnumApi = (typeof SendingStatusEnumApi)[keyof typeof SendingStatusEnumApi]

export const SendingStatusEnumApi = {
    Enabled: 'ENABLED',
    Reinstated: 'REINSTATED',
    Disabled: 'DISABLED',
} as const

/**
 * * `DKIM` - DKIM
 * * `DMARC` - DMARC
 * * `SPF` - SPF
 * * `BIMI` - BIMI
 * * `COMPLAINT` - COMPLAINT
 * * `BOUNCE` - BOUNCE
 * * `FEEDBACK_3P` - FEEDBACK_3P
 * * `IP_LISTING` - IP_LISTING
 */
export type FindingTypeEnumApi = (typeof FindingTypeEnumApi)[keyof typeof FindingTypeEnumApi]

export const FindingTypeEnumApi = {
    Dkim: 'DKIM',
    Dmarc: 'DMARC',
    Spf: 'SPF',
    Bimi: 'BIMI',
    Complaint: 'COMPLAINT',
    Bounce: 'BOUNCE',
    Feedback3p: 'FEEDBACK_3P',
    IpListing: 'IP_LISTING',
} as const

/**
 * * `LOW` - LOW
 * * `HIGH` - HIGH
 */
export type ImpactEnumApi = (typeof ImpactEnumApi)[keyof typeof ImpactEnumApi]

export const ImpactEnumApi = {
    Low: 'LOW',
    High: 'HIGH',
} as const

/**
 * An open reputation finding AWS SES raised for this project's email sending.
 */
export interface AwsTenantFindingApi {
    /** What the finding is about: authentication setup (DKIM/DMARC/SPF/BIMI), recipient signals (COMPLAINT/BOUNCE/FEEDBACK_3P), or a blocklist listing (IP_LISTING).
     *
     * * `DKIM` - DKIM
     * * `DMARC` - DMARC
     * * `SPF` - SPF
     * * `BIMI` - BIMI
     * * `COMPLAINT` - COMPLAINT
     * * `BOUNCE` - BOUNCE
     * * `FEEDBACK_3P` - FEEDBACK_3P
     * * `IP_LISTING` - IP_LISTING */
    readonly finding_type: FindingTypeEnumApi
    /** AWS's impact rating. HIGH-impact findings can pause the project's sending automatically.
     *
     * * `LOW` - LOW
     * * `HIGH` - HIGH */
    readonly impact: ImpactEnumApi
    /** AWS's short description of the finding. Often a terse disambiguator (e.g. DKIM1) rather than full remediation prose — finding_type carries the remediation category. */
    readonly description: string
    /**
     * When AWS last updated this finding.
     * @nullable
     */
    readonly last_updated_at: string | null
}

/**
 * Authoritative reputation for this project's SES tenant, as judged and enforced by AWS.
 */
export interface AwsTenantReputationApi {
    /** Overall health derived from AWS's verdicts: healthy (no findings), warning (low-impact findings), critical (high-impact findings — sending may be paused), suspended (the SES tenant's sending is paused). Reflects AWS state only; Insights-initiated suspensions are reported separately via email_sending_suspended.
     *
     * * `healthy` - healthy
     * * `warning` - warning
     * * `critical` - critical
     * * `suspended` - suspended */
    readonly health: AwsTenantReputationHealthEnumApi
    /** The tenant's aggregate sending status. REINSTATED means sending was re-enabled after a pause and AWS is re-monitoring it.
     *
     * * `ENABLED` - ENABLED
     * * `REINSTATED` - REINSTATED
     * * `DISABLED` - DISABLED */
    readonly sending_status: SendingStatusEnumApi
    /** Open findings, if any, with AWS's remediation guidance. */
    readonly findings: readonly AwsTenantFindingApi[]
}

/**
 * Bounce/complaint rates over the last 30 days of workflow email, computed on the fly from app metrics.
 */
export interface EmailSendingRatesApi {
    /** Hard (permanent) bounces / emails sent over the last 30 days (0-1), matching how AWS counts its bounce rate — transient bounces (greylisting, mailbox full) are excluded. Bounces are counted when the feedback arrives, so the ratio is approximate at the window boundary and capped at 1. */
    readonly bounce_rate: number
    /** Spam complaints / emails sent over the last 30 days (0-1). Complaints are counted when the feedback arrives, so the ratio is approximate at the window boundary and capped at 1. */
    readonly complaint_rate: number
    /** Emails sent in the last 30 days. */
    readonly emails_sent: number
}

/**
 * Bounce/complaint rates over the last 30 days of workflow email, computed on the fly from app metrics.
 */
export interface WorkflowEmailSendingRatesApi {
    /** Hard (permanent) bounces / emails sent over the last 30 days (0-1), matching how AWS counts its bounce rate — transient bounces (greylisting, mailbox full) are excluded. Bounces are counted when the feedback arrives, so the ratio is approximate at the window boundary and capped at 1. */
    readonly bounce_rate: number
    /** Spam complaints / emails sent over the last 30 days (0-1). Complaints are counted when the feedback arrives, so the ratio is approximate at the window boundary and capped at 1. */
    readonly complaint_rate: number
    /** Emails sent in the last 30 days. */
    readonly emails_sent: number
    /** The workflow these rates are for. */
    readonly hog_flow_id: string
    /** Display name of the workflow; empty for unnamed workflows. */
    readonly hog_flow_name: string
}

export interface TeamEmailReputationResponseApi {
    /** Sending health as judged and enforced by AWS SES for this project's tenant; null when the caller lacks project-wide workflow access, no tenant is provisioned, or AWS is unreachable. */
    readonly aws: AwsTenantReputationApi | null
    /** Project-wide rates across all workflow email in the last 30 days (including sends from since-deleted workflows); null when nothing was sent. */
    readonly reputation: EmailSendingRatesApi | null
    /** Rates per workflow, worst first (complaint rate, then bounce rate), capped at the worst 50. */
    readonly workflows: readonly WorkflowEmailSendingRatesApi[]
    /** True while workflow email sending is suspended for this project to protect deliverability. */
    readonly email_sending_suspended: boolean
    /**
     * When email sending was suspended; null while sending is enabled.
     * @nullable
     */
    readonly email_sending_suspended_at: string | null
    /** Staff-authored reason shown to customers alongside the suspension notice; empty when not suspended. */
    readonly email_sending_suspension_reason: string
}

/**
 * Property filters to apply
 */
export type BlastRadiusRequestApiFilters = { [key: string]: unknown }

/**
 * * `email` - email
 */
export type DedupeKeyEnumApi = (typeof DedupeKeyEnumApi)[keyof typeof DedupeKeyEnumApi]

export const DedupeKeyEnumApi = {
    Email: 'email',
} as const

export interface BlastRadiusRequestApi {
    /** Property filters to apply */
    filters: BlastRadiusRequestApiFilters
    /**
     * Group type index for group-based targeting
     * @nullable
     */
    group_type_index?: number | null
    /** When 'email', count unique email addresses instead of persons, matching how batch email sends deduplicate recipients.
     *
     * * `email` - email */
    dedupe_key?: DedupeKeyEnumApi | null
}

export interface BlastRadiusApi {
    /** Number of users matching the filters */
    affected: number
    /** Total number of users */
    total: number
    /** Maximum allowed audience size for batch triggers for this team. */
    limit: number
    /** The dedupe key that was actually applied to 'affected'. 'email' means it counts unique email addresses; null means it counts persons.
     *
     * * `email` - email */
    dedupe_key: DedupeKeyEnumApi | null
    /** Proof this audience was previewed: pass it to the batch dispatch (confirm_token) after echoing 'affected' to the user. Signs these exact filters; expires in 15 minutes. */
    confirm_token: string
}

export type InsightsFlowTemplatesListParams = {
    /**
     * Number of results to return per page.
     */
    limit?: number
    /**
     * The initial index from which to return the results.
     */
    offset?: number
}

export type InsightsFlowTemplatesLogsRetrieveParams = {
    /**
     * Only return entries after this ISO 8601 timestamp.
     */
    after?: string
    /**
     * Only return entries before this ISO 8601 timestamp.
     */
    before?: string
    /**
     * Filter logs to a specific execution instance.
     * @minLength 1
     */
    instance_id?: string
    /**
     * Comma-separated log levels to include, e.g. 'WARN,ERROR'. Valid levels: DEBUG, LOG, INFO, WARN, ERROR.
     * @minLength 1
     */
    level?: string
    /**
     * Maximum number of log entries to return (1-500, default 50).
     * @minimum 1
     * @maximum 500
     */
    limit?: number
    /**
     * Case-insensitive substring search across log messages.
     * @minLength 1
     */
    search?: string
}

export type InsightsFlowsListParams = {
    created_at?: string
    /**
     * Filter to workflows created by the user with this uuid.
     */
    created_by?: string
    id?: string
    /**
     * Number of results to return per page.
     */
    limit?: number
    /**
     * The initial index from which to return the results.
     */
    offset?: number
    /**
     * Case-insensitive search across workflow name and description.
     */
    search?: string
    /**
     * * `draft` - Draft
     * * `active` - Active
     * * `archived` - Archived
     */
    status?: InsightsFlowsListStatus
    updated_at?: string
}

export type InsightsFlowsListStatus = (typeof InsightsFlowsListStatus)[keyof typeof InsightsFlowsListStatus]

export const InsightsFlowsListStatus = {
    Active: 'active',
    Archived: 'archived',
    Draft: 'draft',
} as const

export type InsightsFlowsAssetsRetrieveParams = {
    /**
     * Only return assets sent by this email step (action node id) — used to drill in from a step's metric.
     * @minLength 1
     */
    action_id?: string
    /**
     * Start of the time range, matched on sent time. Relative ('-30d', '-24h') or ISO 8601. Defaults to -30d (the retention window) — bounds the Datastore partition scan.
     * @minLength 1
     */
    after?: string
    /**
     * End of the time range, matched on sent time. Same format as 'after'. Defaults to now.
     * @minLength 1
     */
    before?: string
    /**
     * Only return assets sent to this distinct_id.
     * @minLength 1
     */
    distinct_id?: string
    /**
     * Only return the asset for this specific workflow run — used to deep-link from a single log entry to the email it sent. Returns 0 rows when the send had no captured asset (text-only, kill-switch off, or standalone email).
     * @minLength 1
     */
    invocation_id?: string
    /**
     * Maximum number of assets to return (1-500, default 50).
     * @minimum 1
     * @maximum 500
     */
    limit?: number
    /**
     * Number of assets to skip, for pagination.
     * @minimum 0
     */
    offset?: number
    /**
     * Only return assets for this batch run (InsightsFlowBatchJob id). Pass an empty string to return only event-triggered (non-batch) assets; omit to return all.
     */
    parent_run_id?: string
    /**
     * Case-insensitive substring match on recipient email or subject.
     * @minLength 1
     */
    search?: string
}

export type InsightsFlowsAssetContentRetrieveParams = {
    /**
     * The email step (action node) that sent the email. Defaults to empty for standalone email sends.
     */
    action_id?: string
    /**
     * The workflow run the email was sent in.
     * @minLength 1
     */
    invocation_id: string
}

export type InsightsFlowsInvocationResultsRetrieveParams = {
    /**
     * Start of the time range, matched on scheduled time. Relative ('-7d', '-24h') or ISO 8601. Defaults to -7d — bounds the Datastore partition scan, so widen it explicitly for older runs.
     * @minLength 1
     */
    after?: string
    /**
     * End of the time range, matched on scheduled time. Same format as 'after'. Defaults to now.
     * @minLength 1
     */
    before?: string
    /**
     * Only return invocations triggered for this distinct_id (the person the run executed for).
     * @minLength 1
     */
    distinct_id?: string
    /**
     * Maximum number of invocations to return (1-500, default 50).
     * @minimum 1
     * @maximum 500
     */
    limit?: number
    /**
     * Comma-separated invocation statuses to include, e.g. 'failed' or 'success,failed'.
     * @minLength 1
     */
    status?: string
}

export type InsightsFlowsLogsRetrieveParams = {
    /**
     * Only return entries after this ISO 8601 timestamp.
     */
    after?: string
    /**
     * Only return entries before this ISO 8601 timestamp.
     */
    before?: string
    /**
     * Filter logs to a specific execution instance.
     * @minLength 1
     */
    instance_id?: string
    /**
     * Comma-separated log levels to include, e.g. 'WARN,ERROR'. Valid levels: DEBUG, LOG, INFO, WARN, ERROR.
     * @minLength 1
     */
    level?: string
    /**
     * Maximum number of log entries to return (1-500, default 50).
     * @minimum 1
     * @maximum 500
     */
    limit?: number
    /**
     * Case-insensitive substring search across log messages.
     * @minLength 1
     */
    search?: string
}

export type InsightsFlowsMetricsRetrieveParams = {
    /**
     * Start of the time range. Accepts relative formats like '-7d', '-24h' or ISO 8601 timestamps. Defaults to '-7d'.
     * @minLength 1
     */
    after?: string
    /**
     * End of the time range. Same format as 'after'. Defaults to now.
     * @minLength 1
     */
    before?: string
    /**
     * Group the series by metric 'name' or 'kind'. Defaults to 'kind'.
     *
     * * `name` - name
     * * `kind` - kind
     * @minLength 1
     */
    breakdown_by?: InsightsFlowsMetricsRetrieveBreakdownBy
    /**
     * Filter metrics to a specific execution instance.
     * @minLength 1
     */
    instance_id?: string
    /**
     * Time bucket size for the series. One of: hour, day, week. Defaults to 'day'.
     *
     * * `hour` - hour
     * * `day` - day
     * * `week` - week
     * @minLength 1
     */
    interval?: InsightsFlowsMetricsRetrieveInterval
    /**
     * Comma-separated metric kinds to filter by, e.g. 'success,failure'.
     * @minLength 1
     */
    kind?: string
    /**
     * Comma-separated metric names to filter by.
     * @minLength 1
     */
    name?: string
}

export type InsightsFlowsMetricsRetrieveBreakdownBy =
    (typeof InsightsFlowsMetricsRetrieveBreakdownBy)[keyof typeof InsightsFlowsMetricsRetrieveBreakdownBy]

export const InsightsFlowsMetricsRetrieveBreakdownBy = {
    Name: 'name',
    Kind: 'kind',
} as const

export type InsightsFlowsMetricsRetrieveInterval =
    (typeof InsightsFlowsMetricsRetrieveInterval)[keyof typeof InsightsFlowsMetricsRetrieveInterval]

export const InsightsFlowsMetricsRetrieveInterval = {
    Hour: 'hour',
    Day: 'day',
    Week: 'week',
} as const

export type InsightsFlowsMetricsTotalsRetrieveParams = {
    /**
     * Start of the time range. Accepts relative formats like '-7d', '-24h' or ISO 8601 timestamps. Defaults to '-7d'.
     * @minLength 1
     */
    after?: string
    /**
     * End of the time range. Same format as 'after'. Defaults to now.
     * @minLength 1
     */
    before?: string
    /**
     * Group the series by metric 'name' or 'kind'. Defaults to 'kind'.
     *
     * * `name` - name
     * * `kind` - kind
     * @minLength 1
     */
    breakdown_by?: InsightsFlowsMetricsTotalsRetrieveBreakdownBy
    /**
     * Filter metrics to a specific execution instance.
     * @minLength 1
     */
    instance_id?: string
    /**
     * Time bucket size for the series. One of: hour, day, week. Defaults to 'day'.
     *
     * * `hour` - hour
     * * `day` - day
     * * `week` - week
     * @minLength 1
     */
    interval?: InsightsFlowsMetricsTotalsRetrieveInterval
    /**
     * Comma-separated metric kinds to filter by, e.g. 'success,failure'.
     * @minLength 1
     */
    kind?: string
    /**
     * Comma-separated metric names to filter by.
     * @minLength 1
     */
    name?: string
}

export type InsightsFlowsMetricsTotalsRetrieveBreakdownBy =
    (typeof InsightsFlowsMetricsTotalsRetrieveBreakdownBy)[keyof typeof InsightsFlowsMetricsTotalsRetrieveBreakdownBy]

export const InsightsFlowsMetricsTotalsRetrieveBreakdownBy = {
    Name: 'name',
    Kind: 'kind',
} as const

export type InsightsFlowsMetricsTotalsRetrieveInterval =
    (typeof InsightsFlowsMetricsTotalsRetrieveInterval)[keyof typeof InsightsFlowsMetricsTotalsRetrieveInterval]

export const InsightsFlowsMetricsTotalsRetrieveInterval = {
    Hour: 'hour',
    Day: 'day',
    Week: 'week',
} as const

export type InsightsFlowsRevisionsListParams = {
    /**
     * Number of results to return per page.
     */
    limit?: number
    /**
     * The initial index from which to return the results.
     */
    offset?: number
}

export type InsightsFlowsMetricsGlobalRetrieveParams = {
    /**
     * Start of the window, matched on metric time. Relative ('-7d', '-24h') or ISO 8601. Defaults to -7d.
     * @minLength 1
     */
    after?: string
    /**
     * End of the window. Same format as 'after'. Defaults to now.
     * @minLength 1
     */
    before?: string
}

export type InsightsFlowsReputationRetrieveParams = {
    /**
     * Case-insensitive workflow name filter. Applied before the worst-50 cap, so it finds workflows the unfiltered response cuts off.
     */
    search?: string
}
