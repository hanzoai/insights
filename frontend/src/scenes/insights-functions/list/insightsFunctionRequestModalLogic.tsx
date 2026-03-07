import { actions, connect, kea, listeners, path } from 'kea'
import insights from '@hanzo/insights'

import { LemonDialog, LemonInput, LemonTextArea, lemonToast } from '@hanzo/lemon-ui'

import { LemonField } from 'lib/lemon-ui/LemonField'
import { featureFlagLogic } from 'lib/logic/featureFlagLogic'
import { userLogic } from 'scenes/userLogic'

import { InsightsFunctionTypeType } from '~/types'

import { humanizeInsightsFunctionType } from '../insights-function-utils'
import type { insightsFunctionRequestModalLogicType } from './insightsFunctionRequestModalLogicType'

export const insightsFunctionRequestModalLogic = kea<insightsFunctionRequestModalLogicType>([
    path(() => ['scenes', 'insights-functions', 'list', 'insightsFunctionRequestModalLogic']),
    connect(() => ({
        values: [userLogic, ['user'], featureFlagLogic, ['featureFlags']],
    })),
    actions({
        openFeedbackDialog: (type: InsightsFunctionTypeType, name: string = '') => ({ type, name }),
    }),

    listeners(() => ({
        openFeedbackDialog: async ({ type, name }, breakpoint) => {
            await breakpoint(100)
            const humanizedType = humanizeInsightsFunctionType(type)
            LemonDialog.openForm({
                title: `What ${humanizedType} would you like to see?`,
                initialValues: { name: name },
                errors: {
                    name: (x) => (!x ? 'Required' : undefined),
                },
                description: undefined,
                content: (
                    <div className="deprecated-space-y-2">
                        <LemonField name="name" label={`Name of the ${humanizedType}`}>
                            <LemonInput placeholder="e.g. Insights" autoFocus />
                        </LemonField>
                        <LemonField name="details" label="Additional information" showOptional>
                            <LemonTextArea
                                placeholder={`Any extra details about what you would need this ${humanizedType} to do or your overall goal`}
                            />
                        </LemonField>
                    </div>
                ),
                onSubmit: async (values) => {
                    insights.capture(`cdp custom function feedback`, { type, ...values })
                    lemonToast.success('Thank you for your feedback!')
                },
            })
        },
    })),
])
