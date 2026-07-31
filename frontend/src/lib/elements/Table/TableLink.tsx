import { ReactNode } from 'react'

import { Markdown } from '../Markdown'
import { Link, LinkProps } from '../Link'

interface TableLinkContentProps {
    title: JSX.Element | string
    description?: ReactNode
}

export function TableLink({
    title,
    description,
    ...props
}: Pick<LinkProps, 'to' | 'onClick' | 'target' | 'className' | 'targetBlankIcon'> &
    TableLinkContentProps): JSX.Element {
    if (!props.to) {
        return <TableLinkContent title={title} description={description} />
    }

    return (
        <Link subtle {...props}>
            <TableLinkContent title={title} description={description} />
        </Link>
    )
}

function TableLinkContent({ title, description }: TableLinkContentProps): JSX.Element {
    return (
        <div className="flex flex-col py-1">
            <div className="flex flex-row items-center font-semibold text-sm gap-1">{title}</div>

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
