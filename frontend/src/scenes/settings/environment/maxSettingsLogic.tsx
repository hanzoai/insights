import { actions, afterMount, kea, listeners, path, reducers } from 'kea'
import { forms } from 'kea-forms'
import { loaders } from 'kea-loaders'

import api from 'lib/api'
import { AI_AVAILABLE } from 'lib/constants'
import { toast } from 'lib/elements/Toast/Toast'

import { CoreMemory } from '~/types'

import type { maxSettingsLogicType } from './maxSettingsLogicType'

export type CoreMemoryForm = {
    text: string
}

export const maxSettingsLogic = kea<maxSettingsLogicType>([
    path(['scenes', 'project', 'Settings', 'maxSettingsLogic']),

    actions({
        setIsLoading: (isLoading: boolean) => ({ isLoading }),
    }),

    reducers({
        isLoading: [
            false,
            {
                loadCoreMemory: () => true,
                loadCoreMemorySuccess: () => false,
                loadCoreMemoryFailure: () => false,
            },
        ],

        isUpdating: [
            false,
            {
                createCoreMemory: () => true,
                createCoreMemorySuccess: () => false,
                createCoreMemoryFailure: () => false,
                updateCoreMemory: () => true,
                updateCoreMemorySuccess: () => false,
                updateCoreMemoryFailure: () => false,
            },
        ],
    }),

    loaders(({ values }) => ({
        coreMemory: {
            __default: null as CoreMemory | null,
            loadCoreMemory: async (): Promise<CoreMemory | null> => {
                const response = await api.coreMemory.list()
                return response.results[0] || null
            },
            updateCoreMemory: async (data: CoreMemoryForm) => {
                if (!values.coreMemory) {
                    const response = await api.coreMemory.create(data)
                    toast.success('Insights AI mmory has been created.')
                    return response
                }

                const response = await api.coreMemory.update(values.coreMemory.id, data)
                toast.success('Insights AI memory has been updated.')
                return response
            },
        },
    })),

    forms(({ actions }) => ({
        coreMemoryForm: {
            defaults: { text: '' } as CoreMemoryForm,
            submit: ({ text }) => {
                actions.updateCoreMemory({ text })
            },
        },
    })),

    listeners(({ actions }) => ({
        loadCoreMemorySuccess: ({ coreMemory }) => {
            if (coreMemory) {
                actions.setCoreMemoryFormValue('text', coreMemory.text)
            }
        },
    })),

    afterMount(({ actions }) => {
        if (AI_AVAILABLE) {
            actions.loadCoreMemory()
        }
    }),
])
