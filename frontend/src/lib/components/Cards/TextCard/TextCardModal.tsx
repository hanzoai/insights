import { useActions, useValues } from 'kea'
import { Field, Form } from 'kea-forms'

import { textCardModalLogic } from 'lib/components/Cards/TextCard/textCardModalLogic'
import { Button } from 'lib/elements/Button'
import { Modal } from 'lib/elements/Modal'
import { TextAreaMarkdown } from 'lib/elements/TextArea'

import { DashboardType, QueryBasedInsightModel } from '~/types'

export function TextCardModal({
    isOpen,
    onClose,
    dashboard,
    textTileId,
}: {
    isOpen: boolean
    onClose: () => void
    dashboard: DashboardType<QueryBasedInsightModel>
    textTileId: number | 'new' | null
}): JSX.Element {
    const modalLogic = textCardModalLogic({ dashboard, textTileId: textTileId ?? 'new', onClose })
    const { isTextTileSubmitting, textTileValidationErrors } = useValues(modalLogic)
    const { submitTextTile, resetTextTile } = useActions(modalLogic)

    const handleClose = (): void => {
        resetTextTile()
        onClose()
    }

    return (
        <Modal
            closable={true}
            isOpen={isOpen}
            title=""
            onClose={handleClose}
            footer={
                <>
                    <Button
                        disabledReason={isTextTileSubmitting ? 'Cannot cancel card creation in progress' : null}
                        type="secondary"
                        onClick={handleClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        disabledReason={textTileValidationErrors.body as string | null}
                        loading={isTextTileSubmitting}
                        form="text-tile-form"
                        htmlType="submit"
                        type="primary"
                        onClick={submitTextTile}
                        data-attr={textTileId === 'new' ? 'save-new-text-tile' : 'edit-text-tile-text'}
                    >
                        Save
                    </Button>
                </>
            }
        >
            <Form
                logic={textCardModalLogic}
                props={{ dashboard, textTileId }}
                formKey="textTile"
                id="text-tile-form"
                className=""
                enableFormOnSubmit
            >
                <Field name="body" label="">
                    <TextAreaMarkdown maxLength={4000} data-attr="text-card-edit-area" />
                </Field>
            </Form>
        </Modal>
    )
}
