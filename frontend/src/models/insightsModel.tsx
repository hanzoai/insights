import { actions, connect, kea, listeners, path } from 'kea'

import { Dialog, Input } from '@hanzo/elements'

import { Field } from 'lib/elements/Field'
import { toast } from 'lib/elements/Toast/Toast'
import { insightsApi } from 'scenes/insights/utils/api'
import { teamLogic } from 'scenes/teamLogic'

import { QueryBasedInsightModel } from '~/types'

import type { insightsModelType } from './insightsModelType'

export const insightsModel = kea<insightsModelType>([
    path(['models', 'insightsModel']),
    connect(() => ({ logic: [teamLogic] })),
    actions(() => ({
        renameInsight: (item: QueryBasedInsightModel) => ({ item }),
        renameInsightSuccess: (item: QueryBasedInsightModel) => ({ item }),
        // TODO: this duplicates the insight but not the dashboard tile (e.g. if duplicated from dashboard you lose tile color
        duplicateInsight: (item: QueryBasedInsightModel) => ({ item }),
        duplicateInsightSuccess: (item: QueryBasedInsightModel) => ({ item }),
        insightsAddedToDashboard: ({ dashboardId, insightIds }: { dashboardId: number; insightIds: number[] }) => ({
            dashboardId,
            insightIds,
        }),
    })),
    listeners(({ actions }) => ({
        renameInsight: async ({ item }) => {
            Dialog.openForm({
                title: 'Rename insight',
                initialValues: { insightName: item.name },
                content: (
                    <Field name="insightName">
                        <Input data-attr="insight-name" placeholder="Please enter the new name" autoFocus />
                    </Field>
                ),
                errors: {
                    insightName: (name) => (!name ? 'You must enter a name' : undefined),
                },
                onSubmit: async ({ insightName }) => {
                    const updatedItem = await insightsApi.update(item.id, { name: insightName })
                    toast.success(
                        <>
                            Renamed insight from <b>{item.name}</b> to <b>{insightName}</b>
                        </>
                    )
                    actions.renameInsightSuccess(updatedItem)
                },
            })
        },
        duplicateInsight: async ({ item }) => {
            // get the insight, to ensure we duplicate it without any changes that might have been made to it
            // e.g. any dashboard filters that were applied to it
            const insight = await insightsApi.getByNumericId(item.id)
            const addedItem = await insightsApi.duplicate(insight!)

            actions.duplicateInsightSuccess(addedItem)
            toast.success('Insight duplicated')
        },
    })),
])
