import { useActions, useValues } from 'kea'

import { Input } from '@hanzo/elements'

import { Modal } from 'lib/elements/Modal'

import { newWorkflowLogic } from './newWorkflowLogic'
import { WorkflowTemplateChooser } from './templates/WorkflowTemplateChooser'
import { workflowTemplatesLogic } from './templates/workflowTemplatesLogic'

export function NewWorkflowModal(): JSX.Element {
    const { hideNewWorkflowModal } = useActions(newWorkflowLogic)
    const { newWorkflowModalVisible } = useValues(newWorkflowLogic)

    const { templateFilter } = useValues(workflowTemplatesLogic)
    const { setTemplateFilter } = useActions(workflowTemplatesLogic)

    return (
        <Modal
            onClose={hideNewWorkflowModal}
            isOpen={newWorkflowModalVisible}
            title="Create a workflow"
            data-attr="new-workflow-chooser"
            description={
                <div className="flex flex-col gap-2">
                    <div>Choose a template or start with a blank slate</div>
                    <div>
                        <Input
                            type="search"
                            placeholder="Filter templates"
                            onChange={setTemplateFilter}
                            value={templateFilter}
                            fullWidth={true}
                            autoFocus
                        />
                    </div>
                    <div className="text-xs text-muted">
                        We're still expanding our portfolio of templates. Check back soon if you can't find what you're
                        looking for!
                    </div>
                </div>
            }
        >
            <div className="NewWorkflowModal">
                <WorkflowTemplateChooser showEmptyWorkflow />
            </div>
        </Modal>
    )
}
