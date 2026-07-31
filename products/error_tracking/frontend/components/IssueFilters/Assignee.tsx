import { useActions, useValues } from 'kea'

import { Button } from '@hanzo/elements'

import { AssigneeLabelDisplay } from '../Assignee/AssigneeDisplay'
import { AssigneeSelect } from '../Assignee/AssigneeSelect'
import { issueQueryOptionsLogic } from '../IssueQueryOptions/issueQueryOptionsLogic'

export const AssigneeFilter = (): JSX.Element => {
    const { assignee } = useValues(issueQueryOptionsLogic)
    const { setAssignee } = useActions(issueQueryOptionsLogic)

    return (
        <AssigneeSelect assignee={assignee ?? null} onChange={(assignee) => setAssignee(assignee)}>
            {(displayAssignee) => (
                <Button type="secondary" size="small">
                    <AssigneeLabelDisplay assignee={displayAssignee} placeholder="Any assignee" />
                </Button>
            )}
        </AssigneeSelect>
    )
}
