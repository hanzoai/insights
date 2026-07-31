import { useValues } from 'kea'

import { Tabs } from 'lib/elements/Tabs'

import { personsManagementSceneLogic } from './personsManagementSceneLogic'

export interface PersonsManagementSceneTabsProps {
    tabKey: string
}

export function PersonsManagementSceneTabs({ tabKey }: PersonsManagementSceneTabsProps): JSX.Element {
    const { tabs } = useValues(personsManagementSceneLogic)

    return <Tabs activeKey={tabKey} tabs={tabs} sceneInset className="[&>ul]:mb-2" />
}
