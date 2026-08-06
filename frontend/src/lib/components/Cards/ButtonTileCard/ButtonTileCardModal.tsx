import { useActions, useValues } from 'kea'
import { Field, Form } from 'kea-forms'

import { buttonTileCardModalLogic } from 'lib/components/Cards/ButtonTileCard/buttonTileCardModalLogic'
import { Button } from 'lib/elements/Button'
import { Input } from 'lib/elements/Input'
import { Modal } from 'lib/elements/Modal'
import { SegmentedButton } from 'lib/elements/SegmentedButton'
import { Switch } from 'lib/elements/Switch'

import { DashboardType, QueryBasedInsightModel } from '~/types'

export function ButtonTileCardModal({
    isOpen,
    onClose,
    dashboard,
    buttonTileId,
}: {
    isOpen: boolean
    onClose: () => void
    dashboard: DashboardType<QueryBasedInsightModel>
    buttonTileId: number | 'new' | null
}): JSX.Element {
    const modalLogic = buttonTileCardModalLogic({ dashboard, buttonTileId: buttonTileId ?? 'new', onClose })
    const { isButtonTileSubmitting, buttonTileValidationErrors } = useValues(modalLogic)
    const { submitButtonTile, resetButtonTile } = useActions(modalLogic)

    const handleClose = (): void => {
        resetButtonTile()
        onClose()
    }

    const firstError = buttonTileValidationErrors.url || buttonTileValidationErrors.text

    return (
        <Modal
            closable={true}
            isOpen={isOpen}
            title={buttonTileId === 'new' ? 'Add button' : 'Edit button'}
            onClose={handleClose}
            footer={
                <>
                    <Button
                        disabledReason={isButtonTileSubmitting ? 'Cannot cancel in progress' : null}
                        type="secondary"
                        onClick={handleClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        disabledReason={firstError as string | null}
                        loading={isButtonTileSubmitting}
                        form="button-tile-form"
                        htmlType="submit"
                        type="primary"
                        onClick={submitButtonTile}
                        data-attr={buttonTileId === 'new' ? 'save-new-button-tile' : 'edit-button-tile'}
                    >
                        Save
                    </Button>
                </>
            }
        >
            <Form
                logic={buttonTileCardModalLogic}
                props={{ dashboard, buttonTileId }}
                formKey="buttonTile"
                id="button-tile-form"
                enableFormOnSubmit
            >
                <div className="flex flex-col gap-4">
                    <Field name="url" label="URL">
                        <Input
                            placeholder="https://example.com or /dashboards"
                            data-attr="button-tile-url"
                            autoFocus
                        />
                    </Field>
                    <Field name="text" label="Button text">
                        <Input placeholder="Click me" data-attr="button-tile-text" />
                    </Field>
                    <Field name="placement" label="Placement">
                        <SegmentedButton
                            options={[
                                { value: 'left', label: 'Left' },
                                { value: 'right', label: 'Right' },
                            ]}
                            data-attr="button-tile-placement"
                        />
                    </Field>
                    <Field name="style" label="Style">
                        <SegmentedButton
                            options={[
                                { value: 'primary', label: 'Primary' },
                                { value: 'secondary', label: 'Secondary' },
                            ]}
                            data-attr="button-tile-style"
                        />
                    </Field>
                    <Field name="transparent_background" label="">
                        {({ value, onChange }) => (
                            <Switch
                                checked={value}
                                onChange={onChange}
                                label="Transparent background"
                                data-attr="button-tile-transparent-background"
                            />
                        )}
                    </Field>
                </div>
            </Form>
        </Modal>
    )
}
