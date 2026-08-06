import { Skeleton } from '@hanzo/elements'

import { ScenePanelInfoSection } from '~/layout/scenes/SceneLayout'

/** Skeleton for the scene side panel's task-info block — mirrors the four labelled rows. */
export function TaskPanelSkeleton(): JSX.Element {
    return (
        <ScenePanelInfoSection>
            <div className="flex flex-col gap-3">
                <div>
                    <div className="text-xs text-muted mb-1">Task ID</div>
                    <Skeleton className="h-5 w-24" />
                </div>
                <div>
                    <div className="text-xs text-muted mb-1">Repository</div>
                    <Skeleton className="h-5 w-36" />
                </div>
                <div>
                    <div className="text-xs text-muted mb-1">Created by</div>
                    <Skeleton className="h-5 w-32" />
                </div>
                <div>
                    <div className="text-xs text-muted mb-1">Created</div>
                    <Skeleton className="h-5 w-40" />
                </div>
            </div>
        </ScenePanelInfoSection>
    )
}

/** Skeleton for the title-bar action buttons (Open in Insights Desktop / View PR / Run). */
export function TaskHeaderActionsSkeleton(): JSX.Element {
    return (
        <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-7 w-24" />
        </div>
    )
}

/** Skeleton for the run created/completed/duration metadata row. */
export function TaskRunMetadataSkeleton(): JSX.Element {
    return (
        <div className="items-center gap-4 hidden lg:flex">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-32" />
        </div>
    )
}
