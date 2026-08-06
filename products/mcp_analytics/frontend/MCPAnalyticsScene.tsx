import { useValues } from 'kea'
import { router, combineUrl } from 'kea-router'

import { IconSparkles } from '@hanzo/icons'
import { Button, Tab, Tabs, Tag } from '@hanzo/elements'

import { urls } from 'scenes/urls'

import { FeaturePreviewSceneGate } from '~/layout/scenes/components/FeaturePreviewSceneGate'
import { SceneContent } from '~/layout/scenes/components/SceneContent'
import { SceneTitleSection } from '~/layout/scenes/components/SceneTitleSection'
import { ProductKey } from '~/queries/schema/schema-general'
import { SceneExport } from '~/scenes/sceneTypes'

import { askInsightsAI } from './askInsightsAI'
import { MCPAnalyticsClustering } from './clustering/MCPAnalyticsClustering'
import { MCPAnalyticsActivityDashboard } from './earlyData/MCPAnalyticsEarlyData'
import { mcpAnalyticsEmptyState } from './emptyState/mcpAnalyticsEmptyState'
import { mcpAnalyticsFeaturePreviewGate } from './featurePreviewGate'
import { MCPAnalyticsDashboard } from './MCPAnalyticsDashboard'
import { mcpAnalyticsOnboardingLogic } from './mcpAnalyticsOnboardingLogic'
import { MCPAnalyticsTab, TAB_AI_PROMPTS, TAB_DESCRIPTIONS, mcpAnalyticsSceneLogic } from './mcpAnalyticsSceneLogic'
import { MCPAnalyticsSceneMenuBar } from './MCPAnalyticsSceneMenuBar'
import { MCPAnalyticsToolQuality } from './MCPAnalyticsToolQuality'
import { MCPAnalyticsNotifications } from './notifications/MCPAnalyticsNotifications'
import { mcpAnalyticsNotificationsLogic } from './notifications/mcpAnalyticsNotificationsLogic'
import { MCPSessionsPlaylist } from './sessions/MCPSessionsPlaylist'

export const scene: SceneExport = {
    component: MCPAnalyticsScene,
    logic: mcpAnalyticsSceneLogic,
    productKey: ProductKey.MCP_ANALYTICS,
    emptyState: mcpAnalyticsEmptyState,
}

const MCP_DOCS_URL = 'https://hanzo.ai/docs/mcp-analytics/installation'

export function MCPAnalyticsScene(): JSX.Element {
    return (
        <FeaturePreviewSceneGate config={mcpAnalyticsFeaturePreviewGate}>
            <MCPAnalyticsSceneContent />
        </FeaturePreviewSceneGate>
    )
}

function MCPAnalyticsSceneContent(): JSX.Element {
    const { searchParams } = useValues(router)
    const { activeTab } = useValues(mcpAnalyticsSceneLogic)
    const { onboardingState, dashboardStage } = useValues(mcpAnalyticsOnboardingLogic)
    const { notificationCount } = useValues(mcpAnalyticsNotificationsLogic)

    // search is Sessions-only — drop it when leaving the tab; the date range stays shared.
    const { search: _search, ...sharedParams } = searchParams

    const activityTab: Tab<MCPAnalyticsTab> = {
        key: 'activity',
        label: 'Activity',
        content: <MCPAnalyticsActivityDashboard />,
        link: combineUrl(urls.mcpAnalyticsActivity(), sharedParams).url,
        'data-attr': 'mcp-analytics-activity-tab',
    }
    const dashboardTab: Tab<MCPAnalyticsTab> = {
        key: 'dashboard',
        label: 'Dashboard',
        content: <MCPAnalyticsDashboard />,
        link: combineUrl(urls.mcpAnalyticsDashboard(), sharedParams).url,
        'data-attr': 'mcp-analytics-dashboard-tab',
    }

    const tabs: Tab<MCPAnalyticsTab>[] = [
        // The default landing tab leads: Activity while the project is low-volume,
        // Dashboard once it graduates — matching the landing redirect so the first
        // tab is always the one you arrive on.
        ...(dashboardStage === 'activity' ? [activityTab, dashboardTab] : [dashboardTab, activityTab]),
        {
            key: 'sessions',
            label: 'Sessions',
            content: <MCPSessionsPlaylist />,
            link: combineUrl(urls.mcpAnalyticsSessions(), searchParams).url,
            'data-attr': 'mcp-analytics-sessions-tab',
        },
        {
            key: 'tool-quality',
            label: 'Tool quality',
            content: <MCPAnalyticsToolQuality />,
            link: combineUrl(urls.mcpAnalyticsToolQuality(), sharedParams).url,
            'data-attr': 'mcp-analytics-tool-quality-tab',
        },
        {
            key: 'intent-clustering',
            label: 'Intent clustering',
            content: <MCPAnalyticsClustering />,
            link: combineUrl(urls.mcpAnalyticsIntentClustering(), sharedParams).url,
            'data-attr': 'mcp-analytics-intent-clustering-tab',
        },
        {
            key: 'notifications',
            label: (
                <span className="flex items-center gap-1.5">
                    Notifications
                    {notificationCount > 0 && (
                        <Tag type="completion" size="small">
                            {notificationCount}
                        </Tag>
                    )}
                </span>
            ),
            content: <MCPAnalyticsNotifications />,
            link: combineUrl(urls.mcpAnalyticsNotifications(), sharedParams).url,
            'data-attr': 'mcp-analytics-notifications-tab',
        },
    ]

    return (
        <SceneContent>
            <MCPAnalyticsSceneMenuBar />
            <SceneTitleSection
                name="MCP analytics"
                description={onboardingState === 'onboarded' ? TAB_DESCRIPTIONS[activeTab] : null}
                resourceType={{ type: 'mcp_analytics' }}
                actions={
                    <>
                        {onboardingState === 'onboarded' && (
                            <Button
                                type="secondary"
                                size="small"
                                icon={<IconSparkles />}
                                onClick={() => askInsightsAI(TAB_AI_PROMPTS[activeTab])}
                                data-attr="mcp-analytics-ask-ai"
                            >
                                Ask Insights AI
                            </Button>
                        )}
                        <Button to={MCP_DOCS_URL} type="secondary" targetBlank size="small">
                            Documentation
                        </Button>
                    </>
                }
            />

            {/* Loading and pre-data states are handled by the app-shell empty-state gate
                (see `emptyState` on the SceneExport) — by the time this renders, either
                tool calls exist or the user explicitly skipped setup. */}
            <Tabs activeKey={activeTab} data-attr="mcp-analytics-tabs" tabs={tabs} sceneInset />
        </SceneContent>
    )
}
