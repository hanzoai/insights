import FuseClass from 'fuse.js'
import { actions, connect, kea, key, listeners, path, props, reducers, selectors } from 'kea'
import { loaders } from 'kea-loaders'
import { actionToUrl, combineUrl, router, urlToAction } from 'kea-router'
import insights from '@hanzo/insights'

import { lemonToast } from '@hanzo/lemon-ui'

import api from 'lib/api'
import { FEATURE_FLAGS, FeatureFlagKey } from 'lib/constants'
import { featureFlagLogic } from 'lib/logic/featureFlagLogic'
import { objectsEqual } from 'lib/utils'
import { cleanSourceId, isManagedSourceId, isSelfManagedSourceId } from 'scenes/data-warehouse/utils'
import { urls } from 'scenes/urls'
import { userLogic } from 'scenes/userLogic'

import {
    CyclotronJobFiltersType,
    InsightsFunctionSubTemplateIdType,
    InsightsFunctionTemplateType,
    InsightsFunctionTemplateWithSubTemplateType,
    InsightsFunctionTypeType,
    UserType,
} from '~/types'

import { getSubTemplate } from '../sub-templates/sub-templates'
import type { insightsFunctionTemplateListLogicType } from './insightsFunctionTemplateListLogicType'

// Helping kea-typegen navigate the exported default class for Fuse
export interface Fuse extends FuseClass<InsightsFunctionTemplateType> {}

export type InsightsFunctionTemplateListFilters = {
    search?: string
}

export type InsightsFunctionTemplateListLogicProps = {
    /** The primary type of custom function to list */
    type: InsightsFunctionTypeType
    /** Additional types to list */
    additionalTypes?: InsightsFunctionTypeType[]
    /** If provided, only those templates will be shown */
    subTemplateIds?: InsightsFunctionSubTemplateIdType[] | null
    /** Overrides to be used when creating a new custom function */
    getConfigurationOverrides?: (subTemplateId?: InsightsFunctionSubTemplateIdType) => CyclotronJobFiltersType | undefined
    syncFiltersWithUrl?: boolean
    manualTemplates?: InsightsFunctionTemplateType[] | null
    manualTemplatesLoading?: boolean
    hideComingSoonByDefault?: boolean
    customFilterFunction?: (template: InsightsFunctionTemplateType) => boolean
    /** Extra search params to include in the URL when navigating to create a new custom function */
    queryParams?: Record<string, string>
}

export const shouldShowInsightsFunctionTemplate = (
    insightsFunctionTemplate: InsightsFunctionTemplateType,
    user?: UserType | null
): boolean => {
    if (!user) {
        return false
    }
    if (insightsFunctionTemplate.status === 'hidden' && !user.is_staff) {
        return false
    }
    return true
}

export const insightsFunctionTemplateListLogic = kea<insightsFunctionTemplateListLogicType>([
    props({
        manualTemplates: null,
        subTemplateIds: null,
    } as InsightsFunctionTemplateListLogicProps),
    key(
        (props) =>
            `${props.syncFiltersWithUrl ? 'scene' : 'default'}/${props.type ?? 'destination'}/${
                props.subTemplateIds?.join(',') ?? ''
            }`
    ),
    path((id) => ['scenes', 'pipeline', 'destinationsLogic', id]),
    connect(() => ({
        values: [featureFlagLogic, ['featureFlags'], userLogic, ['user', 'hasAvailableFeature']],
    })),
    actions({
        setFilters: (filters: Partial<InsightsFunctionTemplateListFilters>) => ({ filters }),
        resetFilters: true,
        registerInterest: (template: InsightsFunctionTemplateType) => ({ template }),
    }),
    reducers(() => ({
        filters: [
            {} as InsightsFunctionTemplateListFilters,
            {
                setFilters: (state, { filters }) => ({
                    ...state,
                    ...filters,
                }),
                resetFilters: () => ({}),
            },
        ],
    })),
    loaders(({ props }) => ({
        rawTemplates: [
            [] as InsightsFunctionTemplateType[],
            {
                loadInsightsFunctionTemplates: async () => {
                    return (
                        await api.insightsFunctions.listTemplates({
                            types: [props.type, ...(props.additionalTypes || [])],
                        })
                    ).results
                },
            },
        ],
    })),
    selectors({
        loading: [(s) => [s.rawTemplatesLoading], (x) => x],

        templates: [
            (s) => [
                s.rawTemplates,
                s.user,
                s.featureFlags,
                (_, p: InsightsFunctionTemplateListLogicProps) => p.manualTemplates ?? [],
                (_, p: InsightsFunctionTemplateListLogicProps) => p.subTemplateIds ?? [],
            ],
            (
                rawTemplates,
                user,
                featureFlags,
                manualTemplates,
                subTemplateIds
            ): InsightsFunctionTemplateWithSubTemplateType[] => {
                let templates: InsightsFunctionTemplateWithSubTemplateType[] = []

                if (!subTemplateIds?.length) {
                    templates = [
                        ...rawTemplates,
                        ...(manualTemplates || []),
                    ] as InsightsFunctionTemplateWithSubTemplateType[]
                } else {
                    // Special case for listing sub templates - we
                    for (const template of rawTemplates) {
                        for (const subTemplateId of subTemplateIds ?? []) {
                            const subTemplate = getSubTemplate(template, subTemplateId)

                            if (subTemplate) {
                                // Store it with the overrides applied
                                templates.push({
                                    ...template,
                                    ...subTemplate,
                                })
                            }
                        }
                    }
                }
                return templates
                    .filter((x) => shouldShowInsightsFunctionTemplate(x, user))
                    .filter((x) => !x.flag || !!featureFlags[x.flag as FeatureFlagKey])
                    .filter((x) => x.type !== 'source_webhook' || !!featureFlags[FEATURE_FLAGS.CDP_HOG_SOURCES])
                    .filter(
                        (x) =>
                            x.id !== 'template-source-vercel-log-drain' ||
                            !!featureFlags[FEATURE_FLAGS.CDP_VERCEL_LOG_DRAIN]
                    )
                    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
            },
        ],

        templatesFuse: [
            (s) => [s.templates],
            (templates): Fuse => {
                return new FuseClass(templates || [], {
                    keys: ['name', 'description'],
                    threshold: 0.3,
                })
            },
        ],

        filteredTemplates: [
            (s) => [
                s.filters,
                s.templates,
                s.templatesFuse,
                (_, props) => props.hideComingSoonByDefault ?? false,
                (_, props) => props.customFilterFunction ?? (() => true),
            ],
            (
                filters,
                templates,
                templatesFuse,
                hideComingSoonByDefault,
                customFilterFunction
            ): InsightsFunctionTemplateType[] => {
                const { search } = filters

                if (search) {
                    return templatesFuse
                        .search(search)
                        .map((x) => {
                            if (!customFilterFunction(x.item)) {
                                return null
                            }
                            return x.item
                        })
                        .filter(Boolean) as InsightsFunctionTemplateType[]
                }

                const [available, comingSoon] = templates.reduce(
                    ([available, comingSoon], template) => {
                        if (!customFilterFunction(template)) {
                            return [available, comingSoon]
                        }

                        if (template.status === 'coming_soon') {
                            if (!hideComingSoonByDefault) {
                                comingSoon.push(template)
                            }
                        } else {
                            available.push(template)
                        }
                        return [available, comingSoon]
                    },
                    [[], []] as InsightsFunctionTemplateType[][]
                )

                return [...available, ...comingSoon]
            },
        ],

        urlForTemplate: [
            () => [(_, props) => props],
            ({
                getConfigurationOverrides,
                queryParams,
            }): ((template: InsightsFunctionTemplateWithSubTemplateType) => string | null) => {
                return (template: InsightsFunctionTemplateWithSubTemplateType) => {
                    if (template.status === 'coming_soon') {
                        // "Coming soon" sources don't have docs yet
                        if (template.type === 'source') {
                            return null
                        }

                        return `https://hanzo.ai/docs/cdp/${template.type}s/${template.id}`
                    }

                    // TRICKY: Hacky place but this is where we handle "nonInsightsFunctionTemplates" to modify the linked url

                    if (isManagedSourceId(template.id) || isSelfManagedSourceId(template.id)) {
                        return urls.dataWarehouseSourceNew(cleanSourceId(template.id))
                    }

                    if (template.id.startsWith('batch-export-')) {
                        return urls.batchExportNew(template.id.replace('batch-export-', ''))
                    }

                    const subTemplate = template.sub_template_id
                        ? getSubTemplate(template, template.sub_template_id)
                        : null

                    const configurationOverrides = getConfigurationOverrides
                        ? getConfigurationOverrides(subTemplate?.sub_template_id)
                        : null

                    const filters =
                        configurationOverrides || subTemplate?.filters
                            ? {
                                  ...subTemplate?.filters,
                                  ...configurationOverrides,
                              }
                            : undefined

                    const configuration: Record<string, any> = {
                        ...subTemplate,
                        ...(filters ? { filters } : {}),
                    }

                    return combineUrl(urls.insightsFunctionNew(template.id), queryParams ?? {}, {
                        configuration,
                    }).url
                }
            },
        ],
    }),

    listeners(({ values }) => ({
        registerInterest: ({ template }) => {
            insights.capture('notify_me_pipeline', {
                name: template.name,
                type: template.type,
                email: values.user?.email,
            })

            lemonToast.success('Thank you for your interest! We will notify you when this feature is available.')
        },
    })),

    actionToUrl(({ props, values }) => {
        if (!props.syncFiltersWithUrl) {
            return {}
        }
        const urlFromFilters = (): [
            string,
            Record<string, any>,
            Record<string, any>,
            {
                replace: boolean
            },
        ] => [
            router.values.location.pathname,

            values.filters,
            router.values.hashParams,
            {
                replace: true,
            },
        ]

        return {
            setFilters: () => urlFromFilters(),
            resetFilters: () => urlFromFilters(),
        }
    }),

    urlToAction(({ props, actions, values }) => ({
        '*': (_, searchParams) => {
            if (!props.syncFiltersWithUrl) {
                return
            }

            if (!objectsEqual(values.filters, searchParams)) {
                actions.setFilters(searchParams)
            }
        },
    })),
])
