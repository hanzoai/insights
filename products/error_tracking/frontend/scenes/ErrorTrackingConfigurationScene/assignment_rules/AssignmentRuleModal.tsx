import { useActions, useValues } from 'kea'

import { Button } from '@hanzo/elements'

import { TaxonomicFilterGroupType } from 'lib/components/TaxonomicFilter/types'
import { Label } from 'lib/elements/Label'

import { AssigneeLabelDisplay } from '../../../components/Assignee/AssigneeDisplay'
import { AssigneeSelect } from '../../../components/Assignee/AssigneeSelect'
import { RuleModal } from '../rules/RuleModal'
import { assignmentRuleModalLogic } from './assignmentRuleModalLogic'

export function AssignmentRuleModal(): JSX.Element {
    const { rule, hasFilters, hasAssignee } = useValues(assignmentRuleModalLogic)
    const { updateRule } = useActions(assignmentRuleModalLogic)

    const saveDisabledReason = !hasFilters ? 'Add at least one filter' : !hasAssignee ? 'Choose an assignee' : undefined

    return (
        <RuleModal
            logic={assignmentRuleModalLogic}
            ruleLabel="assignment"
            description="Matching exceptions will be automatically assigned to the chosen user or role."
            pageKey="assignment-rule-modal"
            taxonomicGroupTypes={[TaxonomicFilterGroupType.EventProperties]}
            saveDisabledReason={saveDisabledReason}
            suffix={(issuesLink, dateRangeLabel) => (
                <>
                    across {issuesLink} would have been assigned in the last {dateRangeLabel}
                </>
            )}
            extraFields={
                <div>
                    <Label className="mb-2">Assignee</Label>
                    <AssigneeSelect assignee={rule.assignee} onChange={(assignee) => updateRule({ ...rule, assignee })}>
                        {(displayAssignee) => (
                            <Button fullWidth type="secondary" size="small">
                                <AssigneeLabelDisplay assignee={displayAssignee} placeholder="Choose user or role" />
                            </Button>
                        )}
                    </AssigneeSelect>
                </div>
            }
        />
    )
}
