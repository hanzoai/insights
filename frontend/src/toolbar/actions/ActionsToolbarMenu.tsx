import { useActions, useValues } from 'kea'

import { IconPlus } from '@hanzo/icons'

import { useOnMountEffect } from 'lib/hooks/useOnMountEffect'
import { IconOpenInNew } from 'lib/elements/icons'
import { Button } from 'lib/elements/Button'
import { Input } from 'lib/elements/Input'
import { Link } from 'lib/elements/Link'
import { Spinner } from 'lib/elements/Spinner'

import { ActionsEditingToolbarMenu } from '~/toolbar/actions/ActionsEditingToolbarMenu'
import { ActionsListView } from '~/toolbar/actions/ActionsListView'
import { actionsLogic } from '~/toolbar/actions/actionsLogic'
import { actionsTabLogic } from '~/toolbar/actions/actionsTabLogic'
import { ToolbarMenu } from '~/toolbar/bar/ToolbarMenu'
import { toolbarConfigLogic } from '~/toolbar/toolbarConfigLogic'
import { urls } from '~/toolbar/urls'
import { joinWithUiHost } from '~/toolbar/utils'

const ActionsListToolbarMenu = (): JSX.Element => {
    const { searchTerm } = useValues(actionsLogic)
    const { setSearchTerm, getActions } = useActions(actionsLogic)

    const { newAction } = useActions(actionsTabLogic)
    const { allActions, sortedActions, allActionsLoading } = useValues(actionsLogic)

    const { uiHost } = useValues(toolbarConfigLogic)

    useOnMountEffect(getActions)

    return (
        <ToolbarMenu>
            <ToolbarMenu.Header>
                <Input
                    autoFocus={true}
                    fullWidth={true}
                    placeholder="Search"
                    type="search"
                    value={searchTerm}
                    onChange={(s) => setSearchTerm(s)}
                />
            </ToolbarMenu.Header>
            <ToolbarMenu.Body>
                <div className="px-1 deprecated-space-y-px py-2">
                    {allActions.length === 0 && allActionsLoading ? (
                        <div className="text-center my-4">
                            <Spinner />
                        </div>
                    ) : (
                        <ActionsListView actions={sortedActions} />
                    )}
                </div>
            </ToolbarMenu.Body>
            <ToolbarMenu.Footer>
                <div className="flex items-center justify-between flex-1">
                    <Link to={joinWithUiHost(uiHost, urls.actions())} target="_blank" className="text-primary">
                        View &amp; edit all actions <IconOpenInNew />
                    </Link>
                    <Button type="primary" size="small" onClick={() => newAction()} icon={<IconPlus />}>
                        New action
                    </Button>
                </div>
            </ToolbarMenu.Footer>
        </ToolbarMenu>
    )
}

export const ActionsToolbarMenu = (): JSX.Element => {
    const { selectedAction } = useValues(actionsTabLogic)
    return selectedAction ? <ActionsEditingToolbarMenu /> : <ActionsListToolbarMenu />
}
