import { useActions, useValues } from 'kea'
import { useEffect } from 'react'

import { IconExternal, IconTrash } from '@hanzo/icons'
import { Button, Dialog, Skeleton, Switch, Tag } from '@hanzo/elements'

import { slackIntegrationLogic } from 'lib/integrations/slackIntegrationLogic'
import { SceneExport } from 'scenes/sceneTypes'
import { urls } from 'scenes/urls'

import { SceneContent } from '~/layout/scenes/components/SceneContent'
import { SceneTitleSection } from '~/layout/scenes/components/SceneTitleSection'
import { InsightsFunctionType } from '~/types'

import {
    getInsightsFunctionEventKind,
    LOGS_ALERT_EVENT_KIND_META,
    LOGS_ALERT_EVENT_KIND_ORDER,
    LogsAlertEventKind,
    resolveGroupLabel,
} from 'products/logs/frontend/components/LogsAlerting/logsAlertUtils'

import {
    LogsAlertNotificationDetailSceneLogicProps,
    logsAlertNotificationDetailSceneLogic,
} from './logsAlertNotificationDetailSceneLogic'

export const scene: SceneExport<LogsAlertNotificationDetailSceneLogicProps> = {
    component: LogsAlertNotificationDetailScene,
    logic: logsAlertNotificationDetailSceneLogic,
    paramsToProps: ({ params: { id, insightsFunctionId } }) => ({ alertId: id, insightsFunctionId }),
}

export function LogsAlertNotificationDetailScene(): JSX.Element {
    const {
        alert,
        alertLoading,
        destinationGroup,
        insightsFunctionsLoading,
        hasLoaded,
        insightsFunctionsError,
        isDeleting,
        togglingInsightsFunctionIds,
        alertId,
        insightsFunctionId,
        firstSlackIntegration,
    } = useValues(logsAlertNotificationDetailSceneLogic)
    const { deleteDestination, loadInsightsFunctions, setInsightsFunctionEnabled } = useActions(
        logsAlertNotificationDetailSceneLogic
    )

    const slackLogic = slackIntegrationLogic({ id: firstSlackIntegration?.id ?? 0 })
    const { slackChannels } = useValues(slackLogic)
    const { loadAllSlackChannels } = useActions(slackLogic)

    useEffect(() => {
        if (firstSlackIntegration) {
            loadAllSlackChannels()
        }
    }, [firstSlackIntegration?.id, loadAllSlackChannels, firstSlackIntegration])

    const loading = alertLoading || insightsFunctionsLoading
    const displayLabel = destinationGroup ? resolveGroupLabel(destinationGroup, slackChannels) : 'Destination'
    const editorReturnTo = encodeURIComponent(urls.logsAlertNotificationDetail(alertId, insightsFunctionId))

    if (insightsFunctionsError) {
        return (
            <SceneContent>
                <SceneTitleSection
                    name="Couldn't load destination"
                    resourceType={{ type: 'logs' }}
                    actions={
                        <div className="flex items-center gap-2">
                            <Button type="secondary" to={urls.logsAlertDetail(alertId, 'notifications')}>
                                Back to alert
                            </Button>
                            <Button type="primary" onClick={() => loadInsightsFunctions()}>
                                Retry
                            </Button>
                        </div>
                    }
                />
                <div className="p-8 text-muted text-center">
                    Failed to load destination details: {insightsFunctionsError}
                </div>
            </SceneContent>
        )
    }

    if (hasLoaded && !destinationGroup) {
        return (
            <SceneContent>
                <SceneTitleSection
                    name="Destination not found"
                    resourceType={{ type: 'logs' }}
                    actions={
                        <Button type="secondary" to={urls.logsAlertDetail(alertId, 'notifications')}>
                            Back to alert
                        </Button>
                    }
                />
                <div className="p-8 text-muted text-center">
                    This notification destination no longer exists for this alert.
                </div>
            </SceneContent>
        )
    }

    const kindToFn = new Map<LogsAlertEventKind, InsightsFunctionType>()
    for (const hf of destinationGroup?.insightsFunctions ?? []) {
        const kind = getInsightsFunctionEventKind(hf)
        if (kind) {
            kindToFn.set(kind, hf)
        }
    }

    return (
        <SceneContent>
            <SceneTitleSection
                name={destinationGroup ? displayLabel : 'Destination'}
                description={alert ? `Notifications fired for alert "${alert.name}".` : undefined}
                resourceType={{ type: 'logs' }}
                isLoading={loading && !destinationGroup}
                actions={
                    destinationGroup ? (
                        <div className="flex items-center gap-2">
                            <Tag type={destinationGroup.enabled ? 'success' : 'default'}>
                                {destinationGroup.enabled ? 'Active' : 'Paused'}
                            </Tag>
                            <Button
                                size="small"
                                type="secondary"
                                status="danger"
                                icon={<IconTrash />}
                                disabledReason={isDeleting ? 'Removing…' : undefined}
                                onClick={() => {
                                    Dialog.open({
                                        title: `Remove ${displayLabel}?`,
                                        description:
                                            'This will delete all notification functions for this destination. The underlying script functions will be soft-deleted.',
                                        primaryButton: {
                                            children: 'Remove',
                                            type: 'primary',
                                            status: 'danger',
                                            onClick: () => deleteDestination(displayLabel),
                                            'data-attr': 'logs-alert-destination-delete-confirm',
                                        },
                                        secondaryButton: { children: 'Cancel' },
                                    })
                                }}
                                data-attr="logs-alert-destination-delete"
                            >
                                Remove destination
                            </Button>
                        </div>
                    ) : undefined
                }
            />
            <div className="flex flex-col gap-4 p-4 max-w-3xl">
                <p className="text-sm text-muted m-0">
                    These script functions only run for this alert. Open one to edit the message body, headers, filters, or
                    destination details for the matching lifecycle event.
                </p>

                {loading ? (
                    <Skeleton className="h-16" repeat={4} />
                ) : (
                    <div className="flex flex-col gap-2">
                        {LOGS_ALERT_EVENT_KIND_ORDER.map((kind) => {
                            const fn = kindToFn.get(kind)
                            const meta = LOGS_ALERT_EVENT_KIND_META[kind]
                            const isToggling = !!fn && togglingInsightsFunctionIds.includes(fn.id)
                            return (
                                <div key={kind} className="flex items-center justify-between border rounded p-3 gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-semibold">{meta.label}</span>
                                            {!fn && (
                                                <Tag type="warning" size="small">
                                                    Missing
                                                </Tag>
                                            )}
                                        </div>
                                        {fn ? <div className="text-xs text-muted mt-1 truncate">{fn.name}</div> : null}
                                        <div className="text-xs text-muted mt-1">{meta.description}</div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {fn ? (
                                            <Switch
                                                checked={fn.enabled}
                                                disabledReason={isToggling ? 'Saving…' : undefined}
                                                onChange={(checked) => setInsightsFunctionEnabled(fn.id, checked)}
                                                label={fn.enabled ? 'Active' : 'Paused'}
                                                data-attr={`logs-alert-destination-toggle-${kind}`}
                                            />
                                        ) : null}
                                        <Button
                                            size="small"
                                            type="secondary"
                                            icon={<IconExternal />}
                                            to={
                                                fn ? `${urls.insightsFunction(fn.id)}?returnTo=${editorReturnTo}` : undefined
                                            }
                                            tooltip={fn ? 'Open script function editor' : undefined}
                                            disabledReason={fn ? undefined : 'No script function for this event kind'}
                                            data-attr={`logs-alert-destination-open-${kind}`}
                                        >
                                            Open editor
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </SceneContent>
    )
}
