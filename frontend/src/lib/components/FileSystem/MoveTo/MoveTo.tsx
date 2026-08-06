import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'

import { Snack } from '@hanzo/elements'

import { FolderSelect } from 'lib/components/FileSystem/FolderSelect/FolderSelect'
import { moveToLogic } from 'lib/components/FileSystem/MoveTo/moveToLogic'
import { Button } from 'lib/elements/Button'
import { Field } from 'lib/elements/Field'
import { Modal } from 'lib/elements/Modal'
import { pluralize } from 'lib/utils/strings'

import { splitPath } from '~/layout/panel-layout/ProjectTree/utils'

export function MoveToModal(): JSX.Element {
    const { isOpen, form, movingItems } = useValues(moveToLogic)
    const { closeMoveToModal, submitForm } = useActions(moveToLogic)

    const destinationFolder = form.folder || 'Project root'
    const allFolders = splitPath(destinationFolder)
    const lastFolder = allFolders[allFolders.length - 1]

    return (
        <Modal
            onClose={closeMoveToModal}
            isOpen={isOpen}
            title="Select a folder to move to"
            description={
                <>
                    You are moving {pluralize(movingItems.length, 'item')} to{' '}
                    <Snack>{destinationFolder}</Snack>
                </>
            }
            // This is a bit of a hack. Without it, the flow "insight" -> "add to dashboard button" ->
            // "new dashboard template picker modal" -> "save dashboard to modal" wouldn't work.
            // Since MoveToModal is added to the DOM earlier as part of global modals, it's below it in hierarchy.
            zIndex="1169"
            footer={
                <>
                    <div className="flex-1" />
                    <Button
                        type="primary"
                        onClick={submitForm}
                        data-attr="move-to-modal-move-button"
                        disabledReason={typeof lastFolder !== 'string' ? 'Please select a folder' : undefined}
                    >
                        Move to {lastFolder}
                    </Button>
                </>
            }
        >
            <div className="w-192 max-w-full">
                <Form logic={moveToLogic} formKey="form">
                    <Field name="folder">
                        <FolderSelect root="project://" includeRoot className="h-[60vh] min-h-[200px]" />
                    </Field>
                </Form>
            </div>
        </Modal>
    )
}
