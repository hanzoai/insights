import './TableLoader.scss'

import React from 'react'
import { CSSTransition } from 'react-transition-group'

export function TableLoader({
    loading = false,
    tag = 'div',
    placement = 'bottom',
}: {
    loading?: boolean
    /** @default 'div' */
    tag?: 'div' | 'th'
    /** @default 'bottom' */
    placement?: 'bottom' | 'top'
}): JSX.Element {
    return (
        <CSSTransition in={loading} timeout={200} classNames="TableLoader-" appear mountOnEnter unmountOnExit>
            {React.createElement(tag, {
                className: `TableLoader ${placement === 'top' ? 'top-0' : '-bottom-px'}`,
            })}
        </CSSTransition>
    )
}
