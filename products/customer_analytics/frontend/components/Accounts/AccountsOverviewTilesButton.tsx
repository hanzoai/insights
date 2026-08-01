import { useActions, useValues } from 'kea'

import { IconGear } from '@hanzo/icons'
import { Button } from '@hanzo/elements'

import { AccountsOverviewTilesEditor } from './AccountsOverviewTilesEditor'
import { accountsOverviewTilesLogic } from './accountsOverviewTilesLogic'

export function AccountsOverviewTilesButton(): JSX.Element {
    const { editorVisible } = useValues(accountsOverviewTilesLogic)
    const { showEditor, hideEditor } = useActions(accountsOverviewTilesLogic)

    return (
        <>
            <Button
                type="secondary"
                size="small"
                icon={<IconGear />}
                onClick={showEditor}
                data-attr="accounts-overview-tiles-edit"
            >
                Edit overview tiles
            </Button>
            <AccountsOverviewTilesEditor isOpen={editorVisible} onClose={hideEditor} />
        </>
    )
}
