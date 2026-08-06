import { useActions, useValues } from 'kea'
import insights from 'insights-js'

import { IconBell, IconRefresh } from '@hanzo/icons'
import { Banner, Button, Tag, Link } from '@hanzo/elements'

import { useOnMountEffect } from 'lib/hooks/useOnMountEffect'
import { inStorybook, inStorybookTestRunner } from 'lib/utils/dom'
import { preflightLogic } from 'scenes/PreflightCheck/preflightLogic'
import { SceneExport } from 'scenes/sceneTypes'
import { urls } from 'scenes/urls'

import { SceneContent } from '~/layout/scenes/components/SceneContent'
import { SceneTitleSection } from '~/layout/scenes/components/SceneTitleSection'

import { SdkSection } from './SdkHealthComponents'
import { SdkType, sdkHealthLogic } from './sdkHealthLogic'
import { sdkHealthSceneLogic } from './sdkHealthSceneLogic'

export const scene: SceneExport = {
    component: SdkHealthScene,
    logic: sdkHealthSceneLogic,
}

export function SdkHealthScene(): JSX.Element {
    const {
        augmentedData,
        reportLoading: loading,
        needsUpdatingCount,
        hasErrors,
        snoozedUntil,
    } = useValues(sdkHealthLogic)
    const { isDev } = useValues(preflightLogic)

    const { loadReport, snoozeSdkHealth } = useActions(sdkHealthLogic)

    useOnMountEffect(() => {
        insights.capture('sdk doctor loaded', { needsUpdatingCount })
    })

    const scanEvents = (): void => {
        insights.capture('sdk doctor scan events')
        loadReport({ forceRefresh: true })
    }

    const snoozeWarning = (): void => {
        insights.capture('sdk doctor snooze warning')
        snoozeSdkHealth()
    }

    return (
        <SceneContent>
            <SceneTitleSection
                name="SDK Health"
                description="Monitor and maintain your Insights SDK integrations by automatically detecting version issues, configuration problems, and implementation patterns across your applications."
                resourceType={{
                    to: undefined,
                    type: 'sdk_health',
                }}
                actions={
                    <>
                        <Button
                            size="small"
                            type="secondary"
                            to={urls.healthAlerts(['sdk_outdated'])}
                            onClick={() => {
                                insights.capture('health_alerts_entry_point_clicked', { source: 'sdk_health' })
                            }}
                            icon={<IconBell className="size-4" />}
                            tooltip="Subscribe to alerts when SDKs go outdated"
                        >
                            Alerts
                        </Button>
                        <Button
                            size="small"
                            type="primary"
                            disabledReason={loading ? 'Scan in progress' : undefined}
                            onClick={scanEvents}
                            icon={<IconRefresh className="size-4" />}
                        >
                            {loading ? 'Scanning events...' : 'Scan events'}
                        </Button>
                    </>
                }
            />

            {isDev && !inStorybook() && !inStorybookTestRunner() && (
                <div>
                    <Banner type="info">
                        <strong>DEVELOPMENT WARNING!</strong> When running in development, make sure you've run the
                        Dagster job <Tag>cache_github_sdk_versions_job</Tag>. Team SDK version data is cached
                        by the Temporal <Tag>sdk_outdated</Tag> health check.
                    </Banner>
                </div>
            )}

            {/* Beta feedback banner */}
            <Banner type="info">
                <strong>SDK Health is in Beta!</strong> Help us improve by sharing your feedback?{' '}
                <Link to="#panel=support%3Asupport%3Asdk%3Alow%3Atrue">Send feedback</Link>
            </Banner>

            <div className="p-3">
                {loading ? null : hasErrors ? (
                    <div className="text-center text-muted p-4">
                        Error loading SDK information. Please try again later.
                    </div>
                ) : Object.keys(augmentedData).length === 0 ? (
                    <div className="text-center text-muted p-4">
                        No SDK information found. Are you sure you have our SDK installed? You can scan events to get
                        started.
                    </div>
                ) : needsUpdatingCount === 0 ? (
                    <section className="mb-2">
                        <h3>SDK health is good</h3>
                        <Banner type="success" hideIcon={false}>
                            <p className="font-semibold">All caught up! Your SDKs are up to date.</p>
                            <p className="text-sm mt-1">You've got the latest. Nice work keeping everything current.</p>
                        </Banner>
                    </section>
                ) : (
                    <section className="mb-2">
                        <h3>Time for an update!</h3>
                        <Banner
                            type="warning"
                            hideIcon={false}
                            action={{
                                children: 'Snooze warning for 30 days',
                                disabledReason: snoozedUntil ? 'Already snoozed' : undefined,
                                onClick: snoozeWarning,
                            }}
                        >
                            {Object.entries(augmentedData).flatMap(([sdkType, sdk]) =>
                                sdk.banners.map((banner, index) => (
                                    <p key={`${sdkType}-${index}`} className="text-sm mb-1">
                                        {banner}
                                    </p>
                                ))
                            )}
                            <p className="font-semibold">
                                An outdated SDK means you're missing out on bug fixes and enhancements.
                            </p>
                            <p className="text-sm mt-1">
                                <Link to="https://hanzo.ai/docs/sdk-doctor/keeping-sdks-current" target="_blank">
                                    Learn how
                                </Link>{' '}
                                to keep your SDK versions current.
                            </p>
                            <p className="text-sm mt-1">See the 'Releases' and 'Docs' links below for more info.</p>
                        </Banner>
                    </section>
                )}
            </div>

            {Object.keys(augmentedData).map((sdkType) => (
                <SdkSection key={sdkType} sdkType={sdkType as SdkType} />
            ))}
        </SceneContent>
    )
}
