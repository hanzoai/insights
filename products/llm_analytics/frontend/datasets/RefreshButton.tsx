import { IconRefresh } from '@hanzo/icons'
import { Button } from '@hanzo/elements'

import { Spinner } from 'lib/elements/Spinner'

export interface RefreshButtonProps {
    onClick: () => void
    isRefreshing: boolean
}

export function RefreshButton({ onClick, isRefreshing }: RefreshButtonProps): JSX.Element {
    return (
        <div className="relative">
            <Button
                onClick={onClick}
                type="secondary"
                icon={isRefreshing ? <Spinner textColored /> : <IconRefresh />}
                size="small"
                disabledReason={isRefreshing ? 'Refreshing...' : undefined}
            >
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </Button>
        </div>
    )
}
