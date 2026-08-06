import { useActions, useValues } from 'kea'
import insights from 'insights-js'

import { IconBell, IconRefresh } from '@hanzo/icons'

import { Banner } from 'lib/elements/Banner'
import { Button } from 'lib/elements/Button'
import { Skeleton } from 'lib/elements/Skeleton'
import { SceneExport } from 'scenes/sceneTypes'
import { urls } from 'scenes/urls'

import { SceneContent } from '~/layout/scenes/components/SceneContent'
import { SceneTitleSection } from '~/layout/scenes/components/SceneTitleSection'

import { pipelineHealthLogic } from './pipelineHealthLogic'
import type { DataHealthIssue } from './pipelineHealthLogic'
import { PipelineStatusIssueCard } from './PipelineStatusIssueCard'
import { pipelineStatusSceneLogic } from './pipelineStatusSceneLogic'
import { PipelineStatusSummary } from './PipelineStatusSummary'
import { PipelineStatusToolbar } from './PipelineStatusToolbar'

export const scene: SceneExport = {
    component: PipelineStatusScene,
    logic: pipelineStatusSceneLogic,
}

export function PipelineStatusScene(): JSX.Element {
    const { issues, healthIssuesLoading, hasErrors, issueCount } = useValues(pipelineHealthLogic)
    const { loadHealthIssues } = useActions(pipelineHealthLogic)
    const { filteredIssues, filteredIssueCount, isIssueDismissed } = useValues(pipelineStatusSceneLogic)
    const { dismissIssue, undismissIssue } = useActions(pipelineStatusSceneLogic)

    return (
        <SceneContent>
            <SceneTitleSection
                name="Pipeline status"
                description="Monitor the status of your data pipelines."
                resourceType={{
                    to: undefined,
                    type: 'pipeline_status',
                }}
                actions={
                    <>
                        <Button
                            type="secondary"
                            size="small"
                            icon={<IconBell className="size-4" />}
                            to={urls.healthAlerts(['external_data_failure', 'materialized_view_failure'])}
                            onClick={() => {
                                insights.capture('health_alerts_entry_point_clicked', {
                                    source: 'pipeline_status',
                                })
                            }}
                            tooltip="Subscribe to alerts when a pipeline fails"
                        >
                            Alerts
                        </Button>
                        <Button
                            type="primary"
                            size="small"
                            icon={<IconRefresh className="size-4" />}
                            disabledReason={healthIssuesLoading ? 'Refreshing...' : undefined}
                            onClick={() => loadHealthIssues()}
                        >
                            {healthIssuesLoading ? 'Refreshing...' : 'Refresh'}
                        </Button>
                    </>
                }
            />

            <div className="max-w-3xl space-y-4">
                {healthIssuesLoading && issues.length === 0 ? (
                    <div className="space-y-3">
                        <Skeleton className="h-8" />
                        <Skeleton className="h-20" />
                        <Skeleton className="h-20" />
                    </div>
                ) : hasErrors ? (
                    <div className="text-center text-muted p-4">
                        Error loading health information. Please try again later.
                    </div>
                ) : issueCount === 0 ? (
                    <Banner type="success" hideIcon={false}>
                        <p className="font-semibold">All data pipelines healthy</p>
                        <p className="text-sm mt-1">
                            Your sources, syncs, destinations, and transformations are running without issues.
                        </p>
                    </Banner>
                ) : (
                    <>
                        <PipelineStatusSummary />
                        <PipelineStatusToolbar />

                        {filteredIssueCount === 0 ? (
                            <div className="text-center text-muted p-8">No issues match your filters.</div>
                        ) : (
                            <div className="space-y-3">
                                {filteredIssues.map((issue: DataHealthIssue) => (
                                    <PipelineStatusIssueCard
                                        key={issue.id}
                                        issue={issue}
                                        isDismissed={isIssueDismissed(issue.id)}
                                        onDismiss={() => dismissIssue(issue.id)}
                                        onUndismiss={() => undismissIssue(issue.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </SceneContent>
    )
}
