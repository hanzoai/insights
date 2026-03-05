import equal from 'fast-deep-equal'
import { actions, afterMount, connect, isBreakpoint, kea, key, listeners, path, props, reducers, selectors } from 'kea'
import { DeepPartialMap, ValidationErrorType, forms } from 'kea-forms'
import { loaders } from 'kea-loaders'
import { beforeUnload, router, urlToAction } from 'kea-router'
import { CombinedLocation } from 'kea-router/lib/utils'
import { subscriptions } from 'kea-subscriptions'
import posthog from 'posthog-js'

import { lemonToast } from '@posthog/lemon-ui'

import api from 'lib/api'
import { CyclotronJobInputsValidation } from 'lib/components/CyclotronJob/CyclotronJobInputsValidation'
import { dayjs } from 'lib/dayjs'
import { uuid } from 'lib/utils'
import { deleteWithUndo } from 'lib/utils/deleteWithUndo'
import { addProductIntent } from 'lib/utils/product-intents'
import { asDisplay } from 'scenes/persons/person-utils'
import { projectLogic } from 'scenes/projectLogic'
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
    TeamType,
} from '~/types'

import { eventToInsightsFunctionContextId } from '../sub-templates/sub-templates'
import type { insightsFunctionConfigurationLogicType } from './insightsFunctionConfigurationLogicType'

export interface InsightsFunctionConfigurationLogicProps {
    logicKey?: string
    templateId?: string | null
    subTemplateId?: string | null
    id?: string | null
}

export const EVENT_VOLUME_DAILY_WARNING_THRESHOLD = 1000
const UNSAVED_CONFIGURATION_TTL = 1000 * 60 * 5
export const HOG_CODE_SIZE_LIMIT = 100 * 1024 // 100KB to match backend limit

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
    code_language: 'fn',
    code: "print('Hello, world!');",
    status: 'stable',
}

export const TYPES_WITH_GLOBALS: InsightsFunctionTypeType[] = ['transformation', 'destination']
export const TYPES_WITH_REAL_EVENTS: InsightsFunctionTypeType[] = ['destination', 'site_destination', 'transformation']
export const TYPES_WITH_VOLUME_WARNING: InsightsFunctionTypeType[] = ['destination', 'site_destination']

const TYPE_TO_PRODUCT_KEY: Partial<Record<InsightsFunctionTypeType, ProductKey>> = {
    destination: ProductKey.PIPELINE_DESTINATIONS,
    site_destination: ProductKey.PIPELINE_DESTINATIONS,
    transformation: ProductKey.PIPELINE_TRANSFORMATIONS,
    site_app: ProductKey.SITE_APPS,
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
            templating: templatingEnabled ? (input?.templating ?? 'fn') : undefined,
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
        fn: template.code,
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
        setNewHogCode: (newScriptCode: string) => ({ newScriptCode }),
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
        newScriptCode: [
            null as string | null,
            {
                setNewHogCode: (_, { newScriptCode }) => newScriptCode,
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

                    posthog.capture('custom function saved', {
                        id: res.id,
                        template_id: res.template?.id,
                        template_name: res.template?.name,
                        type: res.type,
                        enabled: res.enabled,
                    })

                    // Track product intent when creating a new custom function
                    if (isNew) {
                        const productKey = TYPE_TO_PRODUCT_KEY[res.type]
                        if (productKey) {
                            void addProductIntent({
                                product_type: productKey,
                                intent_context: ProductIntentContext.DATA_PIPELINE_CREATED,
                            })
                        }
                    }

                    // Capture error tracking specific alert event
                    if (
                        res.template?.id === 'error-tracking-issue-created' ||
                        res.template?.id === 'error-tracking-issue-reopened' ||
                        res.template?.id === 'error-tracking-issue-spiking'
                    ) {
                        const triggerEventMap: Record<string, string> = {
                            'error-tracking-issue-created': '$error_tracking_issue_created',
                            'error-tracking-issue-reopened': '$error_tracking_issue_reopened',
                            'error-tracking-issue-spiking': '$error_tracking_issue_spiking',
                        }
                        const triggerEvent = triggerEventMap[res.template.id]

                        posthog.capture('error_tracking_alert_created', {
                            trigger_event: triggerEvent,
                            subtemplate_id: res.template.id,
                            has_custom_filters: res.filters && Object.keys(res.filters).length > 1,
                            enabled: res.enabled,
                        })
                    }

                    lemonToast.success('Configuration saved')
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
                    if (!values.lastEventQuery) {
                        return values.sampleGlobals
                    }
                    const errorMessage =
                        'No events match these filters in the last 30 days. Showing an example $pageview event instead.'
                    try {
                        await breakpoint(values.sampleGlobals === null ? 10 : 1000)
                        let response = await performQuery({
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
                            response = await performQuery({
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
                if (data.fn) {
                    const fnSize = new Blob([data.fn]).size
                    if (fnSize > HOG_CODE_SIZE_LIMIT) {
                        lemonToast.error(
                            `Custom code exceeds maximum size of ${
                                HOG_CODE_SIZE_LIMIT / 1024
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
                            ? 'Site apps'
                            : type === 'transformation'
                              ? 'Transformations'
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
        type: [
            (s) => [s.configuration, s.insightsFunction],
            (configuration, insightsFunction) => configuration?.type ?? insightsFunction?.type ?? 'loading',
        ],
        hasGroupsAddon: [
            (s) => [s.hasAvailableFeature],
            (hasAvailableFeature) => {
                return hasAvailableFeature(AvailableFeature.GROUP_ANALYTICS)
            },
        ],
        teamHasCohortFilters: [
            (s) => [s.currentTeam, s.configuration],
            (currentTeam: TeamType | null, configuration: InsightsFunctionConfigurationType | null) => {
                // Only show warning if filter_test_accounts is enabled AND team has cohort filters
                const hasFilterTestAccountsEnabled = configuration?.filters?.filter_test_accounts === true
                const teamHasCohorts =
                    currentTeam?.test_account_filters?.some(
                        (filter: AnyPropertyFilter) => filter.type === PropertyFilterType.Cohort
                    ) || false

                return hasFilterTestAccountsEnabled && teamHasCohorts
            },
        ],
        useMapping: [
            (s) => [s.insightsFunction, s.template],
            // If the function has mappings, or the template has mapping templates, we use mappings
            (insightsFunction, template) => Array.isArray(insightsFunction?.mappings) || template?.mapping_templates?.length,
        ],
        defaultFormState: [
            (s) => [s.template, s.insightsFunction],
            (template, insightsFunction): InsightsFunctionConfigurationType | null => {
                if (template) {
                    return templateToConfiguration(template)
                }
                return insightsFunction ?? null
            },
        ],

        templateId: [
            (s) => [s.template, s.insightsFunction],
            (template, insightsFunction) => template?.id || insightsFunction?.template?.id,
        ],

        loading: [
            (s) => [s.insightsFunctionLoading, s.templateLoading],
            (insightsFunctionLoading, templateLoading) => insightsFunctionLoading || templateLoading,
        ],
        loaded: [(s) => [s.insightsFunction, s.template], (insightsFunction, template) => !!insightsFunction || !!template],

        contextId: [
            (s) => [s.configuration],
            (configuration): InsightsFunctionConfigurationContextId => {
                return eventToInsightsFunctionContextId(configuration.filters?.events?.[0]?.id)
            },
        ],

        inputFormErrors: [
            (s) => [s.configuration],
            (configuration): Record<string, string> | null => {
                const result = CyclotronJobInputsValidation.validate(
                    configuration.inputs ?? {},
                    configuration.inputs_schema ?? []
                )

                return result.valid ? null : result.errors
            },
        ],
        willReEnableOnSave: [
            (s) => [s.configuration, s.insightsFunction],
            (configuration, insightsFunction) => {
                const hogState = insightsFunction?.status?.state ?? 0
                return configuration?.enabled && hogState === HogWatcherState.disabled
            },
        ],

        willChangeEnabledOnSave: [
            (s) => [s.configuration, s.insightsFunction],
            (configuration, insightsFunction) => {
                return configuration?.enabled !== (insightsFunction?.enabled ?? false)
            },
        ],
        exampleInvocationGlobals: [
            (s) => [s.configuration, s.currentProject, s.groupTypes, s.contextId],
            (configuration, currentProject, groupTypes, contextId): CyclotronJobInvocationGlobals => {
                const currentUrl = window.location.href.split('#')[0]
                const eventId = uuid()
                const personId = uuid()
                const event = {
                    uuid: eventId,
                    distinct_id: uuid(),
                    timestamp: dayjs().toISOString(),
                    elements_chain: '',
                    url: `${window.location.origin}/project/${currentProject?.id}/events/`,
                    ...(contextId === 'error-tracking'
                        ? {
                              event: configuration?.filters?.events?.[0].id || '$error_tracking_issue_created',
                              properties: {
                                  name: 'Test issue',
                                  description: 'This is the issue description',
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
                }
                const globals: CyclotronJobInvocationGlobals = {
                    event,
                    person:
                        contextId !== 'error-tracking'
                            ? {
                                  id: personId,
                                  properties: {
                                      email: 'example@posthog.com',
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
                    source: {
                        name: configuration?.name ?? 'Unnamed',
                        url: currentUrl,
                    },
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
            (sampleGlobals, exampleInvocationGlobals, configuration): CyclotronJobInvocationGlobalsWithInputs => {
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

                return {
                    ...(sampleGlobals ?? exampleInvocationGlobals),
                    inputs,
                }
            },
        ],
        matchingFilters: [
            (s) => [s.configuration, s.useMapping],
            (configuration, useMapping): PropertyGroupFilter => {
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
            (configuration) => {
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
            (configuration, type) => {
                return TYPES_WITH_REAL_EVENTS.includes(type) && (configuration.filters?.source ?? 'events') === 'events'
            },
        ],

        sparklineQuery: [
            (s) => [s.configuration, s.matchingFilters, s.sourceUsesEvents],
            (configuration, matchingFilters, sourceUsesEvents): TrendsQuery | null => {
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
            (configuration, matchingFilters, groupTypes, sourceUsesEvents): EventsQuery | null => {
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
            (baseEventsQuery): DataTableNode | null => {
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
            (baseEventsQuery): EventsQuery | null => {
                return baseEventsQuery ? { ...baseEventsQuery, limit: 1 } : null
            },
            { resultEqualityCheck: equal },
        ],
        lastEventSecondQuery: [
            (s) => [s.lastEventQuery],
            (lastEventQuery): EventsQuery | null => (lastEventQuery ? { ...lastEventQuery, after: '-30d' } : null),
        ],
        templateHasChanged: [
            (s) => [s.insightsFunction, s.configuration],
            (insightsFunction, configuration) => {
                return insightsFunction?.template?.code && insightsFunction.template.code !== configuration.fn
            },
        ],
        mappingTemplates: [
            (s) => [s.insightsFunction, s.template],
            (insightsFunction, template) => template?.mapping_templates ?? insightsFunction?.template?.mapping_templates ?? [],
        ],

        usesGroups: [
            (s) => [s.configuration],
            (configuration) => {
                // NOTE: Bit hacky but works good enough...
                const configStr = JSON.stringify(configuration)
                return configStr.includes('groups.') || configStr.includes('{groups}')
            },
        ],
        mightDropEvents: [
            (s) => [s.configuration, s.type],
            (configuration, type) => {
                if (type !== 'transformation') {
                    return false
                }
                const fnCode = configuration.fn || ''

                return mightDropEvents(fnCode)
            },
        ],

        currentScriptCode: [
            (s) => [s.newScriptCode, s.configuration],
            (newScriptCode: string | null, configuration: InsightsFunctionConfigurationType) => {
                return newScriptCode ?? configuration.fn ?? ''
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
            (s) => [s.lastEventQuery],
            (lastEventQuery) => {
                return !!lastEventQuery
            },
        ],

        showFilters: [
            (s) => [s.type],
            (type) => {
                return ['destination', 'internal_destination', 'site_destination', 'transformation'].includes(type)
            },
        ],

        showExpectedVolume: [
            (s) => [s.type, s.sourceUsesEvents],
            (type, sourceUsesEvents) => {
                return sourceUsesEvents && ['destination', 'site_destination', 'transformation'].includes(type)
            },
        ],

        canEditSource: [
            (s) => [s.type, s.template, s.insightsFunction],
            (type, template, insightsFunction) => {
                const codeLanguage = template?.code_language || insightsFunction?.template?.code_language

                if (type === 'site_app' || type === 'site_destination') {
                    return true
                }

                // Only allow editing if code language is 'fn'
                if (codeLanguage && codeLanguage !== 'fn') {
                    return false
                }

                return ['source_webhook', 'transformation', 'destination'].includes(type)
            },
        ],

        showTesting: [
            (s) => [s.type],
            (type) => {
                return ['destination', 'internal_destination', 'transformation'].includes(type)
            },
        ],

        isLegacyPlugin: [
            (s) => [s.template, s.insightsFunction],
            (template, insightsFunction) => {
                return (template?.id || insightsFunction?.template?.id)?.startsWith('plugin-')
            },
        ],
    })),

    listeners(({ actions, values, cache }) => ({
        reportAIInsightsFunctionPrompted: () => {
            posthog.capture('ai_insights_function_prompted', { type: values.type })
        },
        reportAIInsightsFunctionAccepted: () => {
            posthog.capture('ai_insights_function_accepted', { type: values.type })
        },
        reportAIInsightsFunctionRejected: () => {
            posthog.capture('ai_insights_function_rejected', { type: values.type })
        },
        reportAIInsightsFunctionPromptOpen: () => {
            posthog.capture('ai_insights_function_prompt_open', { type: values.type })
        },
        reportAIFiltersPrompted: () => {
            posthog.capture('ai_insights_function_filters_prompted', { type: values.type })
        },
        reportAIFiltersAccepted: () => {
            posthog.capture('ai_insights_function_filters_accepted', { type: values.type })
        },
        reportAIFiltersRejected: () => {
            posthog.capture('ai_insights_function_filters_rejected', { type: values.type })
        },
        reportAIFiltersPromptOpen: () => {
            posthog.capture('ai_insights_function_filters_prompt_open', { type: values.type })
        },
        reportAIInsightsFunctionInputsPrompted: () => {
            posthog.capture('ai_insights_function_inputs_prompted', { type: values.type })
        },
        reportAIInsightsFunctionInputsAccepted: () => {
            posthog.capture('ai_insights_function_inputs_accepted', { type: values.type })
        },
        reportAIInsightsFunctionInputsRejected: () => {
            posthog.capture('ai_insights_function_inputs_rejected', { type: values.type })
        },
        reportAIInsightsFunctionInputsPromptOpen: () => {
            posthog.capture('ai_insights_function_inputs_prompt_open', { type: values.type })
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

            if (maybeValidationError?.type === 'validation_error') {
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
                lemonToast.error('Error submitting configuration')
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

                lemonToast.success('Template updates applied but not saved.')
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
                // Catch all for any scenario where we need to redirect away from the template to the actual custom function

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
