import { useValues } from 'kea'

import { Tabs } from 'lib/elements/Tabs'

import { personsManagementSceneLogic } from './personsManagementSceneLogic'

export interface PersonsManagementSceneTabsProps {
    tabKey: string
}

export function PersonsManagementSceneTabs({ tabKey }: PersonsManagementSceneTabsProps): JSX.Element {
    const { tabs } = useValues(personsManagementSceneLogic)

    // Rendered here rather than in the logic. This mapping used to be a SECOND
    // selector also called `tabs`, reading `(s) => [s.tabs]` -- so once the object
    // literal's later key won, the surviving selector depended on itself and every
    // scene in this section died with "Maximum call stack size exceeded". Labels
    // are presentation; keeping them in the component leaves one `tabs` value and
    // no way to reintroduce the cycle.
    return (
        <Tabs
            activeKey={tabKey}
            tabs={tabs.map((tab) => ({
                key: tab.key,
                label: <span data-attr={`persons-management-${tab.key}-tab`}>{tab.label}</span>,
                tooltipDocLink: tab.tooltipDocLink,
                link: tab.url,
            }))}
            sceneInset
            className="[&>ul]:mb-2"
        />
    )
}
