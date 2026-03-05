import FuseClass from 'fuse.js'
import { actions, connect, kea, key, listeners, path, props, reducers, selectors } from 'kea'
import { loaders } from 'kea-loaders'
import { actionToUrl, router, urlToAction } from 'kea-router'

import { lemonToast } from '@posthog/lemon-ui'

import api from 'lib/api'
import { featureFlagLogic } from 'lib/logic/featureFlagLogic'
import { objectsEqual } from 'lib/utils'
import { deleteWithUndo } from 'lib/utils/deleteWithUndo'
import { projectLogic } from 'scenes/projectLogic'
import { userLogic } from 'scenes/userLogic'

import { deleteFromTree, refreshTreeItem } from '~/layout/panel-layout/ProjectTree/projectTreeLogic'
import { CyclotronJobFiltersType, InsightsFunctionType, InsightsFunctionTypeType, UserType } from '~/types'

import type { insightsFunctionsListLogicType } from './insightsFunctionsListLogicType'

export const CDP_TEST_HIDDEN_FLAG = '[CDP-TEST-HIDDEN]'
// Helping kea-typegen navigate the exported default class for Fuse
export interface Fuse extends FuseClass<InsightsFunctionType> {}

export type InsightsFunctionListFilters = {
    search?: string
    showPaused?: boolean
    createdBy?: string | null
}

export type InsightsFunctionListLogicProps = {
    logicKey?: string
    type: InsightsFunctionTypeType
    additionalTypes?: InsightsFunctionTypeType[]
    forceFilterGroups?: CyclotronJobFiltersType[]
    syncFiltersWithUrl?: boolean
    manualFunctions?: InsightsFunctionType[]
}

export const shouldShowInsightsFunction = (insightsFunction: InsightsFunctionType, user?: UserType | null): boolean => {
    if (!user) {
        return false
    }
    if (insightsFunction.name.includes(CDP_TEST_HIDDEN_FLAG) && !user.is_impersonated && !user.is_staff) {
        return false
    }
    return true
}

export const insightsFunctionsListLogic = kea<insightsFunctionsListLogicType>([
    props({} as InsightsFunctionListLogicProps),
    key((props) =>
        JSON.stringify({
            ...props,
            manualFunctions: null, // We don't care about these
        })
    ),
    path((id) => ['scenes', 'pipeline', 'insightsFunctionsListLogic', id]),
    connect(() => ({
        values: [
            projectLogic,
            ['currentProjectId'],
            userLogic,
            ['user', 'hasAvailableFeature'],
            featureFlagLogic,
            ['featureFlags'],
        ],
    })),
    actions({
        toggleEnabled: (insightsFunction: InsightsFunctionType, enabled: boolean) => ({ insightsFunction, enabled }),
        deleteInsightsFunction: (insightsFunction: InsightsFunctionType) => ({ insightsFunction }),
        setFilters: (filters: Partial<InsightsFunctionListFilters>) => ({ filters }),
        resetFilters: true,
        addInsightsFunction: (insightsFunction: InsightsFunctionType) => ({ insightsFunction }),
        setReorderModalOpen: (open: boolean) => ({ open }),
        saveInsightsFunctionOrder: (newOrders: Record<string, number>) => ({ newOrders }),
    }),
    reducers(() => ({
        filters: [
            {} as InsightsFunctionListFilters,
            {
                setFilters: (state, { filters }) => ({
                    ...state,
                    ...filters,
                }),
                resetFilters: () => ({}),
            },
        ],
        reorderModalOpen: [
            false as boolean,
            {
                setReorderModalOpen: (_, { open }) => open,
            },
        ],
    })),
    loaders(({ values, actions, props }) => ({
        insightsFunctions: [
            [] as InsightsFunctionType[],
            {
                loadInsightsFunctions: async () => {
                    return (
                        await api.insightsFunctions.list({
                            filter_groups: props.forceFilterGroups,
                            types: [props.type, ...(props.additionalTypes || [])],
                            // TODO: This is a temporary fix. We need proper server-side pagination
                            // once we rework the data pipelines UI and batch exports is no longer
                            // part of the same list
                            limit: 300,
                        })
                    ).results
                },
                saveInsightsFunctionOrder: async ({ newOrders }) => {
                    return await api.insightsFunctions.rearrange(newOrders)
                },
                deleteInsightsFunction: async ({ insightsFunction }) => {
                    await deleteWithUndo({
                        endpoint: `projects/${values.currentProjectId}/insights_functions`,
                        object: {
                            id: insightsFunction.id,
                            name: insightsFunction.name,
                        },
                        callback: (undo) => {
                            if (undo) {
                                actions.loadInsightsFunctions()
                                refreshTreeItem('insights_function/', insightsFunction.id)
                            } else {
                                deleteFromTree('insights_function/', insightsFunction.id)
                            }
                        },
                    })

                    return values.insightsFunctions.filter((x) => x.id !== insightsFunction.id)
                },
                toggleEnabled: async ({ insightsFunction, enabled }) => {
                    const { insightsFunctions } = values
                    const insightsFunctionIndex = insightsFunctions.findIndex((hf) => hf.id === insightsFunction.id)
                    const response = await api.insightsFunctions.update(insightsFunction.id, {
                        enabled,
                    })
                    return [
                        ...insightsFunctions.slice(0, insightsFunctionIndex),
                        response,
                        ...insightsFunctions.slice(insightsFunctionIndex + 1),
                    ]
                },
                addInsightsFunction: ({ insightsFunction }) => {
                    return [insightsFunction, ...values.insightsFunctions]
                },
            },
        ],
    })),
    selectors({
        loading: [(s) => [s.insightsFunctionsLoading], (insightsFunctionsLoading) => insightsFunctionsLoading],
        sortedInsightsFunctions: [
            (s) => [s.insightsFunctions, (_, props) => props.manualFunctions ?? []],
            (insightsFunctions, manualFunctions): InsightsFunctionType[] => {
                const enabledFirst = [...insightsFunctions, ...manualFunctions].sort(
                    (a, b) => Number(b.enabled) - Number(a.enabled)
                )
                return enabledFirst
            },
        ],
        enabledInsightsFunctions: [
            (s) => [s.sortedInsightsFunctions],
            (insightsFunctions): InsightsFunctionType[] => {
                return insightsFunctions.filter((insightsFunction) => insightsFunction.enabled)
            },
        ],
        insightsFunctionsFuse: [
            (s) => [s.sortedInsightsFunctions],
            (insightsFunctions): Fuse => {
                return new FuseClass(insightsFunctions || [], {
                    keys: ['name', 'description'],
                    threshold: 0.3,
                })
            },
        ],

        filteredInsightsFunctions: [
            (s) => [s.filters, s.sortedInsightsFunctions, s.insightsFunctionsFuse, s.user],
            (filters, insightsFunctions, insightsFunctionsFuse, user): InsightsFunctionType[] => {
                const { search, showPaused, createdBy } = filters

                return (search ? insightsFunctionsFuse.search(search).map((x) => x.item) : insightsFunctions).filter((x) => {
                    if (!shouldShowInsightsFunction(x, user)) {
                        return false
                    }

                    if (!showPaused && !x.enabled) {
                        return false
                    }

                    if (createdBy && x.created_by?.uuid !== createdBy) {
                        return false
                    }

                    return true
                })
            },
        ],

        hiddenInsightsFunctions: [
            (s) => [s.sortedInsightsFunctions, s.filteredInsightsFunctions],
            (sortedInsightsFunctions, filteredInsightsFunctions): InsightsFunctionType[] => {
                return sortedInsightsFunctions.filter((insightsFunction) => !filteredInsightsFunctions.includes(insightsFunction))
            },
        ],
    }),

    listeners(({ actions }) => ({
        saveInsightsFunctionOrderSuccess: () => {
            actions.setReorderModalOpen(false)
            lemonToast.success('Order updated successfully')
        },
        saveInsightsFunctionOrderFailure: () => {
            lemonToast.error('Failed to update order')
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
