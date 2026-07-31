import { IconAIText } from '@hanzo/icons'
import { Skeleton } from '@hanzo/elements'

export function LoadingState(): JSX.Element {
    return (
        <div className="flex flex-col gap-4 p-4">
            <div className="flex items-center gap-2 text-muted">
                <IconAIText className="text-lg animate-pulse" />
                <span>Analyzing log... Hold on tight!</span>
            </div>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex gap-2 mt-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-8 w-28" />
            </div>
        </div>
    )
}
