import { Skeleton } from 'lib/elements/Skeleton'

export function WorldMapTileSkeleton(): JSX.Element {
    return (
        <div data-attr="web-analytics-skeleton-world-map" className="flex flex-col flex-1 px-4 py-4 gap-3">
            <Skeleton className="w-full aspect-[2/1] rounded-md" />
            <div className="flex flex-row items-center justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-32" />
            </div>
        </div>
    )
}
