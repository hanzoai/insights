import { useActions } from 'kea'

import { IconRewindPlay } from '@hanzo/icons'
import { Tag } from '@hanzo/elements'

import { Button } from 'lib/elements/Button'

import type { Experiment } from '~/types'

import { experimentLogic } from '../experimentLogic'
import { useSessionReplaySummaryMaxTool } from '../hooks/useSessionReplaySummaryMaxTool'

type SummarizeSessionReplaysButtonProps = {
    experiment: Experiment
}

/**
 * Calls the Max tool to summarize session replays for an experiment.
 */
export const SummarizeSessionReplaysButton = ({
    experiment,
}: SummarizeSessionReplaysButtonProps): JSX.Element | null => {
    const { openMax } = useSessionReplaySummaryMaxTool()
    const { reportExperimentSessionReplaySummaryRequested } = useActions(experimentLogic)

    if (!openMax) {
        return null
    }

    return (
        <Button
            size="small"
            onClick={() => {
                reportExperimentSessionReplaySummaryRequested(experiment)
                openMax()
            }}
            type="secondary"
            icon={<IconRewindPlay />}
            tooltip="Use AI to analyze session replays and identify patterns in user behavior across experiment variants. Discover insights about how users interact with your variants."
        >
            Summarize session replays
            <Tag type="highlight" size="small" className="ml-1">
                Beta
            </Tag>
        </Button>
    )
}
