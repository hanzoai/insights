import { Meta, StoryObj } from '@storybook/react'
import { useActions } from 'kea'

import { FEATURE_FLAGS } from 'lib/constants'
import { useOnMountEffect } from 'lib/hooks/useOnMountEffect'
import { App } from 'scenes/App'
import featureFlagsFixture from 'scenes/feature-flags/__mocks__/feature_flags.json'
import { urls } from 'scenes/urls'

import { mswDecorator } from '~/mocks/browser'
import { useAvailableFeatures } from '~/mocks/features'
import { AccessControlLevel, AvailableFeature, SidePanelTab } from '~/types'

import { sidePanelStateLogic } from './sidePanelStateLogic'

type StoryArgs = { panel: SidePanelTab; availableFeatures?: AvailableFeature[] }

/**
 * Activity, Access and Info only appear once a scene exposes an object behind them, so those stories
 * open a feature flag rather than the dashboard list. Without it they render whatever tab the panel
 * falls back to instead of the one they are named after.
 */
const OBJECT_SCENE_FLAG_ID = 1779
const objectScenePageUrl = urls.featureFlag(OBJECT_SCENE_FLAG_ID)

const meta: Meta<StoryArgs> = {
    component: App,
    title: 'Scenes-App/SidePanels',
    parameters: {
        layout: 'fullscreen',
        viewMode: 'story',
        mockDate: '2025-10-10', // To stabilize relative dates
        pageUrl: urls.dashboards(),
        testOptions: {
            includeNavigationInSnapshot: true,
        },
    },
    render: ({ panel, availableFeatures }) => {
        // Entitlements are module-level state shared between stories, so every story sets them
        useAvailableFeatures(availableFeatures ?? [])
        const { openSidePanel } = useActions(sidePanelStateLogic)
        useOnMountEffect(() => openSidePanel(panel))
        return <App />
    },
    decorators: [
        mswDecorator({
            get: {
                '/v1/projects/:team_id/dashboard_templates/': {},
                '/v1/projects/:id/integrations': { results: [] },
                '/v1/organizations/:organization_id/pipeline_destinations/': { results: [] },
                '/v1/projects/:id/pipeline_destination_configs/': { results: [] },
                '/v1/projects/:id/batch_exports/': { results: [] },
                '/v1/projects/:id/surveys/': { results: [] },
                '/v1/projects/:id/surveys/responses_count/': { results: [] },
                '/v1/environments/:team_id/exports/': { results: [] },
                '/v1/environments/:team_id/events': { results: [] },
                '/v1/projects/:team_id/feature_flags/:flagId/': ({ params }) => [
                    200,
                    featureFlagsFixture.results.find((flag) => flag.id === Number(params['flagId'])),
                ],
                '/v1/projects/:team_id/feature_flags/:flagId/status': {
                    status: 'active',
                    reason: 'Feature flag is active',
                },
                '/v1/projects/:team_id/feature_flags/:flagId/activity': { results: [], count: 0 },
                '/v1/projects/:team_id/feature_flags/:flagId/access_controls': {
                    access_controls: [],
                    available_access_levels: [
                        AccessControlLevel.None,
                        AccessControlLevel.Viewer,
                        AccessControlLevel.Editor,
                    ],
                    user_access_level: AccessControlLevel.Editor,
                    default_access_level: AccessControlLevel.Viewer,
                    user_can_edit_access_levels: true,
                },
                '/v1/environments/:team_id/default_evaluation_contexts/': {
                    default_evaluation_contexts: [],
                    available_contexts: [],
                    hidden_contexts: [],
                    enabled: false,
                },
            },
            post: {
                '/v1/environments/:team_id/query/:kind': {},
                '/v1/projects/:team_id/feature_flags/user_blast_radius/': { affected: 120, total: 2000 },
            },
        }),
    ],
}
export default meta

type Story = StoryObj<StoryArgs>

export const SidePanelNotebooks: Story = {
    args: { panel: SidePanelTab.Notebooks },
}

export const SidePanelMax: Story = {
    args: { panel: SidePanelTab.Max },
}

export const SidePanelActivity: Story = {
    // The tab needs the audit logs entitlement, which the feature flags below don't grant
    args: { panel: SidePanelTab.Activity, availableFeatures: [AvailableFeature.AUDIT_LOGS] },
    parameters: {
        pageUrl: objectScenePageUrl,
        featureFlags: [FEATURE_FLAGS.CDP_ACTIVITY_LOG_NOTIFICATIONS, FEATURE_FLAGS.AUDIT_LOGS_ACCESS],
    },
}

export const SidePanelDiscussion: Story = {
    args: { panel: SidePanelTab.Discussion },
}

export const SidePanelAccessControl: Story = {
    // Without the entitlements the panel renders the PayGateMini upsell instead of the permissions UI
    args: {
        panel: SidePanelTab.AccessControl,
        availableFeatures: [AvailableFeature.ACCESS_CONTROL, AvailableFeature.ROLE_BASED_ACCESS],
    },
    parameters: { pageUrl: objectScenePageUrl },
}

export const SidePanelInfo: Story = {
    args: { panel: SidePanelTab.Info },
    parameters: { pageUrl: objectScenePageUrl },
}

export const SidePanelExports: Story = {
    args: { panel: SidePanelTab.Exports },
}

export const SidePanelSupport: Story = {
    args: { panel: SidePanelTab.Support },
}
