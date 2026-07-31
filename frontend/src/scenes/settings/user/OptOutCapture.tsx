import { useActions, useValues } from 'kea'

import { Switch } from '@hanzo/elements'

import { userLogic } from 'scenes/userLogic'

export function OptOutCapture(): JSX.Element {
    const { user, userLoading } = useValues(userLogic)
    const { updateUser } = useActions(userLogic)

    return (
        <div>
            <Switch
                label="Anonymize my data"
                data-attr="anonymize-data-collection"
                onChange={(checked) => updateUser({ anonymize_data: checked })}
                checked={user?.anonymize_data ?? false}
                disabled={userLoading}
                bordered
            />
        </div>
    )
}
