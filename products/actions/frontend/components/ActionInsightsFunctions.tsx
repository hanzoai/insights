import { useValues } from 'kea'

import { LemonBanner } from '@hanzo/lemon-ui'

import { cn } from 'lib/utils/css-classes'
import { LinkedInsightsFunctions } from 'scenes/insights-functions/list/LinkedInsightsFunctions'

import { SceneSection } from '~/layout/scenes/components/SceneSection'
import { ActionType } from '~/types'

import { actionEditLogic } from '../logics/actionEditLogic'
import { actionLogic } from '../logics/actionLogic'

export function ActionInsightsFunctions(): JSX.Element | null {
    const { action } = useValues(actionLogic)
    return !action ? null : <Functions action={action} />
}

const Functions = ({ action }: { action: ActionType }): JSX.Element => {
    const { hasCohortFilters, actionChanged, showCohortDisablesFunctionsWarning } = useValues(
        actionEditLogic({ id: action?.id, action })
    )
    return (
        <SceneSection
            className={cn('@container my-4 deprecated-space-y-2')}
            title="Connected destinations"
            description="Actions can be used as filters for destinations such as Slack or Webhook delivery"
        >
            {showCohortDisablesFunctionsWarning ? (
                <LemonBanner type="error">Adding a cohort filter will disable all connected destinations!</LemonBanner>
            ) : null}

            <LinkedInsightsFunctions
                type="destination"
                forceFilterGroups={[
                    {
                        actions: [
                            {
                                id: `${action.id}`,
                                name: action.name,
                                type: 'actions',
                            },
                        ],
                    },
                ]}
                newDisabledReason={
                    hasCohortFilters
                        ? "Action with cohort filters can't be used in realtime destinations"
                        : actionChanged
                          ? 'Please first save the action to create a destination'
                          : undefined
                }
            />
        </SceneSection>
    )
}
