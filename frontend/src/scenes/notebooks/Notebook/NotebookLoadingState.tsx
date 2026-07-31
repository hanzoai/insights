import { Skeleton } from 'lib/elements/Skeleton'

export function NotebookLoadingState(): JSX.Element {
    return (
        <div className="deprecated-space-y-4 px-8 py-4">
            <Skeleton className="w-1/2 h-8" />
            <Skeleton className="w-1/3 h-4" />
            <Skeleton className="h-4" />
            <Skeleton className="h-4" />
        </div>
    )
}
