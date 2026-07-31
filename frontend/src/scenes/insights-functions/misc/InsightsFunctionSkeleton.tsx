import { Skeleton } from 'lib/elements/Skeleton'

export function InsightsFunctionSkeleton(): JSX.Element {
    return (
        <div className="flex flex-row flex-wrap gap-4 h-120">
            <div className="flex flex-col flex-1 gap-4 min-w-60">
                <Skeleton className="flex-1 w-full h-full" />
                <Skeleton className="flex-1 w-full h-full" />
            </div>
            <div className="flex flex-col gap-4 flex-2 min-w-60">
                <Skeleton className="flex-1 w-full h-full" />
            </div>
        </div>
    )
}
