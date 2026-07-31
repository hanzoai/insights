import { useActions, useValues } from 'kea'

import { Button } from '@hanzo/elements'

import { taskTrackerSceneLogic } from '../../logics/taskTrackerSceneLogic'
import { UserDisplay, UserSelect } from './UserSelect'

export const UserFilter = (): JSX.Element => {
    const { createdBy } = useValues(taskTrackerSceneLogic)
    const { setCreatedBy } = useActions(taskTrackerSceneLogic)

    return (
        <UserSelect userId={createdBy} onChange={setCreatedBy}>
            {(user) => (
                <Button type="secondary" size="small">
                    <UserDisplay user={user} />
                </Button>
            )}
        </UserSelect>
    )
}
