import { Skeleton } from '@hanzo/elements'

export function BatchExportLoadingSkeleton(): JSX.Element {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Skeleton className="w-20 h-8" fade />
                <Skeleton className="w-32 h-10" fade />
            </div>
            <Skeleton className="w-full h-96" fade />
        </div>
    )
}
