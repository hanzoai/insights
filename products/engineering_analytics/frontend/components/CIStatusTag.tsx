import { IconCheck, IconClock, IconX } from '@hanzo/icons'
import { Tag, Tooltip } from '@hanzo/elements'

import { CIRollup } from '../lib/ci'

function Count({ count, icon, className }: { count: number; icon: JSX.Element; className: string }): JSX.Element {
    return (
        <span className={`flex items-center gap-0.5 text-xs whitespace-nowrap ${className}`}>
            {icon}
            {count}
        </span>
    )
}

// Just the run tallies — passed / failed / still-running — as colored icon counts. At row height the marks
// carry the state, so there's no word label; the tooltip has the detail. "No CI" is the one case with no marks.
export function CIStatusTag({ rollup }: { rollup: CIRollup }): JSX.Element {
    if (rollup.runs === 0) {
        return <Tag type="muted">No CI</Tag>
    }
    return (
        <Tooltip
            title={`${rollup.passing} passed, ${rollup.failing} failed, ${rollup.pending} still running. Workflow-level status for the PR's latest commit, not per-check.`}
        >
            <span className="flex items-center gap-1.5">
                {rollup.passing > 0 && <Count count={rollup.passing} icon={<IconCheck />} className="text-success" />}
                {rollup.failing > 0 && <Count count={rollup.failing} icon={<IconX />} className="text-danger" />}
                {rollup.pending > 0 && <Count count={rollup.pending} icon={<IconClock />} className="text-secondary" />}
            </span>
        </Tooltip>
    )
}
