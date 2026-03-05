import { DateTime } from 'luxon'

import { VMState } from '@posthog/scriptvm'

import { CyclotronInputType, CyclotronInvocationQueueParametersType } from '~/schema/cyclotron'

import { InsightsFlow } from '../schema/customflow'
import {
    ClickHouseTimestamp,
    ElementPropertyFilter,
    EventPropertyFilter,
    InsightsQLPropertyFilter,
    PersonPropertyFilter,
    Team,
} from '../types'

export type ScriptBytecode = any[]

// subset of EntityFilter
export interface InsightsFunctionFilterBase {
    id: string | null
    name?: string | null
    order?: number
    properties?: (EventPropertyFilter | PersonPropertyFilter | ElementPropertyFilter | InsightsQLPropertyFilter)[]
}

export interface InsightsFunctionFilterEvent extends InsightsFunctionFilterBase {
    type: 'events'
    bytecode?: ScriptBytecode
}

export interface InsightsFunctionFilterAction extends InsightsFunctionFilterBase {
    type: 'actions'
    // Loaded at run time from Action model
    bytecode?: ScriptBytecode
}

export type InsightsFunctionFilter = InsightsFunctionFilterEvent | InsightsFunctionFilterAction

export type InsightsFunctionMasking = {
    ttl: number | null
    hash: string
    bytecode: ScriptBytecode
    threshold: number | null
}

export interface InsightsFunctionFilters {
    source?: 'events' | 'person-updates' | 'data-warehouse-table' // Special case to identify what kind of thing this filters on
    events?: InsightsFunctionFilterEvent[]
    actions?: InsightsFunctionFilterAction[]
    properties?: Record<string, any>[] // Global property filters that apply to all events
    filter_test_accounts?: boolean
    bytecode?: ScriptBytecode
}

export type GroupType = {
    id: string // the "key" of the group
    type: string
    index: number
    url: string
    properties: Record<string, any>
}

export type CyclotronPerson = {
    id: string
    properties: Record<string, any>
    name: string
    url: string
}

export type InsightsFunctionInvocationGlobals = {
    project: {
        id: number
        name: string
        url: string
    }
    source?: {
        name: string
        url: string
    }
    event: {
        /* Database fields */
        uuid: string
        event: string
        distinct_id: string
        properties: Record<string, unknown>
        elements_chain: string
        timestamp: string
        captured_at?: string | null

        /* Special fields in Script */
        url: string
    }
    person?: CyclotronPerson
    groups?: Record<string, GroupType>

    // Unique to sources - will be modified later
    request?: {
        method: string
        headers: Record<string, string | undefined>
        query: Record<string, string | undefined>
        ip?: string
        body: Record<string, any>
        stringBody: string
    }

    unsubscribe_url?: string // For email actions, the unsubscribe URL to use
    unsubscribe_url_one_click?: string // For email actions, the one-click unsubscribe URL to use

    actions?: InsightsFunctionInvocationActionVariables
    variables?: Record<string, any> // For InsightsFlows, workflow-level variables
}

/**
 * A map of key value variables that persist across actions in a flow
 * These variables can be used to store loop state or pass data between actions
 *
 * Action's can read and write to these variables. Any value stored in the variables
 * map must be JSON serializable, and limited to 1KB in size.
 *
 * After execution, every action will have a corresponding entry in the map with
 * the key `$action/{actionId}` containing the result of the action.
 */
export type InsightsFunctionInvocationActionVariables = {
    [key: string]: { result: any; error?: any }
}

export type InsightsFunctionInvocationGlobalsWithInputs = InsightsFunctionInvocationGlobals & {
    inputs: Record<string, any>
}

export type InsightsFunctionFilterGlobals = {
    // Filter Script is built in the same way as analytics so the global object is meant to be an event
    event: string
    uuid: string
    timestamp: string
    elements_chain: string
    elements_chain_href: string
    elements_chain_texts: string[]
    elements_chain_ids: string[]
    elements_chain_elements: string[]
    properties: Record<string, any>
    distinct_id: string

    person: {
        id: string
        properties: Record<string, any>
    } | null
    pdi: {
        distinct_id: string
        person_id: string
        person: {
            id: string
            properties: Record<string, any>
        }
    } | null

    // Used by groupId filters on event_metadata
    $group_0: string | null
    $group_1: string | null
    $group_2: string | null
    $group_3: string | null
    $group_4: string | null

    // Used by group property filters
    group_0: {
        properties: Record<string, any>
    }
    group_1: {
        properties: Record<string, any>
    }
    group_2: {
        properties: Record<string, any>
    }
    group_3: {
        properties: Record<string, any>
    }
    group_4: {
        properties: Record<string, any>
    }

    variables: Record<string, any> | undefined // For InsightsFlows, workflow-level variables
}

export type MetricLogSource = 'insights_function' | 'insights_flow'

export type LogEntryLevel = 'debug' | 'info' | 'warn' | 'error'

export type MinimalLogEntry = {
    timestamp: DateTime
    level: LogEntryLevel
    message: string
}

export type LogEntry = MinimalLogEntry & {
    team_id: number
    log_source: MetricLogSource // The kind of source (insights_function)
    log_source_id: string // The id of the custom function
    instance_id: string // The id of the specific invocation
}

export type LogEntrySerialized = Omit<LogEntry, 'timestamp'> & {
    timestamp: ClickHouseTimestamp
}

export type MinimalAppMetric = {
    team_id: number
    app_source_id: string // The main item (like the custom function or custom flow ID)
    instance_id?: string // The specific instance of the item (can be the invocation ID or a sub item like an action ID)
    metric_kind: 'failure' | 'success' | 'other' | 'email' | 'sms' | 'push' | 'billing' | 'fetch'
    metric_name:
        | 'early_exit'
        | 'triggered'
        | 'trigger_failed'
        | 'succeeded'
        | 'failed'
        | 'filtered'
        | 'disabled_temporarily'
        | 'disabled_permanently'
        | 'rate_limited'
        | 'masked'
        | 'filtering_failed'
        | 'inputs_failed'
        | 'missing_addon'
        | 'fetch'
        | 'billable_invocation'
        | 'dropped'
        | 'email_sent'
        | 'email_failed'
        | 'email_opened'
        | 'email_link_clicked'
        | 'email_bounced'
        | 'email_blocked'
        | 'email_spam'
        | 'email_unsubscribed'
        | 'quota_limited'
    count: number
}

export type AppMetricType = MinimalAppMetric & {
    timestamp: ClickHouseTimestamp
    app_source: MetricLogSource
}

export interface InsightsFunctionTiming {
    kind: 'fn' | 'async_function'
    duration_ms: number
}

// IMPORTANT: All queue names should be lowercase and only [A-Z0-9] characters are allowed.
export const CYCLOTRON_INVOCATION_JOB_QUEUES = [
    'fn',
    'scriptoverflow',
    'customflow',
    'delay10m',
    'delay60m',
    'delay24h',
    'datawarehouse_table',
] as const
export type CyclotronJobQueueKind = (typeof CYCLOTRON_INVOCATION_JOB_QUEUES)[number]

export const CYCLOTRON_JOB_QUEUE_SOURCES = ['postgres', 'kafka', 'delay', 'shadow'] as const
export type CyclotronJobQueueSource = (typeof CYCLOTRON_JOB_QUEUE_SOURCES)[number]

// Agnostic job invocation type
export type CyclotronJobInvocation = {
    id: string
    teamId: Team['id']
    functionId: string
    // Optional parent run ID, e.g. if this invocation is part of a batch workflow run
    parentRunId?: string | null
    state: Record<string, any> | null
    // The queue that the invocation is on
    queue: CyclotronJobQueueKind
    // Optional parameters for that queue to use
    queueParameters?: CyclotronInvocationQueueParametersType | null
    // Priority of the invocation
    queuePriority: number
    // When the invocation is scheduled to run
    queueScheduledAt?: DateTime
    // Metadata for the invocation - TODO: check when this gets cleared
    queueMetadata?: Record<string, any> | null
    // Where the invocation came from (kafka or postgres)
    queueSource?: CyclotronJobQueueSource
}

// The result of an execution
export type CyclotronJobInvocationResult<T extends CyclotronJobInvocation = CyclotronJobInvocation> = {
    invocation: T
    finished: boolean
    error?: any
    logs: MinimalLogEntry[]
    metrics: MinimalAppMetric[]
    capturedInsightsEvents: InsightsFunctionCapturedEvent[]
    execResult?: unknown
}

export type CyclotronJobInvocationInsightsFunctionContext = {
    globals: InsightsFunctionInvocationGlobalsWithInputs
    vmState?: VMState
    timings: InsightsFunctionTiming[]
    attempts: number // Indicates the number of times this invocation has been attempted (for example if it gets scheduled for retries)
}

export type CyclotronJobInvocationInsightsFunction = CyclotronJobInvocation & {
    state: CyclotronJobInvocationInsightsFunctionContext
    insightsFunction: InsightsFunctionType
}

export type CyclotronJobInvocationInsightsFlow = CyclotronJobInvocation & {
    state?: InsightsFlowInvocationContext
    insightsFlow: InsightsFlow
    person?: CyclotronPerson
    filterGlobals: InsightsFunctionFilterGlobals
}

export type InsightsFlowInvocationContext = {
    event: InsightsFunctionInvocationGlobals['event']
    actionStepCount: number
    currentAction?: {
        id: string
        startedAtTimestamp: number
        insightsFunctionState?: CyclotronJobInvocationInsightsFunctionContext
    }
    variables?: Record<string, any>
}

// Mostly copied from frontend types
export type InsightsFunctionInputSchemaType = {
    type:
        | 'string'
        | 'number'
        | 'boolean'
        | 'dictionary'
        | 'choice'
        | 'json'
        | 'integration'
        | 'integration_field'
        | 'email'
        | 'native_email'
    key: string
    label?: string
    choices?: { value: string; label: string }[]
    required?: boolean
    default?: any
    secret?: boolean
    hidden?: boolean
    description?: string
    integration?: string
    integration_key?: string
    requires_field?: string
    integration_field?: string
    requiredScopes?: string
    /**
     * templating: true indicates the field supports templating. Alternatively
     * it can be set to 'fn' or 'liquid' to specify the default templating engine to use.
     */
    templating?: boolean | 'fn' | 'liquid'
}

export type InsightsFunctionTypeType =
    | 'destination'
    | 'transformation'
    | 'internal_destination'
    | 'source_webhook'
    | 'warehouse_source_webhook'
    | 'site_destination'

export interface InsightsFunctionMappingType {
    inputs_schema?: InsightsFunctionInputSchemaType[]
    inputs?: Record<string, CyclotronInputType> | null
    filters?: InsightsFunctionFilters | null
}

export type InsightsFunctionType = {
    id: string
    type: InsightsFunctionTypeType
    team_id: number
    name: string
    enabled: boolean
    deleted: boolean
    script: string
    bytecode: ScriptBytecode
    inputs_schema?: InsightsFunctionInputSchemaType[]
    inputs?: Record<string, CyclotronInputType | null>
    encrypted_inputs?: Record<string, CyclotronInputType>
    filters?: InsightsFunctionFilters | null
    mappings?: InsightsFunctionMappingType[] | null
    masking?: InsightsFunctionMasking | null
    template_id?: string
    execution_order?: number
    created_at: string
    updated_at: string
    metadata?: Record<string, any>
}

export type InsightsFunctionMappingTemplate = InsightsFunctionMappingType & {
    name: string
    include_by_default?: boolean
}

export type InsightsFunctionTemplate = {
    status: 'stable' | 'alpha' | 'beta' | 'deprecated' | 'coming_soon' | 'hidden'
    free: boolean
    type: InsightsFunctionTypeType
    id: string
    name: string
    description: string
    code: string
    inputs_schema: InsightsFunctionInputSchemaType[]
    category: string[]
    filters?: InsightsFunctionFilters
    mappings?: InsightsFunctionMappingType[]
    mapping_templates?: InsightsFunctionMappingTemplate[]
    masking?: InsightsFunctionMasking
    icon_url?: string
    code_language: 'javascript' | 'fn'
}

export type InsightsFunctionTemplateCompiled = InsightsFunctionTemplate & {
    bytecode: ScriptBytecode
}

// Slightly different model from the DB
export type DBInsightsFunctionTemplate = {
    id: string
    template_id: string
    sha: string
    name: string
    inputs_schema: InsightsFunctionInputSchemaType[]
    bytecode: ScriptBytecode
    type: InsightsFunctionTypeType
    free: boolean
}

export type IntegrationType = {
    id: number
    team_id: number
    kind: 'slack' | 'email' | 'oauth'
    config: Record<string, any>
    sensitive_config: Record<string, any>
}

export type InsightsFunctionCapturedEvent = {
    team_id: number
    event: string
    distinct_id: string
    timestamp: string
    properties: Record<string, any>
}

export type Response = {
    status: number
    data: any
    content: string
    headers: Record<string, any>
}

export type NativeTemplate = Omit<InsightsFunctionTemplate, 'code' | 'code_language'> & {
    perform: (
        request: (
            url: string,
            options: {
                method?: 'POST' | 'GET' | 'PATCH' | 'PUT' | 'DELETE'
                headers: Record<string, any>
                json?: any
                body?: string | URLSearchParams
                throwHttpErrors?: boolean
                searchParams?: Record<string, any>
            }
        ) => Promise<Response>,
        inputs: Record<string, any>
    ) => Promise<any> | any
}
