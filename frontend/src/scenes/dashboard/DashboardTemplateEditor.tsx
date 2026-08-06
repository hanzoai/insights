import { useActions, useValues } from 'kea'

import { Button, Modal } from '@hanzo/elements'

import { CodeEditor } from 'lib/monaco/CodeEditor'

import type { MonacoMarker } from '~/types'

import { dashboardTemplateEditorLogic } from './dashboardTemplateEditorLogic'

export interface DashboardTemplateEditorProps {
    inline?: boolean
}

export function DashboardTemplateEditor({ inline = false }: DashboardTemplateEditorProps): JSX.Element {
    const {
        closeDashboardTemplateEditor,
        createDashboardTemplate,
        updateDashboardTemplate,
        setEditorValue,
        updateValidationErrors,
    } = useActions(dashboardTemplateEditorLogic)

    const { isOpenNewDashboardTemplateModal, editorValue, validationErrors, templateSchema, id } =
        useValues(dashboardTemplateEditorLogic)

    return (
        <Modal
            title={id ? 'Edit dashboard template' : 'New dashboard template'}
            isOpen={isOpenNewDashboardTemplateModal}
            width={1000}
            onClose={() => {
                closeDashboardTemplateEditor()
            }}
            inline={inline}
            footer={
                id ? (
                    <Button
                        type="primary"
                        data-attr="update-dashboard-template-button"
                        onClick={() => {
                            updateDashboardTemplate({ id })
                        }}
                        disabledReason={
                            validationErrors.length
                                ? `There are ${validationErrors.length} errors to resolve: ${validationErrors.map(
                                      (e) => ' ' + e
                                  )}`
                                : undefined
                        }
                    >
                        Update template
                    </Button>
                ) : (
                    <Button
                        type="primary"
                        data-attr="create-dashboard-template-button"
                        onClick={() => {
                            createDashboardTemplate()
                        }}
                        disabledReason={
                            validationErrors.length
                                ? `There are ${validationErrors.length} errors to resolve:${validationErrors.map(
                                      (e) => ' ' + e
                                  )}`
                                : undefined
                        }
                    >
                        Create new template
                    </Button>
                )
            }
        >
            <CodeEditor
                className="border"
                language="json"
                value={editorValue}
                onChange={(v: string | undefined) => setEditorValue(v ?? '')}
                onValidate={(markers: MonacoMarker[] | undefined) => updateValidationErrors(markers)}
                path={id ? `dashboard-templates/${id}.json` : 'dashboard-templates/new.json'}
                schema={templateSchema}
                height={600}
            />
        </Modal>
    )
}
