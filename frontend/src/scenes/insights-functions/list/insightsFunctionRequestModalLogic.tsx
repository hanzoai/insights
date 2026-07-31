import { actions, connect, kea, listeners, path } from 'kea'
import insights from '@hanzo/insights'

import { Dialog, Input, TextArea, toast } from '@hanzo/elements'

import { Field } from 'lib/elements/Field'
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
            Dialog.openForm({
                title: `What ${humanizedType} would you like to see?`,
                initialValues: { name: name },
                errors: {
                    name: (x) => (!x ? 'Required' : undefined),
                },
                description: undefined,
                content: (
                    <div className="deprecated-space-y-2">
                        <Field name="name" label={`Name of the ${humanizedType}`}>
                            <Input placeholder="e.g. Insights" autoFocus />
                        </Field>
                        <Field name="details" label="Additional information" showOptional>
                            <TextArea
                                placeholder={`Any extra details about what you would need this ${humanizedType} to do or your overall goal`}
                            />
                        </Field>
                    </div>
                ),
                onSubmit: async (values) => {
                    insights.capture(`cdp custom function feedback`, { type, ...values })
                    toast.success('Thank you for your feedback!')
                },
            })
        },
    })),
])
