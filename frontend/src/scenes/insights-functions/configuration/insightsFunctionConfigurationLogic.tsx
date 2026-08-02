import { deepEqual as equal } from 'fast-equals'
import {
    MakeLogicType,
    actions,
    afterMount,
    connect,
    isBreakpoint,
    kea,
    key,
    listeners,
    path,
    props,
    reducers,
    selectors,
} from 'kea'
import { DeepPartialMap, ValidationErrorType, forms } from 'kea-forms'
import type { DeepPartial, FieldName } from 'kea-forms'
import { loaders } from 'kea-loaders'
import { beforeUnload, router, urlToAction } from 'kea-router'
import { CombinedLocation } from 'kea-router/lib/utils'
import { subscriptions } from 'kea-subscriptions'
import insights from 'insights-js'

import { toast } from '@hanzo/elements'

import api from 'lib/api'
import {
    CyclotronJobInputsValidation,
    CyclotronJobInputsValidationResult,
} from 'lib/components/CyclotronJob/CyclotronJobInputsValidation'
import { dayjs } from 'lib/dayjs'
import { deleteWithUndo } from 'lib/utils/deleteWithUndo'
import { uuid } from 'lib/utils/dom'
import { addProductIntent } from 'lib/utils/product-intents'
import { asDisplay } from 'scenes/persons/person-utils'
import { projectLogic } from 'scenes/projectLogic'
import { buildSurveyExampleInvocationGlobals } from 'scenes/surveys/utils'
import { teamLogic } from 'scenes/teamLogic'
import { urls } from 'scenes/urls'
import { userLogic } from 'scenes/userLogic'

import { deleteFromTree, refreshTreeItem } from '~/layout/panel-layout/ProjectTree/projectTreeLogic'
import { groupsModel } from '~/models/groupsModel'
import { defaultDataTableColumns } from '~/queries/nodes/DataTable/utils'
import { performQuery } from '~/queries/query'
import {
    DataTableNode,
    EventsNode,
    EventsQuery,
    NodeKind,
    ProductIntentContext,
    ProductKey,
    TrendsQuery,
} from '~/queries/schema/schema-general'
import { escapePropertyAsInsightsQLIdentifier, insightsql, setLatestVersionsOnQuery } from '~/queries/utils'
import {
    AnyPropertyFilter,
    AvailableFeature,
    BaseMathType,
    ChartDisplayType,
    CyclotronJobFiltersType,
    CyclotronJobInputSchemaType,
    CyclotronJobInputType,
    CyclotronJobInvocationGlobals,
    CyclotronJobInvocationGlobalsWithInputs,
    EventType,
    FilterLogicalOperator,
    InsightsFunctionConfigurationContextId,
    InsightsFunctionConfigurationType,
    InsightsFunctionMappingType,
    InsightsFunctionTemplateType,
    InsightsFunctionType,
    InsightsFunctionTypeType,
    HogWatcherState,
    PersonType,
    PropertyFilterType,
    PropertyGroupFilter,
    PropertyGroupFilterValue,
    Survey,
    SurveyEventName,
    SurveyEventProperties,
} from '~/types'

import type { GroupType, GroupTypeIndex, InsightsFunctionMappingTemplateType, ProjectType } from '../../../types'
import type { TeamPublicType, TeamType } from '../../../types'
import { performWideEventsQueryInTwoPhases } from '../sampleEventsQuery'
import { eventToInsightsFunctionContextId } from '../sub-templates/sub-templates'
import { SAMPLE_GLOBALS_CONTEXTS } from './sampleGlobalsContexts'

export interface InsightsFunctionConfigurationLogicProps {
    logicKey?: string
    templateId?: string | null
    subTemplateId?: string | null
    id?: string | null
}

export const EVENT_VOLUME_DAILY_WARNING_THRESHOLD = 1000
const UNSAVED_CONFIGURATION_TTL = 1000 * 60 * 5
export const FN_CODE_SIZE_LIMIT = 100 * 1024 // 100KB to match backend limit

const VALIDATION_RULES = {
    SITE_DESTINATION_REQUIRES_MAPPINGS: (data: InsightsFunctionConfigurationType) =>
        data.type === 'site_destination' && (!data.mappings || data.mappings.length === 0)
            ? 'You must add at least one mapping'
            : undefined,
    INTERNAL_DESTINATION_REQUIRES_FILTERS: (data: InsightsFunctionConfigurationType) =>
        data.type === 'internal_destination' && data.filters?.events?.length === 0
            ? 'You must choose a filter'
            : undefined,
} as const

const NEW_FUNCTION_TEMPLATE: InsightsFunctionTemplateType = {
    id: 'new',
    free: false,
    type: 'destination',
    name: '',
    description: '',
    inputs_schema: [],
    code_language: 'script',
    code: "print('Hello, world!');",
    status: 'stable',
}

export const TYPES_WITH_GLOBALS: InsightsFunctionTypeType[] = ['transformation', 'transformation_log', 'destination']
export const TYPES_WITH_REAL_EVENTS: InsightsFunctionTypeType[] = ['destination', 'site_destination', 'transformation']
export const TYPES_WITH_VOLUME_WARNING: InsightsFunctionTypeType[] = ['destination', 'site_destination']

const TYPE_TO_PRODUCT_KEY: Partial<Record<InsightsFunctionTypeType, ProductKey>> = {
    destination: ProductKey.PIPELINE_DESTINATIONS,
    site_destination: ProductKey.PIPELINE_DESTINATIONS,
    transformation: ProductKey.PIPELINE_TRANSFORMATIONS,
    transformation_log: ProductKey.LOGS,
    site_app: ProductKey.SITE_APPS,
}

// Sample record shown in the log transformation testing UI (no events table to sample from).
const EXAMPLE_LOG_RECORD: NonNullable<CyclotronJobInvocationGlobals['record']> = {
    body: 'GET /api/users 200 in 42ms user=jane@example.com',
    attributes: { 'http.method': 'GET', 'http.status_code': '200' },
    resource_attributes: { 'service.name': 'api', 'k8s.namespace.name': 'production' },
    severity_text: 'info',
    severity_number: 9,
    service_name: 'api',
    instrumentation_scope: 'http.server',
    event_name: null,
    timestamp: 1780000000000000000,
    observed_timestamp: 1780000000000000000,
    trace_id: null,
    span_id: null,
}

export function sanitizeInputs(
    data: Pick<InsightsFunctionMappingType, 'inputs_schema' | 'inputs'>
): Record<string, CyclotronJobInputType> {
    const sanitizedInputs: Record<string, CyclotronJobInputType> = {}
    data.inputs_schema?.forEach((inputSchema) => {
        const templatingEnabled = inputSchema.templating ?? true
        const input = data.inputs?.[inputSchema.key]
        const secret = input?.secret
        let value = input?.value

        if (secret) {
            // If set this means we haven't changed the value
            sanitizedInputs[inputSchema.key] = {
                value: '********', // Don't send the actual value
                secret: true,
            }
            return
        }

        if (inputSchema.type === 'json' && typeof value === 'string') {
            try {
                value = JSON.parse(value)
            } catch {
                // Ignore
            }
        }

        sanitizedInputs[inputSchema.key] = {
            value: value,
            templating: templatingEnabled ? (input?.templating ?? 'script') : undefined,
        }
    })

    return sanitizedInputs
}

export function sanitizeConfiguration(data: InsightsFunctionConfigurationType): InsightsFunctionConfigurationType {
    const filters = data.filters ?? {}
    filters.source = filters.source ?? 'events'

    if (filters.source === 'person-updates' || Array.isArray(data?.mappings)) {
        // Ensure we aren't passing in values that aren't supported
        delete filters.actions
        delete filters.events
    }

    const payload: InsightsFunctionConfigurationType = {
        ...data,
        filters: data.filters,
        mappings: data.mappings?.map((mapping) => ({
            ...mapping,
            inputs: sanitizeInputs(mapping),
        })),
        inputs: sanitizeInputs(data),
        masking: data.masking?.hash ? data.masking : null,
        icon_url: data.icon_url,
    }

    return payload
}

export const templateToConfiguration = (template: InsightsFunctionTemplateType): InsightsFunctionConfigurationType => {
    function getInputs(inputs_schema?: CyclotronJobInputSchemaType[] | null): Record<string, CyclotronJobInputType> {
        const inputs: Record<string, CyclotronJobInputType> = {}
        inputs_schema?.forEach((schema) => {
            if (schema.default !== undefined) {
                inputs[schema.key] = { value: schema.default }
            }
        })
        return inputs
    }

    let mappings: InsightsFunctionMappingType[] | undefined

    if (template?.mapping_templates) {
        mappings = template.mapping_templates
            .filter((t) => t.include_by_default)
            .map((template) => ({
                ...template,
                inputs: template.inputs_schema?.reduce(
                    (acc, input) => {
                        acc[input.key] = { value: input.default }
                        return acc
                    },
                    {} as Record<string, CyclotronJobInputType>
                ),
            }))
    }

    return {
        type: template.type ?? 'destination',
        name: template.name,
        description: typeof template.description === 'string' ? template.description : '',
        inputs_schema: template.inputs_schema,
        filters: template.filters,
        mappings: mappings,
        script: template.code,
        icon_url: template.icon_url,
        inputs: getInputs(template.inputs_schema),
        enabled: true,
    }
}

export function convertToInsightsFunctionInvocationGlobals(
    event: EventType,
    person: PersonType
): CyclotronJobInvocationGlobals {
    const team = teamLogic.findMounted()?.values?.currentTeam
    const projectUrl = `${window.location.origin}/project/${team?.id}`
    return {
        project: {
            id: team?.id ?? 0,
            name: team?.name ?? 'Default project',
            url: projectUrl,
        },
        event: {
            uuid: event.uuid ?? '',
            event: event.event,
            distinct_id: event.distinct_id,
            elements_chain: event.elements_chain ?? '',
            properties: event.properties,
            timestamp: event.timestamp,

            url: `${projectUrl}/events/${encodeURIComponent(event.uuid ?? '')}/${encodeURIComponent(event.timestamp)}`,
        },
        person: {
            id: person.uuid ?? '',
            properties: person.properties,

            name: asDisplay(person),
            url: `${projectUrl}/person/${encodeURIComponent(event.distinct_id)}`,
        },
        groups: {},
    }
}

export type SparklineData = {
    data: { name: string; values: number[]; color: string }[]
    count: number
    labels: string[]
    warning?: string
}

// Helper function to check if code might return null/undefined
export function mightDropEvents(code: string): boolean {
    const sanitizedCode = code
        .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '') // Remove comments
        .replace(/\s+/g, ' ') // Collapse whitespace
        .trim()

    if (!sanitizedCode) {
        return false
    }

    // Direct null/undefined returns
    if (
        sanitizedCode.includes('return null') ||
        sanitizedCode.includes('return undefined') ||
        /\breturn\b\s*;/.test(sanitizedCode) ||
        /\breturn\b\s*$/.test(sanitizedCode) ||
        /\bif\s*\([^)]*\)\s*\{\s*\breturn\s+(null|undefined)\b/.test(sanitizedCode)
    ) {
        return true
    }

    // Check for variables set to null/undefined that are also returned
    const nullVarMatch = code.match(/\blet\s+(\w+)\s*:?=\s*(null|undefined)/g)
    if (nullVarMatch) {
        // Extract variable names
        const nullVars = nullVarMatch
            .map((match) => {
                return match.match(/\blet\s+(\w+)/)?.[1]
            })
            .filter(Boolean)

        // Check if any of these variables are returned
        for (const varName of nullVars) {
            if (new RegExp(`\\breturn\\s+${varName}\\b`).test(code)) {
                return true
            }
        }
    }

    return false
}

// Generated by kea-typegen. Update if you're an agent, ignore if you're human.
export interface insightsFunctionConfigurationLogicValues {
    groupTypes: Map<GroupTypeIndex, GroupType> // groupsModel
    currentProject: ProjectType | null // projectLogic
    currentProjectId: number | null // projectLogic
    currentTeam: TeamPublicType | TeamType | null // teamLogic
    hasAvailableFeature: (feature: AvailableFeature, currentUsage?: number | undefined) => boolean // userLogic
    baseEventsQuery: EventsQuery | null
    canEditSource: boolean
    canLoadSampleGlobals: boolean
    configuration: InsightsFunctionConfigurationType
    configurationAllErrors: Record<string, any>
    configurationChanged: boolean
    configurationErrors: DeepPartialMap<InsightsFunctionConfigurationType, ValidationErrorType>
    configurationHasErrors: boolean
    configurationManualErrors: Record<string, any>
    configurationTouched: boolean
    configurationTouches: Record<string, boolean>
    configurationValidationErrors: DeepPartialMap<InsightsFunctionConfigurationType, ValidationErrorType>
    contextId: InsightsFunctionConfigurationContextId
    currentHogCode: string
    currentInputs: CyclotronJobInputSchemaType[]
    defaultFormState: InsightsFunctionConfigurationType | null
    eventsDataTableNode: DataTableNode | null
    exampleInvocationGlobals: CyclotronJobInvocationGlobals
    filtersContainPersonProperties: boolean
    hasGroupsAddon: boolean
    hasHadSubmissionErrors: boolean
    insightsFunction: InsightsFunctionType | null
    insightsFunctionLoading: boolean
    inputFormErrors: Record<string, string> | null
    inputFormWarnings: Record<string, string>
    inputsDiff: {
        newInputs: CyclotronJobInputSchemaType[]
        oldInputs: CyclotronJobInputSchemaType[]
    } | null
    inputsValidation: CyclotronJobInputsValidationResult
    isConfigurationSubmitting: boolean
    isConfigurationValid: boolean
    isLegacyPlugin: boolean | undefined
    lastEventQuery: EventsQuery | null
    lastEventSecondQuery: EventsQuery | null
    loaded: boolean
    loading: boolean
    logicProps: InsightsFunctionConfigurationLogicProps
    mappingTemplates: InsightsFunctionMappingTemplateType[]
    matchingFilters: PropertyGroupFilter
    mightDropEvents: boolean
    newFilters: CyclotronJobFiltersType | null
    newHogCode: string | null
    newInputs: CyclotronJobInputSchemaType[] | null
    oldFilters: CyclotronJobFiltersType | null
    oldHogCode: string | null
    oldInputs: CyclotronJobInputSchemaType[] | null
    sampleGlobals: CyclotronJobInvocationGlobals | null
    sampleGlobalsError: string | null
    sampleGlobalsLoading: boolean
    sampleGlobalsWithInputs: CyclotronJobInvocationGlobalsWithInputs
    showConfigurationErrors: boolean
    showEventsList: boolean
    showExpectedVolume: boolean
    showFilters: boolean
    showSource: boolean
    showTesting: boolean
    sourceUsesEvents: boolean
    sparkline: SparklineData | null
    sparklineLoading: boolean
    sparklineQuery: TrendsQuery | null
    survey: Survey | null
    surveyIdFromFilters: string | null
    surveyLoading: boolean
    template: InsightsFunctionTemplateType | null
    templateHasChanged: boolean | '' | undefined
    templateId: string | undefined
    templateLoading: boolean
    type: InsightsFunctionTypeType
    unsavedConfiguration: {
        configuration: InsightsFunctionConfigurationType
        timestamp: number
    } | null
    useMapping: number | true | undefined
    usesGroups: boolean
    willChangeEnabledOnSave: boolean
    willReEnableOnSave: boolean
}

// Generated by kea-typegen. Update if you're an agent, ignore if you're human.
export interface insightsFunctionConfigurationLogicActions {
    clearFiltersDiff: () => {
        value: true
    }
    clearHogCodeDiff: () => {
        value: true
    }
    clearInputsDiff: () => {
        value: true
    }
    deleteInsightsFunction: () => {
        value: true
    }
    duplicate: () => {
        value: true
    }
    duplicateFromTemplate: () => {
        value: true
    }
    loadInsightsFunction: () => any
    loadInsightsFunctionFailure: (
        error: string,
        errorObject?: any
    ) => {
        error: string
        errorObject?: any
    }
    loadInsightsFunctionSuccess: (
        insightsFunction: InsightsFunctionType | null,
        payload?: any
    ) => {
        insightsFunction: InsightsFunctionType | null
        payload?: any
    }
    loadSampleGlobals: (payload?: { eventId?: string }) => {
        eventId: string | undefined
    }
    loadSampleGlobalsFailure: (
        error: string,
        errorObject?: any
    ) => {
        error: string
        errorObject?: any
    }
    loadSampleGlobalsSuccess: (
        sampleGlobals: CyclotronJobInvocationGlobals | null,
        payload?: {
            eventId: string | undefined
        }
    ) => {
        sampleGlobals: CyclotronJobInvocationGlobals | null
        payload?: {
            eventId: string | undefined
        }
    }
    loadSurvey: () => any
    loadSurveyFailure: (
        error: string,
        errorObject?: any
    ) => {
        error: string
        errorObject?: any
    }
    loadSurveySuccess: (
        survey: Survey | null,
        payload?: any
    ) => {
        survey: Survey | null
        payload?: any
    }
    loadTemplate: () => any
    loadTemplateFailure: (
        error: string,
        errorObject?: any
    ) => {
        error: string
        errorObject?: any
    }
    loadTemplateSuccess: (
        template: InsightsFunctionTemplateType | null,
        payload?: any
    ) => {
        template: InsightsFunctionTemplateType | null
        payload?: any
    }
    persistForUnload: () => {
        value: true
    }
    reportAIFiltersAccepted: () => {
        value: true
    }
    reportAIFiltersPromptOpen: () => {
        value: true
    }
    reportAIFiltersPrompted: () => {
        value: true
    }
    reportAIFiltersRejected: () => {
        value: true
    }
    reportAIInsightsFunctionAccepted: () => {
        value: true
    }
    reportAIInsightsFunctionInputsAccepted: () => {
        value: true
    }
    reportAIInsightsFunctionInputsPromptOpen: () => {
        value: true
    }
    reportAIInsightsFunctionInputsPrompted: () => {
        value: true
    }
    reportAIInsightsFunctionInputsRejected: () => {
        value: true
    }
    reportAIInsightsFunctionPromptOpen: () => {
        value: true
    }
    reportAIInsightsFunctionPrompted: () => {
        value: true
    }
    reportAIInsightsFunctionRejected: () => {
        value: true
    }
    resetConfiguration: (values?: InsightsFunctionConfigurationType) => {
        values?: InsightsFunctionConfigurationType
    }
    resetForm: () => {
        value: true
    }
    resetToTemplate: () => {
        value: true
    }
    setConfigurationManualErrors: (errors: Record<string, any>) => {
        errors: Record<string, any>
    }
    setConfigurationValue: (
        key: FieldName,
        value: any
    ) => {
        name: FieldName
        value: any
    }
    setConfigurationValues: (values: DeepPartial<InsightsFunctionConfigurationType>) => {
        values: DeepPartial<InsightsFunctionConfigurationType>
    }
    setNewFilters: (newFilters: CyclotronJobFiltersType) => {
        newFilters: CyclotronJobFiltersType
    }
    setNewHogCode: (newHogCode: string) => {
        newHogCode: string
    }
    setNewInputs: (newInputs: CyclotronJobInputSchemaType[]) => {
        newInputs: CyclotronJobInputSchemaType[]
    }
    setOldFilters: (oldFilters: CyclotronJobFiltersType) => {
        oldFilters: CyclotronJobFiltersType
    }
    setOldHogCode: (oldHogCode: string) => {
        oldHogCode: string
    }
    setOldInputs: (oldInputs: CyclotronJobInputSchemaType[]) => {
        oldInputs: CyclotronJobInputSchemaType[]
    }
    setSampleGlobals: (sampleGlobals: CyclotronJobInvocationGlobals | null) => {
        sampleGlobals: CyclotronJobInvocationGlobals | null
    }
    setSampleGlobalsError: (error: any) => {
        error: any
    }
    setShowEventsList: (showEventsList: boolean) => {
        showEventsList: boolean
    }
    setShowSource: (showSource: boolean) => {
        showSource: boolean
    }
    setUnsavedConfiguration: (configuration: InsightsFunctionConfigurationType | null) => {
        configuration: InsightsFunctionConfigurationType | null
    }
    sparklineQueryChanged: (sparklineQuery: TrendsQuery) => {
        sparklineQuery: TrendsQuery
    }
    sparklineQueryChangedFailure: (
        error: string,
        errorObject?: any
    ) => {
        error: string
        errorObject?: any
    }
    sparklineQueryChangedSuccess: (
        sparkline:
            | {
                  count: any
                  data: {
                      color: string
                      name: string
                      values: number[]
                  }[]
                  labels: any
                  warning: string | undefined
              }
            | {
                  count: any
                  data: {
                      color: string
                      name: string
                      values: number[]
                  }[]
                  labels: any
                  warning?: undefined
              }
            | null,
        payload?: {
            sparklineQuery: TrendsQuery
        }
    ) => {
        sparkline:
            | {
                  count: any
                  data: {
                      color: string
                      name: string
                      values: number[]
                  }[]
                  labels: any
                  warning: string | undefined
              }
            | {
                  count: any
                  data: {
                      color: string
                      name: string
                      values: number[]
                  }[]
                  labels: any
                  warning?: undefined
              }
            | null
        payload?: {
            sparklineQuery: TrendsQuery
        }
    }
    submitConfiguration: () => {
        value: boolean
    }
    submitConfigurationFailure: (
        error: Error,
        errors: Record<string, any>
    ) => {
        error: Error
        errors: Record<string, any>
    }
    submitConfigurationRequest: (configuration: InsightsFunctionConfigurationType) => {
        configuration: InsightsFunctionConfigurationType
    }
    submitConfigurationSuccess: (configuration: InsightsFunctionConfigurationType) => {
        configuration: InsightsFunctionConfigurationType
    }
    touchConfigurationField: (key: string) => {
        key: string
    }
    upsertInsightsFunction: (configuration: InsightsFunctionConfigurationType) => {
        configuration: InsightsFunctionConfigurationType
    }
    upsertInsightsFunctionFailure: (
        error: string,
        errorObject?: any
    ) => {
        error: string
        errorObject?: any
    }
    upsertInsightsFunctionSuccess: (
        insightsFunction: InsightsFunctionType,
        payload?: {
            configuration: InsightsFunctionConfigurationType
        }
    ) => {
        insightsFunction: InsightsFunctionType
        payload?: {
            configuration: InsightsFunctionConfigurationType
        }
    }
}

// Generated by kea-typegen. Update if you're an agent, ignore if you're human.
export interface insightsFunctionConfigurationLogicMeta {
    key: string
    __keaTypeGenInternalSelectorTypes: {
        logicProps: (arg: any) => InsightsFunctionConfigurationLogicProps
        surveyIdFromFilters: (configuration: InsightsFunctionConfigurationType) => string | null
        type: (configuration: InsightsFunctionConfigurationType, insightsFunction: InsightsFunctionType | null) => InsightsFunctionTypeType
        hasGroupsAddon: (
            hasAvailableFeature: (feature: AvailableFeature, currentUsage?: number | undefined) => boolean
        ) => boolean
        useMapping: (
            insightsFunction: InsightsFunctionType | null,
            template: InsightsFunctionTemplateType | null
        ) => number | true | undefined
        defaultFormState: (
            template: InsightsFunctionTemplateType | null,
            insightsFunction: InsightsFunctionType | null
        ) => InsightsFunctionConfigurationType | null
        templateId: (
            template: InsightsFunctionTemplateType | null,
            insightsFunction: InsightsFunctionType | null
        ) => string | undefined
        loading: (insightsFunctionLoading: boolean, templateLoading: boolean) => boolean
        loaded: (insightsFunction: InsightsFunctionType | null, template: InsightsFunctionTemplateType | null) => boolean
        contextId: (configuration: InsightsFunctionConfigurationType) => InsightsFunctionConfigurationContextId
        inputsValidation: (configuration: InsightsFunctionConfigurationType) => CyclotronJobInputsValidationResult
        inputFormErrors: (inputsValidation: CyclotronJobInputsValidationResult) => Record<string, string> | null
        inputFormWarnings: (inputsValidation: CyclotronJobInputsValidationResult) => Record<string, string>
        willReEnableOnSave: (
            configuration: InsightsFunctionConfigurationType,
            insightsFunction: InsightsFunctionType | null
        ) => boolean
        willChangeEnabledOnSave: (
            configuration: InsightsFunctionConfigurationType,
            insightsFunction: InsightsFunctionType | null
        ) => boolean
        exampleInvocationGlobals: (
            configuration: InsightsFunctionConfigurationType,
            currentProject: ProjectType | null,
            groupTypes: Map<GroupTypeIndex, GroupType>,
            contextId: InsightsFunctionConfigurationContextId,
            survey: Survey | null
        ) => CyclotronJobInvocationGlobals
        sampleGlobalsWithInputs: (
            sampleGlobals: CyclotronJobInvocationGlobals | null,
            exampleInvocationGlobals: CyclotronJobInvocationGlobals,
            configuration: InsightsFunctionConfigurationType
        ) => CyclotronJobInvocationGlobalsWithInputs
        matchingFilters: (
            configuration: InsightsFunctionConfigurationType,
            useMapping: number | true | undefined
        ) => PropertyGroupFilter
        filtersContainPersonProperties: (configuration: InsightsFunctionConfigurationType) => boolean
        sourceUsesEvents: (configuration: InsightsFunctionConfigurationType, type: InsightsFunctionTypeType) => boolean
        sparklineQuery: (
            configuration: InsightsFunctionConfigurationType,
            matchingFilters: PropertyGroupFilter,
            sourceUsesEvents: boolean
        ) => TrendsQuery | null
        baseEventsQuery: (
            configuration: InsightsFunctionConfigurationType,
            matchingFilters: PropertyGroupFilter,
            groupTypes: Map<GroupTypeIndex, GroupType>,
            sourceUsesEvents: boolean
        ) => EventsQuery | null
        eventsDataTableNode: (baseEventsQuery: EventsQuery | null) => DataTableNode | null
        lastEventQuery: (baseEventsQuery: EventsQuery | null) => EventsQuery | null
        lastEventSecondQuery: (lastEventQuery: EventsQuery | null) => EventsQuery | null
        templateHasChanged: (
            insightsFunction: InsightsFunctionType | null,
            configuration: InsightsFunctionConfigurationType
        ) => boolean | '' | undefined
        mappingTemplates: (
            insightsFunction: InsightsFunctionType | null,
            template: InsightsFunctionTemplateType | null
        ) => InsightsFunctionMappingTemplateType[]
        usesGroups: (configuration: InsightsFunctionConfigurationType) => boolean
        mightDropEvents: (configuration: InsightsFunctionConfigurationType, type: InsightsFunctionTypeType) => boolean
        currentHogCode: (newHogCode: string | null, configuration: InsightsFunctionConfigurationType) => string
        currentInputs: (
            newInputs: CyclotronJobInputSchemaType[] | null,
            configuration: InsightsFunctionConfigurationType
        ) => CyclotronJobInputSchemaType[]
        inputsDiff: (
            oldInputs: CyclotronJobInputSchemaType[] | null,
            newInputs: CyclotronJobInputSchemaType[] | null
        ) => {
            newInputs: CyclotronJobInputSchemaType[]
            oldInputs: CyclotronJobInputSchemaType[]
        } | null
        canLoadSampleGlobals: (
            lastEventQuery: EventsQuery | null,
            contextId: InsightsFunctionConfigurationContextId
        ) => boolean
        showFilters: (type: InsightsFunctionTypeType) => boolean
        showExpectedVolume: (type: InsightsFunctionTypeType, sourceUsesEvents: boolean) => boolean
        canEditSource: (
            type: InsightsFunctionTypeType,
            template: InsightsFunctionTemplateType | null,
            insightsFunction: InsightsFunctionType | null
        ) => boolean
        showTesting: (type: InsightsFunctionTypeType) => boolean
        isLegacyPlugin: (
            template: InsightsFunctionTemplateType | null,
            insightsFunction: InsightsFunctionType | null
        ) => boolean | undefined
    }
}

export type insightsFunctionConfigurationLogicType = MakeLogicType<
    insightsFunctionConfigurationLogicValues,
    insightsFunctionConfigurationLogicActions,
    InsightsFunctionConfigurationLogicProps,
    insightsFunctionConfigurationLogicMeta
>

export const insightsFunctionConfigurationLogic = kea<insightsFunctionConfigurationLogicType>([
    path((id) => ['scenes', 'pipeline', 'insightsFunctionConfigurationLogic', id]),
    props({} as InsightsFunctionConfigurationLogicProps),
    key(({ id, templateId, subTemplateId, logicKey }: InsightsFunctionConfigurationLogicProps) => {
        let baseKey = id ?? templateId ?? 'new'
        if (subTemplateId) {
            baseKey = `${subTemplateId}_${baseKey}`
        }
        return logicKey ? `${logicKey}_${baseKey}` : baseKey
    }),
    connect(() => ({
        values: [
            projectLogic,
            ['currentProjectId', 'currentProject'],
            groupsModel,
            ['groupTypes'],
            userLogic,
            ['hasAvailableFeature'],
            teamLogic,
            ['currentTeam'],
        ],
    })),
    actions({
        setShowSource: (showSource: boolean) => ({ showSource }),
        resetForm: true,
        upsertInsightsFunction: (configuration: InsightsFunctionConfigurationType) => ({ configuration }),
        duplicate: true,
        duplicateFromTemplate: true,
        resetToTemplate: true,
        deleteInsightsFunction: true,
        sparklineQueryChanged: (sparklineQuery: TrendsQuery) =>
            ({
                sparklineQuery,
            }) as { sparklineQuery: TrendsQuery },
        loadSampleGlobals: (payload?: { eventId?: string }) => ({ eventId: payload?.eventId }),
        setUnsavedConfiguration: (configuration: InsightsFunctionConfigurationType | null) => ({ configuration }),
        persistForUnload: true,
        setSampleGlobalsError: (error) => ({ error }),
        setSampleGlobals: (sampleGlobals: CyclotronJobInvocationGlobals | null) => ({ sampleGlobals }),
        setShowEventsList: (showEventsList: boolean) => ({ showEventsList }),
        setOldHogCode: (oldHogCode: string) => ({ oldHogCode }),
        setNewHogCode: (newHogCode: string) => ({ newHogCode }),
        clearHogCodeDiff: true,
        reportAIInsightsFunctionPrompted: true,
        reportAIInsightsFunctionAccepted: true,
        reportAIInsightsFunctionRejected: true,
        reportAIInsightsFunctionPromptOpen: true,
        setOldFilters: (oldFilters: CyclotronJobFiltersType) => ({ oldFilters }),
        setNewFilters: (newFilters: CyclotronJobFiltersType) => ({ newFilters }),
        clearFiltersDiff: true,
        reportAIFiltersPrompted: true,
        reportAIFiltersAccepted: true,
        reportAIFiltersRejected: true,
        reportAIFiltersPromptOpen: true,
        setOldInputs: (oldInputs: CyclotronJobInputSchemaType[]) => ({ oldInputs }),
        setNewInputs: (newInputs: CyclotronJobInputSchemaType[]) => ({ newInputs }),
        clearInputsDiff: true,
        reportAIInsightsFunctionInputsPrompted: true,
        reportAIInsightsFunctionInputsAccepted: true,
        reportAIInsightsFunctionInputsRejected: true,
        reportAIInsightsFunctionInputsPromptOpen: true,
    }),
    reducers(({ props }) => ({
        sampleGlobals: [
            null as CyclotronJobInvocationGlobals | null,
            {
                setSampleGlobals: (_, { sampleGlobals }) => sampleGlobals,
            },
        ],
        showSource: [
            // Show source by default for blank templates when creating a new function
            !!(!props.id && props.templateId?.startsWith('template-blank-')),
            {
                setShowSource: (_, { showSource }) => showSource,
            },
        ],

        hasHadSubmissionErrors: [
            false,
            {
                upsertInsightsFunctionFailure: () => true,
            },
        ],

        unsavedConfiguration: [
            null as { timestamp: number; configuration: InsightsFunctionConfigurationType } | null,
            { persist: true },
            {
                setUnsavedConfiguration: (_, { configuration }) =>
                    configuration ? { timestamp: Date.now(), configuration } : null,
            },
        ],

        sampleGlobalsError: [
            null as null | string,
            {
                loadSampleGlobals: () => null,
                setSampleGlobalsError: (_, { error }) => error,
            },
        ],
        showEventsList: [
            false,
            {
                setShowEventsList: (_, { showEventsList }) => showEventsList,
            },
        ],
        oldHogCode: [
            null as string | null,
            {
                setOldHogCode: (_, { oldHogCode }) => oldHogCode,
                clearHogCodeDiff: () => null,
            },
        ],
        newHogCode: [
            null as string | null,
            {
                setNewHogCode: (_, { newHogCode }) => newHogCode,
                clearHogCodeDiff: () => null,
            },
        ],
        oldFilters: [
            null as CyclotronJobFiltersType | null,
            {
                setOldFilters: (_, { oldFilters }) => oldFilters,
                clearFiltersDiff: () => null,
            },
        ],
        newFilters: [
            null as CyclotronJobFiltersType | null,
            {
                setNewFilters: (_, { newFilters }) => newFilters,
                clearFiltersDiff: () => null,
            },
        ],
        oldInputs: [
            null as CyclotronJobInputSchemaType[] | null,
            {
                setOldInputs: (_, { oldInputs }) => oldInputs,
                clearInputsDiff: () => null,
            },
        ],
        newInputs: [
            null as CyclotronJobInputSchemaType[] | null,
            {
                setNewInputs: (_, { newInputs }) => newInputs,
                clearInputsDiff: () => null,
            },
        ],
    })),
    loaders(({ actions, props, values, cache }) => ({
        template: [
            null as InsightsFunctionTemplateType | null,
            {
                loadTemplate: async () => {
                    cache.configFromUrl = router.values.hashParams.configuration
                    if (!props.templateId) {
                        return null
                    }

                    if (props.templateId === 'new') {
                        return {
                            ...NEW_FUNCTION_TEMPLATE,
                        }
                    }

                    const res = await api.insightsFunctions.getTemplate(props.templateId)

                    if (!res) {
                        throw new Error('Template not found')
                    }
                    return res
                },
            },
        ],

        insightsFunction: [
            null as InsightsFunctionType | null,
            {
                loadInsightsFunction: async () => {
                    if (!props.id || props.id === 'new') {
                        return null
                    }

                    return await api.insightsFunctions.get(props.id)
                },

                upsertInsightsFunction: async ({ configuration }) => {
                    const isNew = !props.id || props.id === 'new'
                    const res = isNew
                        ? await api.insightsFunctions.create(configuration)
                        : await api.insightsFunctions.update(props.id!, configuration)

                    insights.capture('script function saved', {
                        id: res.id,
                        template_id: res.template?.id,
                        template_name: res.template?.name,
                        type: res.type,
                        enabled: res.enabled,
                    })

                    // Track product intent when creating a new script function
                    if (isNew) {
                        const productKey = TYPE_TO_PRODUCT_KEY[res.type]
                        if (productKey) {
                            void addProductIntent({
                                product_type: productKey,
                                intent_context: ProductIntentContext.DATA_PIPELINE_CREATED,
                            })
                        }
                    }

                    const errorTrackingTriggerEvent = res.filters?.events
                        ?.map((event) => event.id)
                        ?.find((id) =>
                            [
                                '$error_tracking_issue_created',
                                '$error_tracking_issue_reopened',
                                '$error_tracking_issue_spiking',
                            ].includes(id)
                        )
                    if (isNew && errorTrackingTriggerEvent) {
                        insights.capture('error_tracking_alert_created', {
                            source: 'traditional',
                            trigger_event: errorTrackingTriggerEvent,
                            subtemplate_id: res.template?.id,
                            has_custom_filters: res.filters && Object.keys(res.filters).length > 1,
                            enabled: res.enabled,
                        })
                    }

                    toast.success('Configuration saved')
                    refreshTreeItem('insights_function/', res.id)

                    return res
                },
            },
        ],

        sparkline: [
            null as null | SparklineData,
            {
                sparklineQueryChanged: async ({ sparklineQuery }, breakpoint) => {
                    if (!TYPES_WITH_REAL_EVENTS.includes(values.type)) {
                        return null
                    }
                    if (values.sparkline === null) {
                        await breakpoint(100)
                    } else {
                        await breakpoint(1000)
                    }
                    const result = await performQuery(sparklineQuery)
                    breakpoint()

                    const dataValues: number[] = result?.results?.[0]?.data ?? []
                    const showVolumeWarning = TYPES_WITH_VOLUME_WARNING.includes(values.type)

                    if (showVolumeWarning) {
                        const [underThreshold, overThreshold] = dataValues.reduce(
                            (acc, val: number) => {
                                acc[0].push(Math.min(val, EVENT_VOLUME_DAILY_WARNING_THRESHOLD))
                                acc[1].push(Math.max(0, val - EVENT_VOLUME_DAILY_WARNING_THRESHOLD))
                                return acc
                            },
                            [[], []] as [number[], number[]]
                        )
                        const data = [
                            {
                                name: 'Low volume',
                                values: underThreshold,
                                color: 'success',
                            },
                            {
                                name: 'High volume',
                                values: overThreshold,
                                color: 'warning',
                            },
                        ]
                        return { data, count: result?.results?.[0]?.count, labels: result?.results?.[0]?.labels }
                    }
                    // For transformations, just show the raw values without warning thresholds
                    const data = [
                        {
                            name: 'Volume',
                            values: dataValues,
                            color: 'success',
                        },
                    ]
                    return {
                        data,
                        count: result?.results?.[0]?.count,
                        labels: result?.results?.[0]?.labels,
                        warning:
                            values.type === 'transformation'
                                ? 'Historical volume may not reflect future volume after transformation is applied.'
                                : undefined,
                    }
                },
            },
        ],

        sampleGlobals: [
            null as CyclotronJobInvocationGlobals | null,
            {
                loadSampleGlobals: async ({ eventId }, breakpoint) => {
                    const sampleGlobalsLoader = SAMPLE_GLOBALS_CONTEXTS[values.contextId]
                    if (sampleGlobalsLoader) {
                        try {
                            const globals = await sampleGlobalsLoader(values.exampleInvocationGlobals)
                            breakpoint()
                            return globals
                        } catch (e: any) {
                            if (isBreakpoint(e)) {
                                // Superseded by a newer load — abort without dispatching a result
                                throw e
                            }
                            actions.setSampleGlobalsError(e.message)
                            return values.exampleInvocationGlobals
                        }
                    }
                    if (!values.lastEventQuery) {
                        return values.sampleGlobals
                    }
                    const errorMessage =
                        'No events match these filters in the last 30 days. Showing an example $pageview event instead.'
                    try {
                        await breakpoint(values.sampleGlobals === null ? 10 : 1000)
                        let response = await performWideEventsQueryInTwoPhases({
                            ...values.lastEventQuery,
                            properties: eventId
                                ? [
                                      {
                                          type: PropertyFilterType.InsightsQL,
                                          key: `uuid = '${eventId}'`,
                                      },
                                  ]
                                : undefined,
                        })
                        if (!response?.results?.[0] && values.lastEventSecondQuery) {
                            response = await performWideEventsQueryInTwoPhases({
                                ...values.lastEventSecondQuery,
                                properties: eventId
                                    ? [
                                          {
                                              type: PropertyFilterType.InsightsQL,
                                              key: `uuid = '${eventId}'`,
                                          },
                                      ]
                                    : undefined,
                            })
                        }
                        if (!response?.results?.[0]) {
                            throw new Error(errorMessage)
                        }
                        const event: EventType = response?.results?.[0]?.[0]
                        const person: PersonType = response?.results?.[0]?.[1]
                        const globals = convertToInsightsFunctionInvocationGlobals(event, person)
                        globals.groups = {}
                        values.groupTypes.forEach((groupType, index) => {
                            const tuple = response?.results?.[0]?.[2 + index]
                            if (tuple && Array.isArray(tuple) && tuple[2]) {
                                let properties = {}
                                try {
                                    properties = JSON.parse(tuple[3])
                                } catch {
                                    // Ignore
                                }
                                globals.groups![groupType.group_type] = {
                                    type: groupType.group_type,
                                    index: tuple[1],
                                    id: tuple[2], // TODO: rename to "key"?
                                    url: `${window.location.origin}/groups/${tuple[1]}/${encodeURIComponent(tuple[2])}`,
                                    properties,
                                }
                            }
                        })
                        globals.source = {
                            name: values.configuration?.name ?? 'Unnamed',
                            url: window.location.href.split('#')[0],
                        }
                        return globals
                    } catch (e: any) {
                        if (!isBreakpoint(e)) {
                            actions.setSampleGlobalsError(e.message ?? errorMessage)
                        }
                        return values.exampleInvocationGlobals
                    }
                },
            },
        ],

        survey: [
            null as Survey | null,
            {
                loadSurvey: async () => {
                    const surveyId = values.surveyIdFromFilters
                    if (!surveyId) {
                        return null
                    }
                    try {
                        return await api.surveys.get(surveyId)
                    } catch {
                        return null
                    }
                },
            },
        ],
    })),
    forms(({ values, props, asyncActions }) => ({
        configuration: {
            defaults: {} as InsightsFunctionConfigurationType,
            alwaysShowErrors: true,
            errors: (data) => {
                return {
                    name: !data.name ? 'Name is required' : undefined,
                    mappings: VALIDATION_RULES.SITE_DESTINATION_REQUIRES_MAPPINGS(data) as unknown as DeepPartialMap<
                        InsightsFunctionMappingType[],
                        ValidationErrorType
                    >,
                    filters: VALIDATION_RULES.INTERNAL_DESTINATION_REQUIRES_FILTERS(data) as unknown as DeepPartialMap<
                        InsightsFunctionConfigurationType['filters'],
                        ValidationErrorType
                    >,
                    inputs: (values.inputFormErrors ?? {}) as DeepPartialMap<
                        InsightsFunctionConfigurationType['inputs'],
                        ValidationErrorType
                    >,
                }
            },
            submit: async (data) => {
                // Check HOG code size immediately before submission
                if (data.script) {
                    const hogSize = new Blob([data.script]).size
                    if (hogSize > FN_CODE_SIZE_LIMIT) {
                        toast.error(
                            `Script code exceeds maximum size of ${
                                FN_CODE_SIZE_LIMIT / 1024
                            }KB. Please simplify your code or contact support to increase the limit.`
                        )
                        return
                    }
                }

                const payload: Record<string, any> = sanitizeConfiguration(data)
                // Only sent on create
                payload.template_id = props.templateId || values.insightsFunction?.template?.id

                if (!props.id || props.id === 'new') {
                    const type = values.type
                    const typeFolder =
                        type === 'site_app'
                            ? 'Web scripts'
                            : type === 'transformation'
                              ? 'Transformations'
                              : type === 'transformation_log'
                                ? 'Log transformations'
                                : type === 'source_webhook'
                                  ? 'Sources'
                                  : 'Destinations'
                    payload._create_in_folder = `Unfiled/${typeFolder}`
                }
                await asyncActions.upsertInsightsFunction(payload as InsightsFunctionConfigurationType)
            },
        },
    })),
    selectors(() => ({
        logicProps: [() => [(_, props) => props], (props: InsightsFunctionConfigurationLogicProps) => props],
        surveyIdFromFilters: [
            (s) => [s.configuration],
            (configuration: InsightsFunctionConfigurationType): string | null => {
                for (const event of configuration?.filters?.events ?? []) {
                    const prop = (event.properties as AnyPropertyFilter[] | undefined)?.find(
                        (p) => p.key === SurveyEventProperties.SURVEY_ID && 'value' in p && p.value
                    )
                    if (prop) {
                        return String(prop.value)
                    }
                }
                return null
            },
        ],
        type: [
            (s) => [s.configuration, s.insightsFunction],
            (configuration: InsightsFunctionConfigurationType, insightsFunction: InsightsFunctionType | null) =>
                configuration?.type ?? insightsFunction?.type ?? 'loading',
        ],
        hasGroupsAddon: [
            (s) => [s.hasAvailableFeature],
            (hasAvailableFeature: (feature: AvailableFeature, currentUsage?: number | undefined) => boolean) => {
                return hasAvailableFeature(AvailableFeature.GROUP_ANALYTICS)
            },
        ],
        useMapping: [
            (s) => [s.insightsFunction, s.template],
            // If the function has mappings, or the template has mapping templates, we use mappings
            (insightsFunction: InsightsFunctionType | null, template: InsightsFunctionTemplateType | null) =>
                Array.isArray(insightsFunction?.mappings) || template?.mapping_templates?.length,
        ],
        defaultFormState: [
            (s) => [s.template, s.insightsFunction],
            (
                template: InsightsFunctionTemplateType | null,
                insightsFunction: InsightsFunctionType | null
            ): InsightsFunctionConfigurationType | null => {
                if (template) {
                    return templateToConfiguration(template)
                }
                return insightsFunction ?? null
            },
        ],

        templateId: [
            (s) => [s.template, s.insightsFunction],
            (template: InsightsFunctionTemplateType | null, insightsFunction: InsightsFunctionType | null) =>
                template?.id || insightsFunction?.template?.id,
        ],

        loading: [
            (s) => [s.insightsFunctionLoading, s.templateLoading],
            (insightsFunctionLoading: boolean, templateLoading: boolean) => insightsFunctionLoading || templateLoading,
        ],
        loaded: [
            (s) => [s.insightsFunction, s.template],
            (insightsFunction: InsightsFunctionType | null, template: InsightsFunctionTemplateType | null) =>
                !!insightsFunction || !!template,
        ],

        contextId: [
            (s) => [s.configuration],
            (configuration: InsightsFunctionConfigurationType): InsightsFunctionConfigurationContextId => {
                return eventToInsightsFunctionContextId(configuration.filters?.events?.[0]?.id)
            },
        ],

        inputsValidation: [
            (s) => [s.configuration],
            (configuration: InsightsFunctionConfigurationType): CyclotronJobInputsValidationResult =>
                CyclotronJobInputsValidation.validate(configuration.inputs ?? {}, configuration.inputs_schema ?? []),
        ],
        inputFormErrors: [
            (s) => [s.inputsValidation],
            (inputsValidation: CyclotronJobInputsValidationResult): Record<string, string> | null =>
                inputsValidation.valid ? null : inputsValidation.errors,
        ],
        inputFormWarnings: [
            (s) => [s.inputsValidation],
            (inputsValidation: CyclotronJobInputsValidationResult): Record<string, string> => inputsValidation.warnings,
        ],
        willReEnableOnSave: [
            (s) => [s.configuration, s.insightsFunction],
            (configuration: InsightsFunctionConfigurationType, insightsFunction: InsightsFunctionType | null) => {
                const hogState = insightsFunction?.status?.state ?? 0
                return configuration?.enabled && hogState === HogWatcherState.disabled
            },
        ],

        willChangeEnabledOnSave: [
            (s) => [s.configuration, s.insightsFunction],
            (configuration: InsightsFunctionConfigurationType, insightsFunction: InsightsFunctionType | null) => {
                return configuration?.enabled !== (insightsFunction?.enabled ?? false)
            },
        ],
        exampleInvocationGlobals: [
            (s) => [s.configuration, s.currentProject, s.groupTypes, s.contextId, s.survey],
            (
                configuration: InsightsFunctionConfigurationType,
                currentProject: null | import('~/types').ProjectType,
                groupTypes: Map<import('~/types').GroupTypeIndex, import('~/types').GroupType>,
                contextId: InsightsFunctionConfigurationContextId,
                survey: Survey | null
            ): CyclotronJobInvocationGlobals => {
                // Log transformations are seeded with a sample record (no event), so the inline
                // tester shows something useful to run against instead of an empty object.
                if (configuration?.type === 'transformation_log') {
                    return {
                        project: {
                            id: currentProject?.id ?? 0,
                            name: currentProject?.name ?? '',
                            url: `${window.location.origin}/project/${currentProject?.id}`,
                        },
                        record: EXAMPLE_LOG_RECORD,
                    } as CyclotronJobInvocationGlobals
                }
                const currentUrl = window.location.href.split('#')[0]
                const eventId = uuid()
                const personId = uuid()
                const source = {
                    name: configuration?.name ?? 'Unnamed',
                    url: currentUrl,
                }
                const globals: CyclotronJobInvocationGlobals =
                    configuration?.filters?.events?.[0]?.id === SurveyEventName.SENT
                        ? buildSurveyExampleInvocationGlobals({
                              survey,
                              projectId: currentProject?.id || 0,
                              projectName: currentProject?.name || '',
                              projectUrl: `${window.location.origin}/project/${currentProject?.id}`,
                              source,
                              eventUuid: eventId,
                              distinctId: uuid(),
                              timestamp: dayjs().toISOString(),
                              personId,
                              personName: 'Example person',
                              personEmail: 'example@hanzo.ai',
                          })
                        : {
                              event: {
                                  uuid: eventId,
                                  distinct_id: uuid(),
                                  timestamp: dayjs().toISOString(),
                                  elements_chain: '',
                                  url: `${window.location.origin}/project/${currentProject?.id}/events/`,
                                  ...(contextId === 'error-tracking'
                                      ? {
                                            event:
                                                configuration?.filters?.events?.[0].id ||
                                                '$error_tracking_issue_created',
                                            properties: {
                                                name: 'Test issue',
                                                description: 'This is the issue description',
                                            },
                                        }
                                      : contextId === 'health-alerts'
                                        ? {
                                              event:
                                                  configuration?.filters?.events?.[0].id ||
                                                  '$health_check_issue_firing',
                                              properties: {
                                                  kind: 'sdk_outdated',
                                                  severity: 'warning',
                                                  issue_id: '00000000-0000-0000-0000-000000000000',
                                                  title: 'insights-python SDK is outdated',
                                                  summary: 'insights-python is on 7.0.0, latest is 7.14.0',
                                                  link: '/health/sdk-health',
                                                  payload: {
                                                      sdk_name: 'insights-python',
                                                      latest_version: '7.14.0',
                                                  },
                                              },
                                          }
                                        : contextId === 'activity-log'
                                          ? {
                                                event: '$activity_log_entry_created',
                                                properties: {
                                                    activity: 'created',
                                                    scope: 'Insight',
                                                    item_id: 'abcdef',
                                                },
                                            }
                                          : {
                                                event: '$pageview',
                                                properties: {
                                                    $current_url: currentUrl,
                                                    $browser: 'Chrome',
                                                    $ip: '89.160.20.129',
                                                    this_is_an_example_event: true,
                                                },
                                            }),
                              },
                              person:
                                  contextId !== 'error-tracking'
                                      ? {
                                            id: personId,
                                            properties: {
                                                email: 'example@hanzo.ai',
                                            },
                                            name: 'Example person',
                                            url: `${window.location.origin}/person/${personId}`,
                                        }
                                      : undefined,
                              groups: {},
                              project: {
                                  id: currentProject?.id || 0,
                                  name: currentProject?.name || '',
                                  url: `${window.location.origin}/project/${currentProject?.id}`,
                              },
                              source,
                          }

                if (contextId !== 'error-tracking') {
                    groupTypes.forEach((groupType) => {
                        const id = uuid()
                        globals.groups![groupType.group_type] = {
                            id: id,
                            type: groupType.group_type,
                            index: groupType.group_type_index,
                            url: `${window.location.origin}/groups/${groupType.group_type_index}/${encodeURIComponent(
                                id
                            )}`,
                            properties: {},
                        }
                    })
                }

                return globals
            },
        ],
        sampleGlobalsWithInputs: [
            (s) => [s.sampleGlobals, s.exampleInvocationGlobals, s.configuration],
            (
                sampleGlobals: CyclotronJobInvocationGlobals | null,
                exampleInvocationGlobals: CyclotronJobInvocationGlobals,
                configuration: InsightsFunctionConfigurationType
            ): CyclotronJobInvocationGlobalsWithInputs => {
                const inputs: Record<string, any> = {}
                for (const input of configuration?.inputs_schema || []) {
                    inputs[input.key] = input.type
                }

                if (configuration.type === 'source_webhook') {
                    return {
                        request: {
                            body: {},
                            headers: {},
                            ip: '127.0.0.1',
                        },
                        inputs,
                    }
                }

                const baseGlobals = sampleGlobals ?? exampleInvocationGlobals

                // Transformations only receive `project` and `event` at runtime
                // (see HogTransformerService.createInvocationGlobals). Hide `person`,
                // `groups`, `source`, etc. so input templates can't reference them
                // and trigger a "Global variable not found" failure in production.
                if (configuration.type === 'transformation') {
                    return {
                        project: baseGlobals.project,
                        event: baseGlobals.event,
                        inputs,
                    }
                }

                // Log transformations receive `project` and `record` at runtime (see
                // buildLogRecordGlobals). There is no event table to sample from, so show a
                // representative record the user can edit.
                if (configuration.type === 'transformation_log') {
                    return {
                        project: baseGlobals.project,
                        record: EXAMPLE_LOG_RECORD,
                        inputs,
                    }
                }

                return {
                    ...baseGlobals,
                    inputs,
                }
            },
        ],
        matchingFilters: [
            (s) => [s.configuration, s.useMapping],
            (
                configuration: InsightsFunctionConfigurationType,
                useMapping: number | true | undefined
            ): PropertyGroupFilter => {
                // We're using mappings, but none are provided, so match zero events.
                if (useMapping && !configuration.mappings?.length) {
                    return {
                        type: FilterLogicalOperator.And,
                        values: [
                            {
                                type: FilterLogicalOperator.And,
                                values: [
                                    {
                                        type: PropertyFilterType.InsightsQL,
                                        key: 'false',
                                    },
                                ],
                            },
                        ],
                    }
                }

                const seriesProperties: PropertyGroupFilterValue = {
                    type: FilterLogicalOperator.Or,
                    values: [],
                }
                const properties: PropertyGroupFilter = {
                    type: FilterLogicalOperator.And,
                    values: [seriesProperties],
                }
                const allPossibleEventFilters = configuration.filters?.events ?? []
                const allPossibleActionFilters = configuration.filters?.actions ?? []

                if (Array.isArray(configuration.mappings)) {
                    for (const mapping of configuration.mappings) {
                        if (mapping.filters?.events) {
                            allPossibleEventFilters.push(...mapping.filters.events)
                        }
                        if (mapping.filters?.actions) {
                            allPossibleActionFilters.push(...mapping.filters.actions)
                        }
                    }
                }

                for (const event of allPossibleEventFilters) {
                    const eventProperties: AnyPropertyFilter[] = [...(event.properties ?? [])]
                    if (event.id) {
                        eventProperties.push({
                            type: PropertyFilterType.InsightsQL,
                            key: insightsql`event = ${event.id}`,
                        })
                    }
                    if (eventProperties.length === 0) {
                        eventProperties.push({
                            type: PropertyFilterType.InsightsQL,
                            key: 'true',
                        })
                    }
                    seriesProperties.values.push({
                        type: FilterLogicalOperator.And,
                        values: eventProperties,
                    })
                }
                for (const action of allPossibleActionFilters) {
                    const actionProperties: AnyPropertyFilter[] = [...(action.properties ?? [])]
                    if (action.id) {
                        actionProperties.push({
                            type: PropertyFilterType.InsightsQL,
                            key: insightsql`matchesAction(${parseInt(action.id)})`,
                        })
                    }
                    seriesProperties.values.push({
                        type: FilterLogicalOperator.And,
                        values: actionProperties,
                    })
                }
                if ((configuration.filters?.properties?.length ?? 0) > 0) {
                    const globalProperties: PropertyGroupFilterValue = {
                        type: FilterLogicalOperator.And,
                        values: [],
                    }
                    for (const property of configuration.filters?.properties ?? []) {
                        globalProperties.values.push(property as AnyPropertyFilter)
                    }
                    properties.values.push(globalProperties)
                }
                return properties
            },
            { resultEqualityCheck: equal },
        ],

        filtersContainPersonProperties: [
            (s) => [s.configuration],
            (configuration: InsightsFunctionConfigurationType) => {
                const filters = configuration.filters
                let containsPersonProperties = false
                if (filters?.properties && !containsPersonProperties) {
                    containsPersonProperties = filters.properties.some((p) => p.type === 'person')
                }
                if (filters?.actions && !containsPersonProperties) {
                    containsPersonProperties = filters.actions.some((a) =>
                        a.properties?.some((p) => p.type === 'person')
                    )
                }
                if (filters?.events && !containsPersonProperties) {
                    containsPersonProperties = filters.events.some((e) =>
                        e.properties?.some((p) => p.type === 'person')
                    )
                }
                return containsPersonProperties
            },
        ],

        sourceUsesEvents: [
            (s) => [s.configuration, s.type],
            (configuration: InsightsFunctionConfigurationType, type: InsightsFunctionTypeType) => {
                return TYPES_WITH_REAL_EVENTS.includes(type) && (configuration.filters?.source ?? 'events') === 'events'
            },
        ],

        sparklineQuery: [
            (s) => [s.configuration, s.matchingFilters, s.sourceUsesEvents],
            (
                configuration: InsightsFunctionConfigurationType,
                matchingFilters: PropertyGroupFilter,
                sourceUsesEvents: boolean
            ): TrendsQuery | null => {
                if (!sourceUsesEvents) {
                    return null
                }
                return setLatestVersionsOnQuery({
                    kind: NodeKind.TrendsQuery,
                    filterTestAccounts: configuration.filters?.filter_test_accounts,
                    series: [
                        {
                            kind: NodeKind.EventsNode,
                            event: null,
                            name: 'All Events',
                            math: BaseMathType.TotalCount,
                        } satisfies EventsNode,
                    ],
                    properties: matchingFilters,
                    interval: 'day',
                    dateRange: {
                        date_from: '-7d',
                    },
                    trendsFilter: {
                        display: ChartDisplayType.ActionsBar,
                    },
                    modifiers: {
                        personsOnEventsMode: 'person_id_no_override_properties_on_events',
                    },
                })
            },
            { resultEqualityCheck: equal },
        ],

        baseEventsQuery: [
            (s) => [s.configuration, s.matchingFilters, s.groupTypes, s.sourceUsesEvents],
            (
                configuration: InsightsFunctionConfigurationType,
                matchingFilters: PropertyGroupFilter,
                groupTypes: Map<import('~/types').GroupTypeIndex, import('~/types').GroupType>,
                sourceUsesEvents: boolean
            ): EventsQuery | null => {
                if (!sourceUsesEvents) {
                    return null
                }
                const query: EventsQuery = {
                    kind: NodeKind.EventsQuery,
                    filterTestAccounts: configuration.filters?.filter_test_accounts,
                    fixedProperties: [matchingFilters],
                    select: ['*', 'person'],
                    after: '-7d',
                    orderBy: ['timestamp DESC'],
                    modifiers: {
                        // NOTE: We always want to show events with the person properties at the time the event was created as that is what the function will see
                        personsOnEventsMode: 'person_id_no_override_properties_on_events',
                    },
                }
                groupTypes.forEach((groupType) => {
                    const name = escapePropertyAsInsightsQLIdentifier(groupType.group_type)
                    query.select.push(
                        `tuple(${name}.created_at, ${name}.index, ${name}.key, ${name}.properties, ${name}.updated_at)`
                    )
                })
                return setLatestVersionsOnQuery(query)
            },
            { resultEqualityCheck: equal },
        ],

        eventsDataTableNode: [
            (s) => [s.baseEventsQuery],
            (baseEventsQuery: EventsQuery | null): DataTableNode | null => {
                return baseEventsQuery
                    ? setLatestVersionsOnQuery(
                          {
                              kind: NodeKind.DataTableNode,
                              source: {
                                  ...baseEventsQuery,
                                  select: defaultDataTableColumns(NodeKind.EventsQuery),
                              },
                          },
                          { recursion: false }
                      )
                    : null
            },
        ],

        lastEventQuery: [
            (s) => [s.baseEventsQuery],
            (baseEventsQuery: EventsQuery | null): EventsQuery | null => {
                return baseEventsQuery ? { ...baseEventsQuery, limit: 1 } : null
            },
            { resultEqualityCheck: equal },
        ],
        lastEventSecondQuery: [
            (s) => [s.lastEventQuery],
            (lastEventQuery: EventsQuery | null): EventsQuery | null =>
                lastEventQuery ? { ...lastEventQuery, after: '-30d' } : null,
        ],
        templateHasChanged: [
            (s) => [s.insightsFunction, s.configuration],
            (insightsFunction: InsightsFunctionType | null, configuration: InsightsFunctionConfigurationType) => {
                return insightsFunction?.template?.code && insightsFunction.template.code !== configuration.script
            },
        ],
        mappingTemplates: [
            (s) => [s.insightsFunction, s.template],
            (insightsFunction: InsightsFunctionType | null, template: InsightsFunctionTemplateType | null) =>
                template?.mapping_templates ?? insightsFunction?.template?.mapping_templates ?? [],
        ],

        usesGroups: [
            (s) => [s.configuration],
            (configuration: InsightsFunctionConfigurationType) => {
                // NOTE: Bit hacky but works good enough...
                const configStr = JSON.stringify(configuration)
                return configStr.includes('groups.') || configStr.includes('{groups}')
            },
        ],
        mightDropEvents: [
            (s) => [s.configuration, s.type],
            (configuration: InsightsFunctionConfigurationType, type: InsightsFunctionTypeType) => {
                if (type !== 'transformation' && type !== 'transformation_log') {
                    return false
                }
                const hogCode = configuration.script || ''

                return mightDropEvents(hogCode)
            },
        ],

        currentHogCode: [
            (s) => [s.newHogCode, s.configuration],
            (newHogCode: string | null, configuration: InsightsFunctionConfigurationType) => {
                return newHogCode ?? configuration.script ?? ''
            },
        ],

        currentInputs: [
            (s) => [s.newInputs, s.configuration],
            (newInputs: CyclotronJobInputSchemaType[] | null, configuration: InsightsFunctionConfigurationType) => {
                return newInputs ?? configuration.inputs_schema ?? []
            },
        ],

        inputsDiff: [
            (s) => [s.oldInputs, s.newInputs],
            (oldInputs: CyclotronJobInputSchemaType[] | null, newInputs: CyclotronJobInputSchemaType[] | null) => {
                if (!oldInputs || !newInputs) {
                    return null
                }
                return { oldInputs, newInputs }
            },
        ],

        canLoadSampleGlobals: [
            (s) => [s.lastEventQuery, s.contextId],
            (lastEventQuery: EventsQuery | null, contextId: InsightsFunctionConfigurationContextId) => {
                return !!lastEventQuery || !!SAMPLE_GLOBALS_CONTEXTS[contextId]
            },
        ],

        showFilters: [
            (s) => [s.type],
            (type: InsightsFunctionTypeType) => {
                return ['destination', 'internal_destination', 'site_destination', 'transformation'].includes(type)
            },
        ],

        showExpectedVolume: [
            (s) => [s.type, s.sourceUsesEvents],
            (type: InsightsFunctionTypeType, sourceUsesEvents: boolean) => {
                return sourceUsesEvents && ['destination', 'site_destination', 'transformation'].includes(type)
            },
        ],

        canEditSource: [
            (s) => [s.type, s.template, s.insightsFunction],
            (
                type: InsightsFunctionTypeType,
                template: InsightsFunctionTemplateType | null,
                insightsFunction: InsightsFunctionType | null
            ) => {
                const codeLanguage = template?.code_language || insightsFunction?.template?.code_language

                if (type === 'site_app' || type === 'site_destination') {
                    return true
                }

                // Only allow editing if code language is 'script'
                if (codeLanguage && codeLanguage !== 'script') {
                    return false
                }

                return ['source_webhook', 'transformation', 'transformation_log', 'destination'].includes(type)
            },
        ],

        showTesting: [
            (s) => [s.type],
            (type: InsightsFunctionTypeType) => {
                return ['destination', 'internal_destination', 'transformation', 'transformation_log'].includes(type)
            },
        ],

        isLegacyPlugin: [
            (s) => [s.template, s.insightsFunction],
            (template: InsightsFunctionTemplateType | null, insightsFunction: InsightsFunctionType | null) => {
                return (template?.id || insightsFunction?.template?.id)?.startsWith('plugin-')
            },
        ],
    })),

    listeners(({ actions, values, cache }) => ({
        reportAIInsightsFunctionPrompted: () => {
            insights.capture('ai_insights_function_prompted', { type: values.type })
        },
        reportAIInsightsFunctionAccepted: () => {
            insights.capture('ai_insights_function_accepted', { type: values.type })
        },
        reportAIInsightsFunctionRejected: () => {
            insights.capture('ai_insights_function_rejected', { type: values.type })
        },
        reportAIInsightsFunctionPromptOpen: () => {
            insights.capture('ai_insights_function_prompt_open', { type: values.type })
        },
        reportAIFiltersPrompted: () => {
            insights.capture('ai_insights_function_filters_prompted', { type: values.type })
        },
        reportAIFiltersAccepted: () => {
            insights.capture('ai_insights_function_filters_accepted', { type: values.type })
        },
        reportAIFiltersRejected: () => {
            insights.capture('ai_insights_function_filters_rejected', { type: values.type })
        },
        reportAIFiltersPromptOpen: () => {
            insights.capture('ai_insights_function_filters_prompt_open', { type: values.type })
        },
        reportAIInsightsFunctionInputsPrompted: () => {
            insights.capture('ai_insights_function_inputs_prompted', { type: values.type })
        },
        reportAIInsightsFunctionInputsAccepted: () => {
            insights.capture('ai_insights_function_inputs_accepted', { type: values.type })
        },
        reportAIInsightsFunctionInputsRejected: () => {
            insights.capture('ai_insights_function_inputs_rejected', { type: values.type })
        },
        reportAIInsightsFunctionInputsPromptOpen: () => {
            insights.capture('ai_insights_function_inputs_prompt_open', { type: values.type })
        },
        loadTemplateSuccess: () => actions.resetForm(),
        loadInsightsFunctionSuccess: () => {
            actions.resetForm()
        },
        upsertInsightsFunctionSuccess: () => {
            actions.resetForm()
        },

        upsertInsightsFunctionFailure: ({ errorObject }) => {
            const maybeValidationError = errorObject.data

            if (maybeValidationError?.type === 'validation_error' && maybeValidationError.attr) {
                // Errors on `type` (the feature gate and the enabled-function cap reject there)
                // have no rendered form field, so a toast is the only way the user sees them.
                if (maybeValidationError.attr === 'type') {
                    toast.error(maybeValidationError.detail)
                }
                setTimeout(() => {
                    // TRICKY: We want to run on the next tick otherwise the errors don't show (possibly because of the async wait in the submit)
                    if (maybeValidationError.attr.includes('inputs__')) {
                        actions.setConfigurationManualErrors({
                            inputs: {
                                [maybeValidationError.attr.split('__')[1]]: maybeValidationError.detail,
                            },
                        })
                    } else {
                        actions.setConfigurationManualErrors({
                            [maybeValidationError.attr]: maybeValidationError.detail,
                        })
                    }
                }, 1)
            } else {
                console.error(errorObject)
                toast.error(maybeValidationError?.detail ?? 'Error submitting configuration')
            }
        },

        resetForm: () => {
            const baseConfig = values.defaultFormState
            if (!baseConfig) {
                return
            }

            const config: InsightsFunctionConfigurationType = {
                ...baseConfig,
                ...cache.configFromUrl,
            }

            const paramsFromUrl = cache.paramsFromUrl ?? {}
            const unsavedConfigurationToApply =
                (values.unsavedConfiguration?.timestamp ?? 0) > Date.now() - UNSAVED_CONFIGURATION_TTL
                    ? values.unsavedConfiguration?.configuration
                    : null

            actions.resetConfiguration(config)

            if (unsavedConfigurationToApply) {
                actions.setConfigurationValues(unsavedConfigurationToApply)
            }

            actions.setUnsavedConfiguration(null)

            if (paramsFromUrl.integration_target && paramsFromUrl.integration_id) {
                const inputs = values.configuration?.inputs ?? {}
                inputs[paramsFromUrl.integration_target] = {
                    value: paramsFromUrl.integration_id,
                }

                actions.setConfigurationValues({
                    inputs,
                })
            }
        },

        duplicate: async () => {
            if (values.insightsFunction) {
                const newConfig = {
                    ...values.configuration,
                    name: `${values.configuration.name} (copy)`,
                }
                // TODO: What to do if no template?
                const originalTemplate = values.insightsFunction.template!
                router.actions.push(urls.insightsFunctionNew(originalTemplate.id), undefined, {
                    configuration: newConfig,
                })
            }
        },
        duplicateFromTemplate: async () => {
            if (values.insightsFunction?.template) {
                const newConfig: InsightsFunctionTemplateType = {
                    ...values.insightsFunction.template,
                }
                router.actions.push(urls.insightsFunctionNew(values.insightsFunction.template.id), undefined, {
                    configuration: newConfig,
                })
            }
        },
        resetToTemplate: async () => {
            const template = values.insightsFunction?.template ?? values.template
            if (template) {
                const config = templateToConfiguration(template)

                const inputs = config.inputs ?? {}

                // Keep any non-default values
                Object.entries(values.configuration.inputs ?? {}).forEach(([key, value]) => {
                    inputs[key] = inputs[key] ?? value
                })

                actions.setConfigurationValues({
                    ...config,
                    enabled: values.configuration.enabled,
                    filters: config.filters ?? values.configuration.filters,
                    // NOTE: Technically mapping should also be sanitized against the template mappings but this is a bit of a pain
                    mappings: values.configuration.mappings?.length ? values.configuration.mappings : config.mappings,
                    // Keep some existing things when manually resetting the template
                    name: values.configuration.name,
                    description: values.configuration.description,
                })

                toast.success('Template updates applied but not saved.')
            }
        },
        setConfigurationValue: () => {
            if (values.hasHadSubmissionErrors) {
                // Clear the manually set errors otherwise the submission won't work
                actions.setConfigurationManualErrors({})
            }
        },

        deleteInsightsFunction: async () => {
            const insightsFunction = values.insightsFunction
            if (!insightsFunction) {
                return
            }
            await deleteWithUndo({
                endpoint: `projects/${values.currentProjectId}/insights_functions`,
                object: {
                    id: insightsFunction.id,
                    name: insightsFunction.name,
                },
                callback(undo) {
                    if (undo) {
                        router.actions.replace(urls.insightsFunction(insightsFunction.id))
                        refreshTreeItem('insights_function/', insightsFunction.id)
                    } else {
                        deleteFromTree('insights_function/', insightsFunction.id)
                    }
                },
            })

            router.actions.replace(urls.insightsFunction(insightsFunction.id))
        },

        persistForUnload: () => {
            actions.setUnsavedConfiguration(values.configuration)
        },
    })),
    afterMount(({ props, actions, cache }) => {
        cache.paramsFromUrl = {
            integration_id: router.values.searchParams.integration_id,
            integration_target: router.values.searchParams.integration_target,
        }

        if (props.templateId) {
            cache.configFromUrl = router.values.hashParams.configuration
            actions.loadTemplate()
        } else if (props.id && props.id !== 'new') {
            actions.loadInsightsFunction()
        }

        if (router.values.searchParams.integration_target) {
            const searchParams = router.values.searchParams
            delete searchParams.integration_id
            delete searchParams.integration_target
            // Clear query params so we don't keep trying to set the integration
            router.actions.replace(router.values.location.pathname, searchParams, router.values.hashParams)
        }
    }),

    subscriptions(({ props, actions, cache }) => ({
        insightsFunction: (insightsFunction) => {
            if (insightsFunction && props.templateId) {
                // Catch all for any scenario where we need to redirect away from the template to the actual script function

                cache.disabledBeforeUnload = true
                // Preserve existing search params (integration params, returnTo, etc.) on redirect
                router.actions.replace(urls.insightsFunction(insightsFunction.id), router.values.searchParams)
            }
        },
        sparklineQuery: async (sparklineQuery) => {
            if (sparklineQuery) {
                actions.sparklineQueryChanged(sparklineQuery)
            }
        },
        configuration: (configuration, oldConfiguration) => {
            if (
                typeof configuration?.filters?.source === 'string' &&
                typeof oldConfiguration?.filters?.source === 'string' &&
                configuration?.filters?.source !== oldConfiguration?.filters?.source
            ) {
                actions.setConfigurationValue('filters', {
                    ...configuration.filters,
                    events: [],
                    actions: [],
                    data_warehouse: [],
                })
            }
        },
        surveyIdFromFilters: (surveyId) => {
            if (surveyId) {
                actions.loadSurvey()
            } else {
                actions.loadSurveySuccess(null)
            }
        },
    })),

    urlToAction(({ actions, values, cache }) => ({
        [urls.insightsFunctionNew(':templateId')]: (_, __, hashParams) => {
            const newConfig = hashParams?.configuration
            if (values.template && !equal(newConfig, cache.configFromUrl)) {
                cache.configFromUrl = newConfig
                actions.resetForm()
            }
        },
    })),

    beforeUnload(({ values, cache }) => ({
        enabled: (newLocation?: CombinedLocation) => {
            if (cache.disabledBeforeUnload || values.unsavedConfiguration || !values.configurationChanged) {
                return false
            }

            // the oldRoute includes the project id, so we remove it for comparison
            const oldRoute = router.values.location.pathname.replace(/\/project\/\d+/, '').split('/')
            const newRoute = newLocation?.pathname.replace(/\/project\/\d+/, '').split('/')

            if (!newRoute || newRoute.length !== oldRoute.length) {
                return true
            }

            for (let i = 0; i < oldRoute.length - 1; i++) {
                if (oldRoute[i] !== newRoute[i]) {
                    return true
                }
            }

            // TODO: Fix this!!
            // const possibleMenuIds: string[] = [PipelineNodeTab.Configuration, PipelineNodeTab.Testing]
            // if (
            //     !(
            //         possibleMenuIds.includes(newRoute[newRoute.length - 1]) &&
            //         possibleMenuIds.includes(oldRoute[newRoute.length - 1])
            //     )
            // ) {
            //     return true
            // }

            return false
        },
        message: 'Changes you made will be discarded.',
        onConfirm: () => {
            cache.disabledBeforeUnload = true
        },
    })),
])
