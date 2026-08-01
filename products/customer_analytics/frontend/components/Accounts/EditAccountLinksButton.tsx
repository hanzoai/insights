import { useActions, useValues } from 'kea'

import { IconPencil } from '@hanzo/icons'
import { Button, Divider, Dropdown, Input } from '@hanzo/elements'

import { ACCOUNT_LINK_FIELDS, accountLinksLogic } from './accountLinksLogic'

export function EditAccountLinksButton({ accountId }: { accountId: string }): JSX.Element {
    const logic = accountLinksLogic({ accountId })
    const { editorOpen, formValues, savingLinks } = useValues(logic)
    const { openEditor, closeEditor, setFieldValue, saveLinks } = useActions(logic)

    return (
        <Dropdown
            closeOnClickInside={false}
            visible={editorOpen}
            onVisibilityChange={(visible) => {
                if (!visible) {
                    closeEditor()
                }
            }}
            showArrow
            overlay={
                <div className="flex flex-col gap-2 w-72">
                    {ACCOUNT_LINK_FIELDS.map((field) => (
                        <div key={field.key} className="flex flex-col gap-1">
                            <span className="text-xs font-semibold text-secondary">{field.label}</span>
                            <Input
                                type="text"
                                size="small"
                                value={formValues[field.key]}
                                onChange={(value) => setFieldValue(field.key, value)}
                                placeholder={field.placeholder}
                                onPressEnter={saveLinks}
                            />
                        </div>
                    ))}
                    <Divider className="my-1" />
                    <div className="flex flex-row gap-2 justify-end">
                        <Button size="xsmall" type="secondary" onClick={closeEditor}>
                            Cancel
                        </Button>
                        <Button size="xsmall" type="primary" onClick={saveLinks} loading={savingLinks}>
                            Save
                        </Button>
                    </div>
                </div>
            }
        >
            <Button
                size="xsmall"
                type="tertiary"
                icon={<IconPencil />}
                tooltip="Edit links"
                data-attr="edit-account-links"
                onClick={openEditor}
            />
        </Dropdown>
    )
}
