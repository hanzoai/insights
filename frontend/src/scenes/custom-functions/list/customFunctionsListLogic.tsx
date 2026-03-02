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
import { CyclotronJobFiltersType, CustomFunctionType, CustomFunctionTypeType, UserType } from '~/types'

import type { customFunctionsListLogicType } from './customFunctionsListLogicType'

export const CDP_TEST_HIDDEN_FLAG = '[CDP-TEST-HIDDEN]'
// Helping kea-typegen navigate the exported default class for Fuse
export interface Fuse extends FuseClass<CustomFunctionType> {}

export type CustomFunctionListFilters = {
    search?: string
    showPaused?: boolean
    createdBy?: string | null
}

export type CustomFunctionListLogicProps = {
    logicKey?: string
    type: CustomFunctionTypeType
    additionalTypes?: CustomFunctionTypeType[]
    forceFilterGroups?: CyclotronJobFiltersType[]
    syncFiltersWithUrl?: boolean
    manualFunctions?: CustomFunctionType[]
}

export const shouldShowCustomFunction = (customFunction: CustomFunctionType, user?: UserType | null): boolean => {
    if (!user) {
        return false
    }
    if (customFunction.name.includes(CDP_TEST_HIDDEN_FLAG) && !user.is_impersonated && !user.is_staff) {
        return false
    }
    return true
}

export const customFunctionsListLogic = kea<customFunctionsListLogicType>([
    props({} as CustomFunctionListLogicProps),
    key((props) =>
        JSON.stringify({
            ...props,
            manualFunctions: null, // We don't care about these
        })
    ),
    path((id) => ['scenes', 'pipeline', 'customFunctionsListLogic', id]),
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
        toggleEnabled: (customFunction: CustomFunctionType, enabled: boolean) => ({ customFunction, enabled }),
        deleteCustomFunction: (customFunction: CustomFunctionType) => ({ customFunction }),
        setFilters: (filters: Partial<CustomFunctionListFilters>) => ({ filters }),
        resetFilters: true,
        addCustomFunction: (customFunction: CustomFunctionType) => ({ customFunction }),
        setReorderModalOpen: (open: boolean) => ({ open }),
        saveCustomFunctionOrder: (newOrders: Record<string, number>) => ({ newOrders }),
    }),
    reducers(() => ({
        filters: [
            {} as CustomFunctionListFilters,
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
        customFunctions: [
            [] as CustomFunctionType[],
            {
                loadCustomFunctions: async () => {
                    return (
                        await api.customFunctions.list({
                            filter_groups: props.forceFilterGroups,
                            types: [props.type, ...(props.additionalTypes || [])],
                            // TODO: This is a temporary fix. We need proper server-side pagination
                            // once we rework the data pipelines UI and batch exports is no longer
                            // part of the same list
                            limit: 300,
                        })
                    ).results
                },
                saveCustomFunctionOrder: async ({ newOrders }) => {
                    return await api.customFunctions.rearrange(newOrders)
                },
                deleteCustomFunction: async ({ customFunction }) => {
                    await deleteWithUndo({
                        endpoint: `projects/${values.currentProjectId}/custom_functions`,
                        object: {
                            id: customFunction.id,
                            name: customFunction.name,
                        },
                        callback: (undo) => {
                            if (undo) {
                                actions.loadCustomFunctions()
                                refreshTreeItem('custom_function/', customFunction.id)
                            } else {
                                deleteFromTree('custom_function/', customFunction.id)
                            }
                        },
                    })

                    return values.customFunctions.filter((x) => x.id !== customFunction.id)
                },
                toggleEnabled: async ({ customFunction, enabled }) => {
                    const { customFunctions } = values
                    const customFunctionIndex = customFunctions.findIndex((hf) => hf.id === customFunction.id)
                    const response = await api.customFunctions.update(customFunction.id, {
                        enabled,
                    })
                    return [
                        ...customFunctions.slice(0, customFunctionIndex),
                        response,
                        ...customFunctions.slice(customFunctionIndex + 1),
                    ]
                },
                addCustomFunction: ({ customFunction }) => {
                    return [customFunction, ...values.customFunctions]
                },
            },
        ],
    })),
    selectors({
        loading: [(s) => [s.customFunctionsLoading], (customFunctionsLoading) => customFunctionsLoading],
        sortedCustomFunctions: [
            (s) => [s.customFunctions, (_, props) => props.manualFunctions ?? []],
            (customFunctions, manualFunctions): CustomFunctionType[] => {
                const enabledFirst = [...customFunctions, ...manualFunctions].sort(
                    (a, b) => Number(b.enabled) - Number(a.enabled)
                )
                return enabledFirst
            },
        ],
        enabledCustomFunctions: [
            (s) => [s.sortedCustomFunctions],
            (customFunctions): CustomFunctionType[] => {
                return customFunctions.filter((customFunction) => customFunction.enabled)
            },
        ],
        customFunctionsFuse: [
            (s) => [s.sortedCustomFunctions],
            (customFunctions): Fuse => {
                return new FuseClass(customFunctions || [], {
                    keys: ['name', 'description'],
                    threshold: 0.3,
                })
            },
        ],

        filteredCustomFunctions: [
            (s) => [s.filters, s.sortedCustomFunctions, s.customFunctionsFuse, s.user],
            (filters, customFunctions, customFunctionsFuse, user): CustomFunctionType[] => {
                const { search, showPaused, createdBy } = filters

                return (search ? customFunctionsFuse.search(search).map((x) => x.item) : customFunctions).filter((x) => {
                    if (!shouldShowCustomFunction(x, user)) {
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

        hiddenCustomFunctions: [
            (s) => [s.sortedCustomFunctions, s.filteredCustomFunctions],
            (sortedCustomFunctions, filteredCustomFunctions): CustomFunctionType[] => {
                return sortedCustomFunctions.filter((customFunction) => !filteredCustomFunctions.includes(customFunction))
            },
        ],
    }),

    listeners(({ actions }) => ({
        saveCustomFunctionOrderSuccess: () => {
            actions.setReorderModalOpen(false)
            lemonToast.success('Order updated successfully')
        },
        saveCustomFunctionOrderFailure: () => {
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
