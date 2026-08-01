import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'

import { Snack } from '@hanzo/elements'

import { FolderSelect } from 'lib/components/FileSystem/FolderSelect/FolderSelect'
import { linkToLogic } from 'lib/components/FileSystem/LinkTo/linkToLogic'
import { Button } from 'lib/elements/Button'
import { Field } from 'lib/elements/Field'
import { Modal } from 'lib/elements/Modal'
import { pluralize } from 'lib/utils/strings'

import { splitPath } from '~/layout/panel-layout/ProjectTree/utils'

export function LinkToModal(): JSX.Element {
    const { isOpen, form, linkingItems } = useValues(linkToLogic)
    const { closeLinkToModal, submitForm } = useActions(linkToLogic)

    const destinationFolder = form.folder || 'Project root'
    const allFolders = splitPath(destinationFolder)
    const lastFolder = allFolders[allFolders.length - 1]

    const s = pluralize(linkingItems.length, 'shortcut', 'shortcuts', false)

    return (
        <Modal
            onClose={closeLinkToModal}
            isOpen={isOpen}
            title={`Select a folder to create ${s} in`}
            description={
                <>
                    You are creating {pluralize(linkingItems.length, 'shortcut')} in{' '}
                    <Snack>{destinationFolder}</Snack>
                </>
            }
            // This is a bit of a hack. Without it, the flow "insight" -> "add to dashboard button" ->
            // "new dashboard template picker modal" -> "save dashboard to modal" wouldn't work.
            // Since LinkToModal is added to the DOM earlier as part of global modals, it's below it in hierarchy.
            zIndex="1169"
            footer={
                <>
                    <div className="flex-1" />
                    <Button
                        type="primary"
                        onClick={submitForm}
                        data-attr="link-to-modal-move-button"
                        disabledReason={typeof lastFolder !== 'string' ? 'Please select a folder' : undefined}
                    >
                        Create {s} in {lastFolder}
                    </Button>
                </>
            }
        >
            <div className="w-192 max-w-full">
                <Form logic={linkToLogic} formKey="form">
                    <Field name="folder">
                        <FolderSelect root="project://" includeRoot className="h-[60vh] min-h-[200px]" />
                    </Field>
                </Form>
            </div>
        </Modal>
    )
}
