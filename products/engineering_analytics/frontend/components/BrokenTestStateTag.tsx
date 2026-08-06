import { IconCheckCircle, IconInfo, IconWarning, IconWrench } from '@hanzo/icons'
import { Tag, TagType } from '@hanzo/elements'

import { BrokenTestState } from '../scenes/engineeringAnalyticsLogic'

// PROTOTYPE: mirrors PullRequestStateTag's shape — a state→config map rendered as a Tag.
const STATE_CONFIG: Record<BrokenTestState, { label: string; type: TagType; icon: JSX.Element }> = {
    breaking_master: { label: 'Breaking master', type: 'danger', icon: <IconWarning /> },
    novel_burst: { label: 'Novel burst', type: 'warning', icon: <IconWarning /> },
    potentially_resolved: { label: 'Maybe resolved', type: 'success', icon: <IconCheckCircle /> },
    flaky: { label: 'Flaky', type: 'muted', icon: <IconWrench /> },
    pr_only: { label: 'PR-only', type: 'default', icon: <IconInfo /> },
}

export function BrokenTestStateTag({ state }: { state: BrokenTestState }): JSX.Element {
    // Fall back to a muted tag of the raw value if a state ever lands outside the enum.
    const { label, type, icon } = STATE_CONFIG[state] ?? {
        label: state,
        type: 'muted' as TagType,
        icon: <IconInfo />,
    }
    return (
        <Tag type={type} icon={icon}>
            {label}
        </Tag>
    )
}
