import { useActions, useValues } from 'kea'

import { IconChevronDown, IconPlay } from '@hanzo/icons'
import { Button, MenuItems, MenuOverlay } from '@hanzo/elements'

import { featureFlagLogic } from 'lib/logic/featureFlagLogic'

import { notebookSettingsLogic } from '../../Notebook/notebookSettingsLogic'
import { isKernelUiEnabled } from '../../utils'
import { NotebookRunMode, buildRunMenuItems } from './runMenuItems'

export type HogqlSqlRunMode = NotebookRunMode

type HogqlSqlRunMenuProps = {
    isFresh: boolean
    isStale: boolean
    loading: boolean
    queued: boolean
    disabledReason?: string
    onRun: (mode: HogqlSqlRunMode) => void
}

export const HogqlSqlRunMenu = ({
    isFresh,
    isStale,
    loading,
    queued,
    disabledReason,
    onRun,
}: HogqlSqlRunMenuProps): JSX.Element => {
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
