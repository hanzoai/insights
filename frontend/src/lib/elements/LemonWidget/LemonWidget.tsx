import './Widget.scss'

import clsx from 'clsx'

import { IconX } from '@hanzo/icons'

import { Button } from '../Button'

export interface WidgetProps {
    title: React.ReactNode
    onClose?: () => void
    actions?: React.ReactNode
    children: React.ReactNode
    className?: string
}

export function Widget({ title, onClose, actions, children, className }: WidgetProps): JSX.Element {
    return (
        <Widget className={className}>
            <Header>
                <span className="flex-1 text-primary-alt px-2 truncate">{title}</span>
                {actions}

                {onClose && <Button status="danger" onClick={onClose} size="small" icon={<IconX />} />}
            </Header>
            <Content>{children}</Content>
        </Widget>
    )
}

const Widget = ({ children, className }: { children: React.ReactNode; className?: string }): JSX.Element => {
    return <div className={clsx('Widget', className)}>{children}</div>
}

const Header = ({ children, className }: { children: React.ReactNode; className?: string }): JSX.Element => {
    return <div className={clsx('Widget__header', className)}>{children}</div>
}

const Content = ({ children }: { children: React.ReactNode }): JSX.Element => {
    return <div className="Widget__content border-t border-primary">{children}</div>
}
