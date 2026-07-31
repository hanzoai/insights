import './EmptyMessage.scss'

import { Button } from 'lib/elements/Button'

export interface EmptyMessageProps {
    title: string
    description: string
    buttonText?: string
    buttonTo?: string
    buttonOnClick?: () => void
    size?: 'small' | 'medium' | 'large'
}

export function EmptyMessage({
    title,
    description,
    buttonText,
    buttonTo,
    buttonOnClick,
    size = 'medium',
}: EmptyMessageProps): JSX.Element {
    return (
        <div className="empty-message">
            <div className="flex flex-col h-full items-center justify-center m-5">
                <h3 className="title">{title}</h3>

                <p className="text-secondary description">{description}</p>
                {buttonText && (
                    <Button type="secondary" to={buttonTo} onClick={buttonOnClick} size={size}>
                        {buttonText}
                    </Button>
                )}
            </div>
        </div>
    )
}
