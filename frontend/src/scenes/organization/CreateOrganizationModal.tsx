import { useActions } from 'kea'
import { useState } from 'react'

import { Button, Input, Modal, Link } from '@hanzo/elements'

import { Field } from 'lib/elements/Field'
import { organizationLogic } from 'scenes/organizationLogic'

export function CreateOrganizationModal({
    isVisible,
    onClose,
    inline = false,
}: {
    isVisible: boolean
    onClose?: () => void
    inline?: boolean
}): JSX.Element {
    const { createOrganization } = useActions(organizationLogic)
    const [name, setName] = useState<string>('')

    const closeModal: () => void = () => {
        if (onClose) {
            onClose()
            if (name) {
                setName('')
            }
        }
    }
    const handleSubmit = (): void => {
        createOrganization(name)
        closeModal()
    }

    return (
        <Modal
            width={440}
            title="Create an organization"
            description={
                <p>
                    Organizations gather people building together.
                    <br />
                    <Link to="https://hanzo.ai/docs/user-guides/organizations-and-projects" target="_blank">
                        Learn more in Insights docs.
                    </Link>
                </p>
            }
            footer={
                <>
                    {onClose && (
                        <Button type="secondary" onClick={() => onClose()}>
                            Cancel
                        </Button>
                    )}
                    <Button
                        type="primary"
                        onClick={() => handleSubmit()}
                        disabledReason={!name ? 'Think of a name!' : null}
                        data-attr="create-organization-ok"
                    >
                        Create organization
                    </Button>
                </>
            }
            onClose={closeModal}
            isOpen={isVisible}
            inline={inline}
        >
            <Field.Pure label="Organization name">
                <Input
                    placeholder="Acme Inc."
                    maxLength={64}
                    autoFocus
                    value={name}
                    onChange={(value) => setName(value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleSubmit()
                        }
                    }}
                    data-attr="organization-name-input"
                />
            </Field.Pure>
        </Modal>
    )
}
