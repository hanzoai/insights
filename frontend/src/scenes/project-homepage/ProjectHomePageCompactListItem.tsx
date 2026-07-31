import React from 'react'

import { Button, ButtonProps } from '@hanzo/elements'

export type RecentItemRowProps = Pick<ButtonProps, 'onClick' | 'to'> & {
    title: string
    subtitle: React.ReactNode
    prefix?: React.ReactNode
    suffix?: React.ReactNode
}

export function ProjectHomePageCompactListItem({
    to,
    onClick,
    title,
    subtitle,
    prefix,
    suffix,
}: RecentItemRowProps): JSX.Element {
    return (
        <Button fullWidth to={to} onClick={onClick} className="h-12">
            <div className="flex items-start justify-between overflow-hidden gap-2 flex-1">
                {prefix ? <span className="flex shrink-0 text-secondary text-xl">{prefix}</span> : null}

                <div className="truncate flex flex-col gap-y-0.5 flex-1">
                    <div className="text-link truncate">{title}</div>
                    <div className="truncate text-secondary font-normal text-xs">{subtitle}</div>
                </div>

                {suffix ? <span className="shrink-0">{suffix}</span> : null}
            </div>
        </Button>
    )
}
