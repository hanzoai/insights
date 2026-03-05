import { actions, connect, kea, listeners, path } from 'kea'
import posthog from 'posthog-js'

import { LemonDialog, LemonInput, LemonTextArea, lemonToast } from '@posthog/lemon-ui'

import { LemonField } from 'lib/lemon-ui/LemonField'
import { featureFlagLogic } from 'lib/logic/featureFlagLogic'
import { userLogic } from 'scenes/userLogic'

import { CustomFunctionTypeType } from '~/types'

import { humanizeCustomFunctionType } from '../custom-function-utils'
import type { customFunctionRequestModalLogicType } from './customFunctionRequestModalLogicType'

export const customFunctionRequestModalLogic = kea<customFunctionRequestModalLogicType>([
    path(() => ['scenes', 'custom-functions', 'list', 'customFunctionRequestModalLogic']),
    connect(() => ({
        values: [userLogic, ['user'], featureFlagLogic, ['featureFlags']],
    })),
    actions({
        openFeedbackDialog: (type: CustomFunctionTypeType, name: string = '') => ({ type, name }),
    }),

    listeners(() => ({
        openFeedbackDialog: async ({ type, name }, breakpoint) => {
            await breakpoint(100)
            const humanizedType = humanizeCustomFunctionType(type)
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
                            <LemonInput placeholder="e.g. PostHog" autoFocus />
                        </LemonField>
                        <LemonField name="details" label="Additional information" showOptional>
                            <LemonTextArea
                                placeholder={`Any extra details about what you would need this ${humanizedType} to do or your overall goal`}
                            />
                        </LemonField>
                    </div>
                ),
                onSubmit: async (values) => {
                    posthog.capture(`cdp custom function feedback`, { type, ...values })
                    lemonToast.success('Thank you for your feedback!')
                },
            })
        },
    })),
])
