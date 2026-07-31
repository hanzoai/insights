import { useActions, useValues } from 'kea'

import { Banner, Tabs } from '@hanzo/elements'

import type { SceneTabKey } from '../../types'
import { type SceneTabConfig, scenesTabsLogic } from './scenesTabsLogic'

export function ScenesTabs(): JSX.Element {
    const { tabs, activeTab } = useValues(scenesTabsLogic)
    const { setTab } = useActions(scenesTabsLogic)

    return (
        <>
            <Banner
                type="info"
                dismissKey="support-beta-banner"
                className="mb-4"
                action={{ children: 'Send feedback', id: 'support-feedback-button' }}
            >
                <p>
                    Support is in private alpha. Please let us know what you'd like to see here and/or report any issues
                    directly to us!
                </p>
            </Banner>
            <Tabs
                activeKey={activeTab}
                tabs={tabs.map((tab: SceneTabConfig) => ({
                    key: tab.key,
                    label: tab.label,
                }))}
                onChange={(key) => setTab(key as SceneTabKey)}
                sceneInset
            />
        </>
    )
}
