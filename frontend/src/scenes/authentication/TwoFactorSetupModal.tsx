import { useActions, useValues } from 'kea'
import { useState } from 'react'

import { Banner, Divider } from '@hanzo/elements'

import { OrganizationMenu } from 'lib/components/Account/OrganizationMenu'
import { Modal } from 'lib/elements/Modal'
import { membersLogic } from 'scenes/organization/membersLogic'
import { userLogic } from 'scenes/userLogic'

import { TwoFactorSetup } from './TwoFactorSetup'
import { twoFactorLogic } from './twoFactorLogic'

export function TwoFactorSetupModal(): JSX.Element {
    const { isTwoFactorSetupModalOpen, forceOpenTwoFactorSetupModal, startSetup, canSwitchOrg } =
        useValues(twoFactorLogic)
    const { closeTwoFactorSetupModal } = useActions(twoFactorLogic)
    const [showOrgDropdown, setShowOrgDropdown] = useState(false)

    // Determine if this is setup mode (has secret) or verification mode (no secret)
    const isSetupMode = !!startSetup?.secret
    const title = isSetupMode ? 'Set up two-factor authentication' : 'Two-factor authentication required'

    return (
        <Modal
            title={title}
            isOpen={isTwoFactorSetupModalOpen || forceOpenTwoFactorSetupModal}
            onClose={!forceOpenTwoFactorSetupModal ? () => closeTwoFactorSetupModal() : undefined}
            closable={!forceOpenTwoFactorSetupModal}
        >
            <div className="max-w-md">
                {forceOpenTwoFactorSetupModal && (
                    <Banner className="mb-4" type="warning">
                        {isSetupMode
                            ? 'Your organization requires you to set up 2FA.'
                            : 'Your organization requires two-factor authentication. Please verify using your authenticator app.'}
                    </Banner>
                )}
                <p>
                    {isSetupMode
                        ? 'Use an authenticator app like Google Authenticator or 1Password to scan the QR code below.'
                        : 'Enter the 6-digit code from your authenticator app to verify your identity.'}
                </p>
                <TwoFactorSetup
                    onSuccess={() => {
                        closeTwoFactorSetupModal()
                        userLogic.actions.loadUser()
                        membersLogic.actions.loadAllMembers()
                    }}
                />

                <Divider />

                {canSwitchOrg && (
                    <div className="flex flex-col items-center gap-1 mt-4">
                        <div className="text-muted-alt text-xs">
                            or{' '}
                            <button
                                type="button"
                                className="text-muted-alt cursor-pointer underline hover:text-muted"
                                onClick={() => setShowOrgDropdown(true)}
                            >
                                change your organization
                            </button>
                        </div>
                        {showOrgDropdown && <OrganizationMenu allowCreate={false} />}
                    </div>
                )}
            </div>
        </Modal>
    )
}
