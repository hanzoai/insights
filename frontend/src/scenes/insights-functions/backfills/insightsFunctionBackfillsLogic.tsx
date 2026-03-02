import { actions, afterMount, connect, kea, key, listeners, path, props, reducers, selectors } from 'kea'

import { lemonToast } from '@posthog/lemon-ui'

import api from 'lib/api'

import { InsightsFunctionConfigurationType } from '~/types'

import { insightsFunctionConfigurationLogic } from '../configuration/insightsFunctionConfigurationLogic'
import type { insightsFunctionBackfillsLogicType } from './insightsFunctionBackfillsLogicType'

export interface InsightsFunctionBackfillsLogicProps {
    id: string
}

export const insightsFunctionBackfillsLogic = kea<insightsFunctionBackfillsLogicType>([
    props({} as InsightsFunctionBackfillsLogicProps),
    key(({ id }: InsightsFunctionBackfillsLogicProps) => id),
    path((key) => ['scenes', 'pipeline', 'insightsFunctionBackfillsLogic', key]),
    connect((props: InsightsFunctionBackfillsLogicProps) => ({
        values: [insightsFunctionConfigurationLogic(props), ['configuration']],
        actions: [insightsFunctionConfigurationLogic(props), ['setConfigurationValues', 'loadInsightsFunction']],
    })),
    actions({
        enableInsightsFunctionBackfills: () => true,
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
            (configuration: InsightsFunctionConfigurationType, isLoading: boolean) => {
                return !!configuration.batch_export_id && !isLoading
            },
        ],
    }),
    listeners(({ actions, props }) => ({
        enableInsightsFunctionBackfills: async () => {
            try {
                actions.setLoading(true)
                await api.insightsFunctions.enableBackfills(props.id)

                // Reload page to get the updated config and render <BatchExportBackfills />
                actions.loadInsightsFunction()

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
            actions.enableInsightsFunctionBackfills()
        }
    }),
])
