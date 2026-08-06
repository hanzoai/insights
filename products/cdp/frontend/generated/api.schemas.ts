/**
 * Auto-generated from the Django backend OpenAPI schema.
 * To modify these types, update the Django serializers or views, then run:
 *   insightscli build:openapi
 * Questions or issues? #team-devex on Slack
 *
 * Insights API - generated
 * OpenAPI spec version: 1.0.0
 */
export interface InsightsFunctionMappingTemplateApi {
    /** Name of this mapping template. */
    name: string
    /**
     * Whether this mapping is enabled by default.
     * @nullable
     */
    include_by_default?: boolean | null
    /**
     * Whether this mapping should match all events by default, hiding the event filter UI.
     * @nullable
     */
    use_all_events_by_default?: boolean | null
    /** Event filters specific to this mapping. */
    filters?: unknown
    /** Input values specific to this mapping. */
    inputs?: unknown
    /** Additional input schema fields specific to this mapping. */
    inputs_schema?: unknown
}

export interface InsightsFunctionTemplateApi {
    /** Unique template identifier (e.g. 'template-slack'). */
    id: string
    /**
     * Display name of the template.
     * @maxLength 400
     */
    name: string
    /**
     * What this template does.
     * @nullable
     */
    description?: string | null
    /** Source code of the template. */
    code: string
    /**
     * Programming language: 'script' or 'javascript'.
     * @maxLength 20
     */
    code_language?: string
    /** Schema defining configurable inputs for functions created from this template. */
    inputs_schema: unknown
    /**
     * Function type this template creates.
     * @maxLength 50
     */
    type: string
    /**
     * Lifecycle status: alpha, beta, stable, deprecated, or hidden.
     * @maxLength 20
     */
    status?: string
    /** Category tags for organizing templates. */
    category?: unknown
    /** Whether available on free plans. */
    free?: boolean
    /**
     * URL for the template's icon.
     * @nullable
     */
    icon_url?: string | null
    /** Default event filters. */
    filters?: unknown
    /** Default PII masking configuration. */
    masking?: unknown
    /**
     * Pre-defined mapping configurations for destination templates.
     * @nullable
     */
    mapping_templates?: InsightsFunctionMappingTemplateApi[] | null
}

export interface PaginatedInsightsFunctionTemplateListApi {
    count: number
    /** @nullable */
    next?: string | null
    /** @nullable */
    previous?: string | null
    results: InsightsFunctionTemplateApi[]
}

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
 * * `0` - 0
 * * `1` - 1
 * * `2` - 2
 * * `3` - 3
 * * `11` - 11
 * * `12` - 12
 */
export type InsightsFunctionStatusStateEnumApi =
    (typeof InsightsFunctionStatusStateEnumApi)[keyof typeof InsightsFunctionStatusStateEnumApi]

export const InsightsFunctionStatusStateEnumApi = {
    Number0: 0,
    Number1: 1,
    Number2: 2,
    Number3: 3,
    Number11: 11,
    Number12: 12,
} as const

export interface InsightsFunctionStatusApi {
    state: InsightsFunctionStatusStateEnumApi
    tokens: number
}

export type SearchMatchTypeEnumApi = (typeof SearchMatchTypeEnumApi)[keyof typeof SearchMatchTypeEnumApi]

export const SearchMatchTypeEnumApi = {
    Exact: 'exact',
    Similar: 'similar',
} as const

export interface InsightsFunctionMinimalApi {
    readonly id: string
    /** @nullable */
    readonly type: string | null
    /** @nullable */
    readonly name: string | null
    readonly description: string
    readonly created_at: string
    readonly created_by: UserBasicApi
    readonly updated_at: string
    readonly enabled: boolean
    readonly script: string
    readonly filters: unknown
    /** @nullable */
    readonly icon_url: string | null
    readonly template: InsightsFunctionTemplateApi
    readonly status: InsightsFunctionStatusApi | null
    /** @nullable */
    readonly execution_order: number | null
    /** How this row matched the `search` query parameter: `exact` (the term is a case-insensitive substring of a searched field) or `similar` (a fuzzy trigram match, returned only when no exact match exists). Null when the list is not filtered by `search`. */
    readonly search_match_type: SearchMatchTypeEnumApi | null
}

export interface PaginatedInsightsFunctionMinimalListApi {
    count: number
    /** @nullable */
    next?: string | null
    /** @nullable */
    previous?: string | null
    results: InsightsFunctionMinimalApi[]
}

/**
 * * `script` - script
 * * `liquid` - liquid
 */
export type InsightsFunctionTemplatingEnumApi =
    (typeof InsightsFunctionTemplatingEnumApi)[keyof typeof InsightsFunctionTemplatingEnumApi]

export const InsightsFunctionTemplatingEnumApi = {
    Script: 'script',
    Liquid: 'liquid',
} as const

export interface InputsItemApi {
    value?: unknown
    templating?: InsightsFunctionTemplatingEnumApi
    readonly bytecode: readonly unknown[]
    readonly order: number
    readonly transpiled: unknown
}

/**
 * Values for each input defined in inputs_schema.
 */
export type InsightsFunctionApiInputs = { [key: string]: InputsItemApi }

/**
 * * `destination` - Destination
 * * `site_destination` - Site Destination
 * * `internal_destination` - Internal Destination
 * * `source_webhook` - Source Webhook
 * * `warehouse_source_webhook` - Warehouse Source Webhook
 * * `site_app` - Site App
 * * `transformation` - Transformation
 * * `transformation_log` - Transformation Log
 */
export type InsightsFunctionTypeEnumApi = (typeof InsightsFunctionTypeEnumApi)[keyof typeof InsightsFunctionTypeEnumApi]

export const InsightsFunctionTypeEnumApi = {
    Destination: 'destination',
    SiteDestination: 'site_destination',
    InternalDestination: 'internal_destination',
    SourceWebhook: 'source_webhook',
    WarehouseSourceWebhook: 'warehouse_source_webhook',
    SiteApp: 'site_app',
    Transformation: 'transformation',
    TransformationLog: 'transformation_log',
} as const

/**
 * * `string` - string
 * * `number` - number
 * * `boolean` - boolean
 * * `dictionary` - dictionary
 * * `choice` - choice
 * * `json` - json
 * * `integration` - integration
 * * `integration_multi` - integration_multi
 * * `integration_field` - integration_field
 * * `email` - email
 * * `native_email` - native_email
 * * `insights_assignee` - insights_assignee
 * * `insights_ticket_tags` - insights_ticket_tags
 * * `insights_business_hours` - insights_business_hours
 * * `non_failure_status_codes` - non_failure_status_codes
 * * `customer_analytics_account_properties` - customer_analytics_account_properties
 * * `customer_analytics_account_relationships` - customer_analytics_account_relationships
 */
export type InputsSchemaItemTypeEnumApi = (typeof InputsSchemaItemTypeEnumApi)[keyof typeof InputsSchemaItemTypeEnumApi]

export const InputsSchemaItemTypeEnumApi = {
    String: 'string',
    Number: 'number',
    Boolean: 'boolean',
    Dictionary: 'dictionary',
    Choice: 'choice',
    Json: 'json',
    Integration: 'integration',
    IntegrationMulti: 'integration_multi',
    IntegrationField: 'integration_field',
    Email: 'email',
    NativeEmail: 'native_email',
    InsightsAssignee: 'insights_assignee',
    InsightsTicketTags: 'insights_ticket_tags',
    InsightsBusinessHours: 'insights_business_hours',
    NonFailureStatusCodes: 'non_failure_status_codes',
    CustomerAnalyticsAccountProperties: 'customer_analytics_account_properties',
    CustomerAnalyticsAccountRelationships: 'customer_analytics_account_relationships',
} as const

export type InputsSchemaItemApiChoicesItem = { [key: string]: unknown }

export interface InputsSchemaItemApi {
    type: InputsSchemaItemTypeEnumApi
    key: string
    label?: string
    choices?: InputsSchemaItemApiChoicesItem[]
    searchable?: boolean
    required?: boolean
    default?: unknown
    secret?: boolean
    hidden?: boolean
    description?: string
    integration?: string
    integration_key?: string
    requires_field?: string
    integration_field?: string
    requiredScopes?: string
    templating?: boolean | 'script' | 'liquid'
}

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

export interface InsightsFunctionMaskingApi {
    /**
     * Time-to-live in seconds for the masking cache (60–86400).
     * @minimum 60
     * @maximum 86400
     */
    ttl: number
    /**
     * Optional threshold count before masking applies.
     * @nullable
     */
    threshold?: number | null
    /** Script expression used to compute the masking hash. */
    hash: string
    /** Compiled bytecode for the hash expression. Auto-generated. */
    bytecode?: unknown
}

export type MappingsApiInputs = { [key: string]: InputsItemApi }

export interface MappingsApi {
    name?: string
    inputs_schema?: InputsSchemaItemApi[]
    inputs?: MappingsApiInputs
    filters?: InsightsFunctionFiltersApi
}

export interface InsightsFunctionApi {
    readonly id: string
    /** Function type: destination, site_destination, internal_destination, source_webhook, warehouse_source_webhook, site_app, transformation, or transformation_log.
     *
     * * `destination` - Destination
     * * `site_destination` - Site Destination
     * * `internal_destination` - Internal Destination
     * * `source_webhook` - Source Webhook
     * * `warehouse_source_webhook` - Warehouse Source Webhook
     * * `site_app` - Site App
     * * `transformation` - Transformation
     * * `transformation_log` - Transformation Log */
    type?: InsightsFunctionTypeEnumApi | null
    /**
     * Display name for the function.
     * @maxLength 400
     * @nullable
     */
    name?: string | null
    /** Human-readable description of what this function does. */
    description?: string
    readonly created_at: string
    readonly created_by: UserBasicApi
    readonly updated_at: string
    /** Whether the function is active and processing events. */
    enabled?: boolean
    /** Soft-delete flag. Set to true to archive the function. */
    deleted?: boolean
    /** Source code. Script language for most types; TypeScript for site_destination and site_app. */
    script?: string
    readonly bytecode: unknown
    /** @nullable */
    readonly transpiled: string | null
    /** Schema defining the configurable input parameters for this function. */
    inputs_schema?: InputsSchemaItemApi[]
    /** Values for each input defined in inputs_schema. */
    inputs?: InsightsFunctionApiInputs
    /** Event filters that control which events trigger this function. */
    filters?: InsightsFunctionFiltersApi
    /** PII masking configuration with TTL, threshold, and hash expression. */
    masking?: InsightsFunctionMaskingApi | null
    /**
     * Event-to-destination field mappings. Only for destination and site_destination types.
     * @nullable
     */
    mappings?: MappingsApi[] | null
    /**
     * URL for the function's icon displayed in the UI.
     * @nullable
     */
    icon_url?: string | null
    readonly template: InsightsFunctionTemplateApi
    /**
     * ID of the template to create this function from.
     * @maxLength 400
     * @nullable
     */
    template_id?: string | null
    readonly status: InsightsFunctionStatusApi | null
    /**
     * Execution priority for transformations. Lower values run first.
     * @minimum 0
     * @maximum 32767
     * @nullable
     */
    execution_order?: number | null
    _create_in_folder?: string
    /** @nullable */
    readonly batch_export_id: string | null
    /** How this row matched the `search` query parameter: `exact` (the term is a case-insensitive substring of a searched field) or `similar` (a fuzzy trigram match, returned only when no exact match exists). Null when the list is not filtered by `search`. */
    readonly search_match_type: SearchMatchTypeEnumApi | null
}

/**
 * Values for each input defined in inputs_schema.
 */
export type PatchedInsightsFunctionApiInputs = { [key: string]: InputsItemApi }

export interface PatchedInsightsFunctionApi {
    readonly id?: string
    /** Function type: destination, site_destination, internal_destination, source_webhook, warehouse_source_webhook, site_app, transformation, or transformation_log.
     *
     * * `destination` - Destination
     * * `site_destination` - Site Destination
     * * `internal_destination` - Internal Destination
     * * `source_webhook` - Source Webhook
     * * `warehouse_source_webhook` - Warehouse Source Webhook
     * * `site_app` - Site App
     * * `transformation` - Transformation
     * * `transformation_log` - Transformation Log */
    type?: InsightsFunctionTypeEnumApi | null
    /**
     * Display name for the function.
     * @maxLength 400
     * @nullable
     */
    name?: string | null
    /** Human-readable description of what this function does. */
    description?: string
    readonly created_at?: string
    readonly created_by?: UserBasicApi
    readonly updated_at?: string
    /** Whether the function is active and processing events. */
    enabled?: boolean
    /** Soft-delete flag. Set to true to archive the function. */
    deleted?: boolean
    /** Source code. Script language for most types; TypeScript for site_destination and site_app. */
    script?: string
    readonly bytecode?: unknown
    /** @nullable */
    readonly transpiled?: string | null
    /** Schema defining the configurable input parameters for this function. */
    inputs_schema?: InputsSchemaItemApi[]
    /** Values for each input defined in inputs_schema. */
    inputs?: PatchedInsightsFunctionApiInputs
    /** Event filters that control which events trigger this function. */
    filters?: InsightsFunctionFiltersApi
    /** PII masking configuration with TTL, threshold, and hash expression. */
    masking?: InsightsFunctionMaskingApi | null
    /**
     * Event-to-destination field mappings. Only for destination and site_destination types.
     * @nullable
     */
    mappings?: MappingsApi[] | null
    /**
     * URL for the function's icon displayed in the UI.
     * @nullable
     */
    icon_url?: string | null
    readonly template?: InsightsFunctionTemplateApi
    /**
     * ID of the template to create this function from.
     * @maxLength 400
     * @nullable
     */
    template_id?: string | null
    readonly status?: InsightsFunctionStatusApi | null
    /**
     * Execution priority for transformations. Lower values run first.
     * @minimum 0
     * @maximum 32767
     * @nullable
     */
    execution_order?: number | null
    _create_in_folder?: string
    /** @nullable */
    readonly batch_export_id?: string | null
    /** How this row matched the `search` query parameter: `exact` (the term is a case-insensitive substring of a searched field) or `similar` (a fuzzy trigram match, returned only when no exact match exists). Null when the list is not filtered by `search`. */
    readonly search_match_type?: SearchMatchTypeEnumApi | null
}

/**
 * Mock global variables available during test invocation.
 */
export type InsightsFunctionInvocationApiGlobals = { [key: string]: unknown }

/**
 * Mock Datastore event data to test the function with.
 */
export type InsightsFunctionInvocationApiDatastoreEvent = { [key: string]: unknown }

export interface InsightsFunctionInvocationApi {
    /** Full function configuration to test. */
    configuration: InsightsFunctionApi
    /** Mock global variables available during test invocation. */
    globals?: InsightsFunctionInvocationApiGlobals
    /** Mock Datastore event data to test the function with. */
    datastore_event?: InsightsFunctionInvocationApiDatastoreEvent
    /** When true (default), async functions like fetch() are simulated. */
    mock_async_functions?: boolean
    /** Invocation result status. */
    readonly status: string
    /** Execution logs from the test invocation. */
    readonly logs: readonly unknown[]
    /**
     * Optional invocation ID for correlation.
     * @nullable
     */
    invocation_id?: string | null
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

/**
 * Map of script function UUIDs to their new execution_order values.
 */
export type PatchedInsightsFunctionRearrangeApiOrders = { [key: string]: number }

export interface PatchedInsightsFunctionRearrangeApi {
    /** Map of script function UUIDs to their new execution_order values. */
    orders?: PatchedInsightsFunctionRearrangeApiOrders
}

/**
 * * `SYSTEM` - SYSTEM
 * * `PLUGIN` - PLUGIN
 * * `CONSOLE` - CONSOLE
 */
export type PluginLogEntrySourceEnumApi = (typeof PluginLogEntrySourceEnumApi)[keyof typeof PluginLogEntrySourceEnumApi]

export const PluginLogEntrySourceEnumApi = {
    System: 'SYSTEM',
    Plugin: 'PLUGIN',
    Console: 'CONSOLE',
} as const

/**
 * * `DEBUG` - DEBUG
 * * `LOG` - LOG
 * * `INFO` - INFO
 * * `WARN` - WARN
 * * `ERROR` - ERROR
 */
export type PluginLogEntryTypeEnumApi = (typeof PluginLogEntryTypeEnumApi)[keyof typeof PluginLogEntryTypeEnumApi]

export const PluginLogEntryTypeEnumApi = {
    Debug: 'DEBUG',
    Log: 'LOG',
    Info: 'INFO',
    Warn: 'WARN',
    Error: 'ERROR',
} as const

export interface PluginLogEntryApi {
    id: string
    team_id: number
    plugin_id: number
    plugin_config_id: number
    timestamp: string
    source: PluginLogEntrySourceEnumApi
    type: PluginLogEntryTypeEnumApi
    message: string
    instance_id: string
}

export interface PaginatedPluginLogEntryListApi {
    count: number
    /** @nullable */
    next?: string | null
    /** @nullable */
    previous?: string | null
    results: PluginLogEntryApi[]
}

export type InsightsFunctionTemplatesListParams = {
    /**
     * Number of results to return per page.
     */
    limit?: number
    /**
     * The initial index from which to return the results.
     */
    offset?: number
    /**
     * Filter to a specific template by its template_id. Deprecated templates are excluded from list results; use the retrieve endpoint to look up a template by ID regardless of status.
     */
    template_id?: string
    /**
     * Filter by template type (e.g. destination, email, sms_provider, broadcast). Defaults to destination if neither type nor types is provided.
     */
    type?: string
    /**
     * Comma-separated list of template types to include (e.g. destination,email,sms_provider).
     */
    types?: string
}

export type InsightsFunctionsListParams = {
    created_at?: string
    created_by?: number
    enabled?: boolean
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
     * Multiple values may be separated by commas.
     */
    type?: string[]
    updated_at?: string
}

export type InsightsFunctionsLogsRetrieveParams = {
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

export type InsightsFunctionsMetricsRetrieveParams = {
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
    breakdown_by?: InsightsFunctionsMetricsRetrieveBreakdownBy
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
    interval?: InsightsFunctionsMetricsRetrieveInterval
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

export type InsightsFunctionsMetricsRetrieveBreakdownBy =
    (typeof InsightsFunctionsMetricsRetrieveBreakdownBy)[keyof typeof InsightsFunctionsMetricsRetrieveBreakdownBy]

export const InsightsFunctionsMetricsRetrieveBreakdownBy = {
    Name: 'name',
    Kind: 'kind',
} as const

export type InsightsFunctionsMetricsRetrieveInterval =
    (typeof InsightsFunctionsMetricsRetrieveInterval)[keyof typeof InsightsFunctionsMetricsRetrieveInterval]

export const InsightsFunctionsMetricsRetrieveInterval = {
    Hour: 'hour',
    Day: 'day',
    Week: 'week',
} as const

export type InsightsFunctionsMetricsTotalsRetrieveParams = {
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
    breakdown_by?: InsightsFunctionsMetricsTotalsRetrieveBreakdownBy
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
    interval?: InsightsFunctionsMetricsTotalsRetrieveInterval
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

export type InsightsFunctionsMetricsTotalsRetrieveBreakdownBy =
    (typeof InsightsFunctionsMetricsTotalsRetrieveBreakdownBy)[keyof typeof InsightsFunctionsMetricsTotalsRetrieveBreakdownBy]

export const InsightsFunctionsMetricsTotalsRetrieveBreakdownBy = {
    Name: 'name',
    Kind: 'kind',
} as const

export type InsightsFunctionsMetricsTotalsRetrieveInterval =
    (typeof InsightsFunctionsMetricsTotalsRetrieveInterval)[keyof typeof InsightsFunctionsMetricsTotalsRetrieveInterval]

export const InsightsFunctionsMetricsTotalsRetrieveInterval = {
    Hour: 'hour',
    Day: 'day',
    Week: 'week',
} as const

export type PluginConfigsLogsListParams = {
    /**
     * Number of results to return per page.
     */
    limit?: number
    /**
     * The initial index from which to return the results.
     */
    offset?: number
}

export type PublicInsightsFunctionTemplatesListParams = {
    /**
     * Number of results to return per page.
     */
    limit?: number
    /**
     * The initial index from which to return the results.
     */
    offset?: number
    /**
     * Filter to a specific template by its template_id. Deprecated templates are excluded from list results; use the retrieve endpoint to look up a template by ID regardless of status.
     */
    template_id?: string
    /**
     * Filter by template type (e.g. destination, email, sms_provider, broadcast). Defaults to destination if neither type nor types is provided.
     */
    type?: string
    /**
     * Comma-separated list of template types to include (e.g. destination,email,sms_provider).
     */
    types?: string
}
