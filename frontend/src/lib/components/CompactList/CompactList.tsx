import './CompactList.scss'

import clsx from 'clsx'
import { useValues } from 'kea'

import { Button } from 'lib/elements/Button'
import { Divider } from 'lib/elements/Divider'
import { Skeleton } from 'lib/elements/Skeleton'

import { themeLogic } from '~/layout/navigation-3000/themeLogic'

import { EmptyMessage, EmptyMessageProps } from '../EmptyMessage/EmptyMessage'

interface CompactListProps {
    title?: string | JSX.Element
    viewAllURL?: string
    loading: boolean
    items: any[]
    emptyMessage?: EmptyMessageProps
    renderRow: (rowData: any, index: number) => JSX.Element
    /** Whether the content should have a fixed height or shrink to fit the content, with a max of the fixed height. Defaults to 'fixed'. */
    contentHeightBehavior?: 'fixed' | 'shrink'
}

export function CompactList({
    title,
    viewAllURL,
    loading,
    items,
    emptyMessage,
    renderRow,
    contentHeightBehavior = 'fixed',
}: CompactListProps): JSX.Element {
    const { theme } = useValues(themeLogic)
    return (
        <div
            className="CompactList"
            // eslint-disable-next-line react/forbid-dom-props
            style={theme?.boxStyle}
        >
            {title && (
                <>
                    <div className="CompactList__header">
                        <h3 className="px-2 truncate" title={typeof title === 'string' ? title : undefined}>
                            {title}
                        </h3>
                        {viewAllURL && <Button to={viewAllURL}>View all</Button>}
                    </div>
                    <div className="mx-2">
                        {/* This divider has to be within a div, because otherwise horizontal margin ADDS to the width */}
                        <Divider className="my-0" />
                    </div>
                </>
            )}
            <div className={clsx('CompactList__content', contentHeightBehavior === 'shrink' && 'max-h-[16rem] h-auto')}>
                {loading ? (
                    <div className="p-2 deprecated-space-y-6">
                        {Array.from({ length: 6 }, (_, index) => (
                            <Skeleton key={index} />
                        ))}
                    </div>
                ) : items.length === 0 && emptyMessage ? (
                    <EmptyMessage {...emptyMessage} />
                ) : (
                    <>{items.map((item, index) => renderRow(item, index))}</>
                )}
            </div>
        </div>
    )
}
