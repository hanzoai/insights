import { Skeleton } from '@hanzo/elements'

export function LoadingState(): JSX.Element {
    return (
        <div className="deprecated-space-y-4">
            <Skeleton className="w-1/3 h-4" />
            <Skeleton />
            <Skeleton />
            <Skeleton className="w-2/3 h-4" />
        </div>
    )
}
