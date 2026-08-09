import { useActions, useValues } from 'kea'

import { Button, MenuItems, MenuOverlay } from '@hanzo/elements'
import { IconChevronDown, IconPlay } from '@hanzo/icons'

import { featureFlagLogic } from 'lib/logic/featureFlagLogic'

import { notebookSettingsLogic } from '../../Notebook/notebookSettingsLogic'
import { isKernelUiEnabled } from '../../utils'
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

    const insightsqlRunMenuItems: MenuItems = [...buildRunMenuItems(onRun)]

    if (isKernelUiEnabled(featureFlags)) {
        insightsqlRunMenuItems.push({
            label: 'Toggle kernel info',
            onClick: () => setShowKernelInfo(!showKernelInfo),
        })
    }

    return (
        <Button
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
                    overlay: <MenuOverlay items={insightsqlRunMenuItems} />,
                },
                divider: false,
                'aria-label': 'Open run options',
                disabledReason: disabledReason,
            }}
        />
    )
}
