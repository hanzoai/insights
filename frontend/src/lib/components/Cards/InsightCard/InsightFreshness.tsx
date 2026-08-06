import { IconClock, IconWarning } from '@hanzo/icons'

import { TZLabel } from 'lib/components/TZLabel'
import { dayjs } from 'lib/dayjs'
import { Button } from 'lib/elements/Button'
import { Tooltip } from 'lib/elements/Tooltip'

export function InsightFreshness({ lastRefresh }: { lastRefresh: string }): JSX.Element | null {
    if (!lastRefresh) {
        return null
    }

    const now = dayjs()
    const lastRefreshed = dayjs(lastRefresh)
    const diffHours = now.diff(lastRefreshed, 'hour')

    let icon: JSX.Element
    let status: 'default' | 'danger'

    if (diffHours < 24) {
        icon = <IconClock />
        status = 'default'
    } else {
        icon = <IconWarning />
        status = 'danger'
    }

    return (
        <Tooltip
            title={
                <div className="flex items-center gap-1">
                    <span>Computed</span>
                    <TZLabel time={lastRefresh} showPopover={false} />
                </div>
            }
        >
            <Button
                icon={icon}
                noPadding
                status={status}
                // Indicator is informational only — keep it out of the tab order, but labelled for screen readers.
                tabIndex={-1}
                aria-label="Last computed time"
                data-attr="insight-card-freshness"
                // Render the glyph at the surrounding heading's text size (as the bare icon did);
                // Button's default icon sizing made the clock noticeably larger than its row.
                style={{ '--lemon-button-font-size': '1em', '--lemon-button-icon-size': '1em' } as React.CSSProperties}
            />
        </Tooltip>
    )
}
