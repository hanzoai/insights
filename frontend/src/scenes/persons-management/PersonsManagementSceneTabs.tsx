import { useValues } from 'kea'

import { Tabs } from 'lib/elements/Tabs'

import { personsManagementSceneLogic } from './personsManagementSceneLogic'

export interface PersonsManagementSceneTabsProps {
    tabKey: string
}

export function PersonsManagementSceneTabs({ tabKey }: PersonsManagementSceneTabsProps): JSX.Element {
    const { lemonTabs } = useValues(personsManagementSceneLogic)

    return <Tabs activeKey={tabKey} tabs={lemonTabs} sceneInset className="[&>ul]:mb-2" />
}
