import { useActions, useValues } from 'kea'

import { IconCollapse } from '@hanzo/icons'

import { Button } from 'lib/elements/Button'
import { More } from 'lib/elements/Button/More'
import { Spinner } from 'lib/elements/Spinner'
import { insightLogic } from 'scenes/insights/insightLogic'

import { FunnelPathType } from '~/types'

import { journeyEditorLogic } from 'products/customer_analytics/frontend/components/CustomerJourneys/journeyEditorLogic'

import { funnelDataLogic } from '../funnelDataLogic'
import { funnelPathsExpansionLogic } from './funnelPathsExpansionLogic'

type FunnelStepMoreFlowProps = {
    stepIndex: number
}

export function FunnelStepMoreFlow({ stepIndex }: FunnelStepMoreFlowProps): JSX.Element | null {
    const { insightProps } = useValues(insightLogic)
    const { querySource } = useValues(funnelDataLogic(insightProps))
    const { expandedPath, pathsLoading } = useValues(funnelPathsExpansionLogic(insightProps))
    const { expandPath, collapsePath } = useActions(funnelPathsExpansionLogic(insightProps))
    const { isEditMode } = useValues(journeyEditorLogic)

    const stepNumber = stepIndex + 1
    const editModeLocked = isEditMode

    if (querySource?.aggregation_group_type_index != null) {
        return null
    }

    const isActiveOnThisStep = expandedPath !== null && expandedPath.stepIndex === stepIndex

    const isActiveExpansion = (pathType: FunnelPathType, dropOff: boolean): boolean =>
        isActiveOnThisStep && expandedPath!.pathType === pathType && expandedPath!.dropOff === dropOff

    const handleClick = (pathType: FunnelPathType, dropOff: boolean): void => {
        if (isActiveExpansion(pathType, dropOff)) {
            collapsePath()
        } else {
            expandPath({ stepIndex, pathType, dropOff })
        }
    }

    if (isActiveOnThisStep) {
        return pathsLoading ? (
            <Spinner textColored className="text-lg" />
        ) : (
            <Button
                size="xsmall"
                icon={<IconCollapse />}
                onClick={() => collapsePath()}
                disabledReason={editModeLocked ? 'Save or cancel staged changes first' : undefined}
            />
        )
    }

    return (
        <More
            disabledReason={editModeLocked ? 'Save or cancel staged changes first' : undefined}
            placement="bottom-start"
            noPadding
            overlay={
                <>
                    {stepNumber > 1 && (
                        <Button fullWidth onClick={() => handleClick(FunnelPathType.before, false)}>
                            Show paths leading to step
                        </Button>
                    )}
                    {stepNumber > 1 && (
                        <Button fullWidth onClick={() => handleClick(FunnelPathType.between, false)}>
                            Show paths between previous step and this step
                        </Button>
                    )}
                    <Button fullWidth onClick={() => handleClick(FunnelPathType.after, false)}>
                        Show paths after step
                    </Button>
                    {stepNumber > 1 && (
                        <Button fullWidth onClick={() => handleClick(FunnelPathType.after, true)}>
                            Show paths after dropoff
                        </Button>
                    )}
                    {stepNumber > 1 && (
                        <Button fullWidth onClick={() => handleClick(FunnelPathType.before, true)}>
                            Show paths before dropoff
                        </Button>
                    )}
                </>
            }
        />
    )
}
