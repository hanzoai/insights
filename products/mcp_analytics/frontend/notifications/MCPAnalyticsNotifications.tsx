import { useActions, useValues } from 'kea'
import { combineUrl, router } from 'kea-router'
import { useEffect } from 'react'

import { IconPlus, IconWarning } from '@hanzo/icons'
import { Banner, Button, Card, Skeleton, Switch, Link } from '@hanzo/elements'

import { ConfirmDeleteButton } from 'lib/components/ConfirmDeleteButton'
import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { OrganizationMembershipLevel } from 'lib/constants'
import { InsightsFunctionIcon } from 'scenes/insights-functions/configuration/InsightsFunctionIcon'
import { urlForInsightsFunction } from 'scenes/insights-functions/list/InsightsFunctionsList'
import { NewNotificationDialog } from 'scenes/insights-functions/list/NewNotificationDialog'
import { newNotificationDialogLogic } from 'scenes/insights-functions/list/newNotificationDialogLogic'
import { getNotificationDescription } from 'scenes/insights-functions/list/notificationDescription'
import {
    MCP_NOTIFICATION_BUTTON_LABELS,
    MCPMessageField,
    MCPNotificationSubTemplateId,
    mcpNotificationPreviewMessage,
} from 'scenes/insights-functions/sub-templates/sub-templates'
import { urls } from 'scenes/urls'

import { InsightsFunctionType } from '~/types'

import {
    getMCPNotificationUseCase,
    mcpAnalyticsNotificationsLogic,
    MCPNotificationUseCase,
} from './mcpAnalyticsNotificationsLogic'
import { MCPNotificationExample, mcpNotificationExamplesLogic } from './mcpNotificationExamplesLogic'
import { MCPNotificationPreview } from './MCPNotificationPreview'
import { MCPRecurringReports } from './MCPRecurringReports'

interface MCPUseCaseConfig {
    useCase: MCPNotificationUseCase
    subTemplateId: MCPNotificationSubTemplateId
    icon: JSX.Element
    headline: string
    lead: string
    dialogTitle: string
    /** Shown until the project's own latest event loads; the copy always comes from the template. */
    sample: Record<MCPMessageField, string>
    /** Caption for a preview built from the project's own event. */
    realCaption: string
}

const USE_CASES: MCPUseCaseConfig[] = [
    {
        useCase: 'tool-error',
        subTemplateId: 'mcp-tool-error',
        icon: <IconWarning />,
        headline: 'A tool call failed',
        lead: 'Which tool broke, what the agent wanted, and a link to the detail.',
        dialogTitle: 'Notify me about failing tool calls',
        sample: {
            clientName: 'Claude Code',
            serverName: 'acme-mcp',
            intent: 'find out why signups dropped after Tuesday’s release',
            toolName: 'query-events',
        },
        realCaption: 'Your most recent',
    },
]

function NotificationRow({ notification }: { notification: InsightsFunctionType }): JSX.Element {
    const { notificationsLoading, pendingToggleIds } = useValues(mcpAnalyticsNotificationsLogic)
    const { toggleNotificationEnabled, deleteNotification } = useActions(mcpAnalyticsNotificationsLogic)
    const { searchParams } = useValues(router)

    const description = getNotificationDescription(notification)

    return (
        <div className="flex items-center gap-2 rounded border p-2">
            <InsightsFunctionIcon src={notification.icon_url} size="small" />
            <div className="min-w-0 flex-1">
                <Link
                    to={urlForInsightsFunction(
                        notification,
                        // Carry the scene's shared params (date range) so returning doesn't reset them
                        combineUrl(urls.mcpAnalyticsNotifications(), searchParams).url
                    )}
                    className="font-medium truncate"
                >
                    {notification.name}
                </Link>
                {description ? <div className="text-xs text-muted truncate">{description}</div> : null}
            </div>
            <Switch
                checked={notification.enabled}
                onChange={() => toggleNotificationEnabled(notification.id, !notification.enabled)}
                loading={!!pendingToggleIds[notification.id]}
                // Refresh in flight: a mutation started now could be clobbered by the stale response
                disabled={notificationsLoading}
                aria-label={`Enable ${notification.name}`}
            />
            <ConfirmDeleteButton
                onDelete={() => deleteNotification(notification)}
                disabledReason={
                    notificationsLoading
                        ? 'Refreshing notifications…'
                        : pendingToggleIds[notification.id]
                          ? 'Waiting for the enable/disable update to finish…'
                          : undefined
                }
                data-attr="mcp-analytics-notification-delete"
            />
        </div>
    )
}

interface UseCaseCardProps {
    config: MCPUseCaseConfig
    notifications: InsightsFunctionType[]
    onAdd: () => void
    addDisabledReason?: string
    /** The project's own latest event for this use case, once it has loaded. */
    example?: MCPNotificationExample
}

function UseCaseCard({ config, notifications, onAdd, addDisabledReason, example }: UseCaseCardProps): JSX.Element {
    return (
        <Card hoverEffect={false} className="flex flex-col gap-2 p-3">
            <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-start gap-1.5">
                    <span className="mt-0.5 shrink-0 text-muted">{config.icon}</span>
                    <div className="min-w-0">
                        <h3 className="m-0 text-sm font-semibold">{config.headline}</h3>
                        <p className="m-0 text-xs text-muted">{config.lead}</p>
                    </div>
                </div>
                <Button
                    type={notifications.length > 0 ? 'secondary' : 'primary'}
                    size="xsmall"
                    icon={<IconPlus />}
                    onClick={onAdd}
                    disabledReason={addDisabledReason}
                    data-attr={`mcp-analytics-add-notification-${config.useCase}`}
                >
                    {notifications.length > 0 ? 'Add' : 'Notify me'}
                </Button>
            </div>

            <MCPNotificationPreview
                message={mcpNotificationPreviewMessage(example ?? config.sample)}
                buttonLabel={MCP_NOTIFICATION_BUTTON_LABELS[config.subTemplateId]}
                caption={example ? config.realCaption : 'Example'}
            />

            {notifications.length > 0 && (
                <div className="flex flex-col gap-1">
                    {notifications.map((notification) => (
                        <NotificationRow key={notification.id} notification={notification} />
                    ))}
                </div>
            )}
        </Card>
    )
}

export function MCPAnalyticsNotifications(): JSX.Element {
    const { notifications, notificationsLoaded, notificationsFailed } = useValues(mcpAnalyticsNotificationsLogic)
    const { loadNotifications } = useActions(mcpAnalyticsNotificationsLogic)
    const { examples } = useValues(mcpNotificationExamplesLogic)
    const { loadExamples } = useActions(mcpNotificationExamplesLogic)
    const addDisabledReason = useRestrictedArea({
        scope: RestrictionScope.Project,
        minimumAccessLevel: OrganizationMembershipLevel.Admin,
    })

    useEffect(() => {
        loadNotifications()
        // The previews render sample copy straight away and upgrade to the project's own events when
        // this lands, so there's deliberately no loading state to wait on.
        loadExamples()
    }, [loadNotifications, loadExamples])

    const onCreated = (): void => {
        loadNotifications()
    }

    // One dialog logic per use case, called in a fixed order so the hook calls stay stable.
    const { openDialog: openToolErrorDialog } = useActions(
        newNotificationDialogLogic({ subTemplateId: 'mcp-tool-error', onCreated })
    )
    const openDialogFor: Record<MCPNotificationSubTemplateId, () => void> = {
        'mcp-tool-error': openToolErrorDialog,
    }

    // Anything the filters matched but we can't classify still needs a home, so it can't be
    // silently dropped from the list.
    const unclassified = notifications.filter((notification) => !getMCPNotificationUseCase(notification))

    const instantAlerts = notificationsFailed ? (
        <Banner
            type="error"
            action={{ children: 'Try again', onClick: () => loadNotifications() }}
            data-attr="mcp-analytics-notifications-load-error"
        >
            We couldn't load your MCP alerts. Please try again in a moment.
        </Banner>
    ) : !notificationsLoaded ? (
        <div className="grid gap-2 md:grid-cols-2">
            {USE_CASES.map((config) => (
                <Card key={config.useCase} hoverEffect={false} className="flex flex-col gap-2 p-3">
                    <Skeleton className="h-4 w-48 max-w-full" />
                    <Skeleton className="h-16 w-full" />
                </Card>
            ))}
        </div>
    ) : (
        <>
            <div className="grid gap-2 md:grid-cols-2">
                {USE_CASES.map((config) => (
                    <UseCaseCard
                        key={config.useCase}
                        config={config}
                        notifications={notifications.filter(
                            (notification) => getMCPNotificationUseCase(notification) === config.useCase
                        )}
                        onAdd={openDialogFor[config.subTemplateId]}
                        addDisabledReason={addDisabledReason ?? undefined}
                        example={examples[config.useCase]}
                    />
                ))}
            </div>

            {unclassified.length > 0 && (
                <Card hoverEffect={false} className="flex flex-col gap-1 p-3">
                    <h3 className="m-0 text-sm font-semibold">Other MCP alerts</h3>
                    {unclassified.map((notification) => (
                        <NotificationRow key={notification.id} notification={notification} />
                    ))}
                </Card>
            )}
        </>
    )

    return (
        <div className="flex flex-col gap-6" data-attr="mcp-analytics-notifications">
            <MCPRecurringReports />

            <section className="flex flex-col gap-2">
                <h2 className="m-0 text-base font-semibold">Instant alerts</h2>
                <p className="m-0 text-sm text-muted">
                    One message per event, for the things you'd want to hear about the moment they happen. A busy server
                    can send a lot of these.
                </p>
                {instantAlerts}
            </section>

            {USE_CASES.map((config) => (
                <NewNotificationDialog
                    key={config.subTemplateId}
                    subTemplateId={config.subTemplateId}
                    onCreated={onCreated}
                    title={config.dialogTitle}
                />
            ))}
        </div>
    )
}
