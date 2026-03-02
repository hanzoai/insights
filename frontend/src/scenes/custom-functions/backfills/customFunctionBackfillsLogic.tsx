import { actions, afterMount, connect, kea, key, listeners, path, props, reducers, selectors } from 'kea'

import { lemonToast } from '@posthog/lemon-ui'

import api from 'lib/api'

import { CustomFunctionConfigurationType } from '~/types'

import { customFunctionConfigurationLogic } from '../configuration/customFunctionConfigurationLogic'
import type { customFunctionBackfillsLogicType } from './customFunctionBackfillsLogicType'

export interface CustomFunctionBackfillsLogicProps {
    id: string
}

export const customFunctionBackfillsLogic = kea<customFunctionBackfillsLogicType>([
    props({} as CustomFunctionBackfillsLogicProps),
    key(({ id }: CustomFunctionBackfillsLogicProps) => id),
    path((key) => ['scenes', 'pipeline', 'customFunctionBackfillsLogic', key]),
    connect((props: CustomFunctionBackfillsLogicProps) => ({
        values: [customFunctionConfigurationLogic(props), ['configuration']],
        actions: [customFunctionConfigurationLogic(props), ['setConfigurationValues', 'loadCustomFunction']],
    })),
    actions({
        enableCustomFunctionBackfills: () => true,
        setLoading: (loading: boolean) => ({ loading }),
    }),
    reducers({
        isLoading: [
            false,
            {
                setLoading: (_, { loading }) => loading,
            },
        ],
    }),
    selectors({
        isReady: [
            (s) => [s.configuration, s.isLoading],
            (configuration: CustomFunctionConfigurationType, isLoading: boolean) => {
                return !!configuration.batch_export_id && !isLoading
            },
        ],
    }),
    listeners(({ actions, props }) => ({
        enableCustomFunctionBackfills: async () => {
            try {
                actions.setLoading(true)
                await api.customFunctions.enableBackfills(props.id)

                // Reload page to get the updated config and render <BatchExportBackfills />
                actions.loadCustomFunction()

                lemonToast.success('Backfills enabled for this destination.')
            } catch {
                lemonToast.error('Failed to enable backfills for this destination.')
            } finally {
                actions.setLoading(false)
            }
        },
    })),
    afterMount(({ actions, values }) => {
        if (!values.configuration.batch_export_id) {
            actions.enableCustomFunctionBackfills()
        }
    }),
])
