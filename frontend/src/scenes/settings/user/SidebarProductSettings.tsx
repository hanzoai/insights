import { useActions, useValues } from 'kea'

import { Switch } from '@hanzo/elements'

import { userLogic } from 'scenes/userLogic'

export function SidebarAutoSuggestSetting(): JSX.Element {
    const { user, userLoading } = useValues(userLogic)
    const { updateUser } = useActions(userLogic)

    return (
        <Switch
            onChange={(checked) => {
                updateUser({ allow_sidebar_suggestions: checked })
            }}
            checked={user?.allow_sidebar_suggestions ?? false}
            loading={userLoading}
            label="Automatically suggest new tools"
            bordered
        />
    )
}
