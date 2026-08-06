import { useActions, useValues } from 'kea'

import { Input, Select } from '@hanzo/elements'

import { Modal } from 'lib/elements/Modal'

import { newWorkflowLogic } from './newWorkflowLogic'
import { WorkflowTemplateChooser } from './templates/WorkflowTemplateChooser'
import { workflowTemplatesLogic } from './templates/workflowTemplatesLogic'

export function NewWorkflowModal(): JSX.Element {
    const { hideNewWorkflowModal } = useActions(newWorkflowLogic)
    const { newWorkflowModalVisible } = useValues(newWorkflowLogic)

    const { templateFilter, tagFilter, availableTags } = useValues(workflowTemplatesLogic)
    const { setTemplateFilter, setTagFilter } = useActions(workflowTemplatesLogic)

    const tagOptions = [
        { value: null as string | null, label: 'All categories' },
        ...availableTags.map((tag) => ({ value: tag as string | null, label: tag })),
    ]

    return (
        <Modal
            onClose={hideNewWorkflowModal}
            isOpen={newWorkflowModalVisible}
            width={1200}
            title="Create a workflow"
            data-attr="new-workflow-chooser"
            description={
                <div className="flex flex-col gap-2">
                    <div>Choose a template or start with a blank slate</div>
                    <div className="flex gap-2 items-center">
                        <Input
                            type="search"
                            placeholder="Filter templates"
                            onChange={setTemplateFilter}
                            value={templateFilter}
                            fullWidth={true}
                            autoFocus
                        />
                        {availableTags.length > 0 && (
                            <Select
                                className="shrink-0 min-w-56 whitespace-nowrap"
                                options={tagOptions}
                                value={tagFilter}
                                onChange={(value) => setTagFilter(value)}
                                dropdownMatchSelectWidth={false}
                            />
                        )}
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
