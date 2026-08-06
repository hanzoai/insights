import clsx from 'clsx'
import { ReactNode } from 'react'

import { Markdown } from '../Markdown'
import { Link, LinkProps } from '../Link'

interface TableLinkContentProps {
    title: JSX.Element | string
    description?: ReactNode
    /**
     * Let the title shrink and truncate (with an ellipsis) when the cell is narrower than the content,
     * instead of overflowing. The title itself must carry a `truncate` class for the ellipsis to show.
     */
    truncateTitle?: boolean
}

export function TableLink({
    title,
    description,
    truncateTitle,
    ...props
}: Pick<LinkProps, 'to' | 'onClick' | 'target' | 'className' | 'targetBlankIcon'> &
    TableLinkContentProps): JSX.Element {
    if (!props.to) {
        return <TableLinkContent title={title} description={description} truncateTitle={truncateTitle} />
    }

    return (
        <Link subtle {...props} className={clsx(props.className, truncateTitle && 'block min-w-0')}>
            <TableLinkContent title={title} description={description} truncateTitle={truncateTitle} />
        </Link>
    )
}

function TableLinkContent({ title, description, truncateTitle }: TableLinkContentProps): JSX.Element {
    return (
        <div className={clsx('flex flex-col py-1', truncateTitle && 'min-w-0')}>
            <div className={clsx('flex flex-row items-center font-semibold text-sm gap-1', truncateTitle && 'min-w-0')}>
                {title}
            </div>

            {description ? (
                <div className="text-xs text-tertiary mt-1">
                    {typeof description === 'string' ? (
                        <Markdown className="max-w-[30rem]" lowKeyHeadings>
                            {description}
                        </Markdown>
                    ) : (
                        description
                    )}
                </div>
            ) : null}
        </div>
    )
}
