import './DisabledArea.scss'

import clsx from 'clsx'

import { Tooltip } from 'lib/elements/Tooltip'

export interface DisabledAreaProps extends React.HTMLAttributes<HTMLDivElement> {
    disabledReason?: string | null | false
}

export function DisabledArea({
    children,
    className,
    disabledReason,
    onClick,
    ...props
}: DisabledAreaProps): JSX.Element {
    const content = (
        <div
            className={clsx('DisabledArea', disabledReason && 'DisabledArea--disabled', className)}
            aria-disabled={!!disabledReason}
            onClick={disabledReason ? undefined : onClick}
            {...props}
        >
            {children}
        </div>
    )

    return disabledReason ? (
        <Tooltip title={<i>{disabledReason}</i>} placement="top-start">
            {content}
        </Tooltip>
    ) : (
        content
    )
}
