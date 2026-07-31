import { useActions, useValues } from 'kea'
import { Dispatch, SetStateAction, useState } from 'react'

import { IconTrash } from '@hanzo/icons'
import { Button, Input, Modal } from '@hanzo/elements'

import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { OrganizationMembershipLevel } from 'lib/constants'
import { organizationLogic } from 'scenes/organizationLogic'
import { urls } from 'scenes/urls'

import type { OrganizationBasicType } from '~/types'

export function DeleteOrganizationModal({
    isOpen,
    setIsOpen,
    organization,
    redirectPath,
}: {
    organization: OrganizationBasicType | null
    isOpen: boolean
    setIsOpen: Dispatch<SetStateAction<boolean>>
    redirectPath?: string
}): JSX.Element | null {
    const { organizationBeingDeleted } = useValues(organizationLogic)
    const { deleteOrganization } = useActions(organizationLogic)

    const [isDeletionConfirmed, setIsDeletionConfirmed] = useState(false)
    const isDeletionInProgress = !!organization && organizationBeingDeleted === organization.id

    return (
        <Modal
            title="Delete the entire organization?"
            onClose={!isDeletionInProgress ? () => setIsOpen(false) : undefined}
            footer={
                <>
                    <Button disabled={isDeletionInProgress} type="secondary" onClick={() => setIsOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        type="secondary"
                        status="danger"
                        disabled={!isDeletionConfirmed}
                        loading={isDeletionInProgress}
                        data-attr="delete-organization-ok"
                        onClick={
                            organization
                                ? () => deleteOrganization({ organizationId: organization.id, redirectPath })
                                : undefined
                        }
                    >{`Delete ${organization ? organization.name : 'the current organization'}`}</Button>
                </>
            }
            isOpen={isOpen}
        >
            <p>
                Organization deletion <b>cannot be undone</b>. You will lose all data, <b>including all events</b>,
                related to all projects within this organization.
            </p>
            <p>
                Please type <strong>{organization ? organization.name : "this organization's name"}</strong> to confirm.
            </p>
            <Input
                type="text"
                onChange={(value) => {
                    if (organization) {
                        setIsDeletionConfirmed(value.toLowerCase() === organization.name.toLowerCase())
                    }
                }}
                data-attr="delete-organization-confirmation-input"
            />
        </Modal>
    )
}

export function OrganizationDangerZone(): JSX.Element {
    const { currentOrganization } = useValues(organizationLogic)
    const [isModalVisible, setIsModalVisible] = useState(false)

    const restrictionReason = useRestrictedArea({
        minimumAccessLevel: OrganizationMembershipLevel.Owner,
        scope: RestrictionScope.Organization,
    })

    return (
        <>
            <div className="text-danger">
                {!restrictionReason && (
                    <p className="text-danger">
                        This is <b>irreversible</b>. Please be certain.
                    </p>
                )}
                <Button
                    status="danger"
                    type="secondary"
                    onClick={() => setIsModalVisible(true)}
                    data-attr="delete-organization-button"
                    icon={<IconTrash />}
                    disabledReason={restrictionReason}
                >
                    Delete {currentOrganization?.name || 'the current organization'}
                </Button>
            </div>
            {currentOrganization && (
                <DeleteOrganizationModal
                    isOpen={isModalVisible}
                    setIsOpen={setIsModalVisible}
                    organization={currentOrganization}
                    redirectPath={urls.default()}
                />
            )}
        </>
    )
}
