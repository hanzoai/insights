import { useActions, useValues } from 'kea'

import { IconChevronDown, IconPlay } from '@posthog/icons'
import { LemonButton, LemonMenuItems, LemonMenuOverlay } from '@posthog/lemon-ui'

import { FEATURE_FLAGS } from 'lib/constants'
import { featureFlagLogic } from 'lib/logic/featureFlagLogic'

import { notebookSettingsLogic } from '../../Notebook/notebookSettingsLogic'
import { NotebookRunMode, buildRunMenuItems } from './runMenuItems'

export type InsightsqlSqlRunMode = NotebookRunMode

type InsightsqlSqlRunMenuProps = {
    isFresh: boolean
    isStale: boolean
    loading: boolean
    queued: boolean
    disabledReason?: string
    onRun: (mode: InsightsqlSqlRunMode) => void
}

export const InsightsqlSqlRunMenu = ({
    isFresh,
    isStale,
    loading,
    queued,
    disabledReason,
    onRun,
}: InsightsqlSqlRunMenuProps): JSX.Element => {
    const { featureFlags } = useValues(featureFlagLogic)
    const { showKernelInfo } = useValues(notebookSettingsLogic)
    const { setShowKernelInfo } = useActions(notebookSettingsLogic)
    const insightsqlRunIconClass = isFresh ? 'text-success' : isStale ? 'text-danger' : undefined
    const insightsqlRunTooltip = `Run SQL (InsightsQL) query.${queued ? ' Queued.' : isStale ? ' Stale.' : ''}`

    const insightsqlRunMenuItems: LemonMenuItems = [...buildRunMenuItems(onRun)]

    if (featureFlags[FEATURE_FLAGS.NOTEBOOK_PYTHON]) {
        insightsqlRunMenuItems.push({
            label: 'Toggle kernel info',
            onClick: () => setShowKernelInfo(!showKernelInfo),
        })
    }

    return (
        <LemonButton
            onClick={() => onRun('auto')}
            size="small"
            icon={<IconPlay className={insightsqlRunIconClass} />}
            loading={loading || queued}
            disabledReason={disabledReason}
            tooltip={insightsqlRunTooltip}
            sideAction={{
                icon: <IconChevronDown />,
                dropdown: {
                    placement: 'bottom-end',
                    overlay: <LemonMenuOverlay items={insightsqlRunMenuItems} />,
                },
                divider: false,
                'aria-label': 'Open run options',
                disabledReason: disabledReason,
            }}
        />
    )
}
