import { useActions, useValues } from 'kea'

import { IconCopy } from '@hanzo/icons'
import { Button, Modal } from '@hanzo/elements'

import { CodeEditorResizeable } from 'lib/monaco/CodeEditorResizable'
import { copyToClipboard } from 'lib/utils/copyToClipboard'

import { WorkflowTemplateLogicProps, workflowTemplateLogic } from './workflowTemplateLogic'

export function TemplateJsonModal(props: WorkflowTemplateLogicProps = {}): JSX.Element {
    const logic = workflowTemplateLogic(props)
    const { templateJsonModalVisible, templateJson } = useValues(logic)
    const { hideTemplateJsonModal } = useActions(logic)

    return (
        <Modal
            onClose={hideTemplateJsonModal}
            isOpen={templateJsonModalVisible}
            title="Template JSON"
            width="60vw"
            footer={
                <Button type="secondary" onClick={hideTemplateJsonModal}>
                    Close
                </Button>
            }
        >
            <div className="space-y-4">
                <div className="p-3 bg-primary-highlight rounded border">
                    Copy your template and create or edit the template file in the insights repository under{' '}
                    <code className="text-xs">products/workflows/backend/templates</code>
                </div>
                <div className="relative">
                    <div className="absolute top-2 right-2 z-10">
                        <Button
                            icon={<IconCopy />}
                            size="small"
                            onClick={() => copyToClipboard(templateJson, 'template JSON')}
                        >
                            Copy
                        </Button>
                    </div>
                    <CodeEditorResizeable
                        language="json"
                        value={templateJson}
                        height={500}
                        options={{
                            readOnly: true,
                            minimap: { enabled: false },
                        }}
                    />
                </div>
            </div>
        </Modal>
    )
}
