import { useActions, useValues } from 'kea'
import { useState } from 'react'

import { IconRefresh } from '@hanzo/icons'
import { Link } from '@hanzo/elements'

import { CopyToClipboardInline } from 'lib/components/CopyToClipboard'
import { Banner } from 'lib/elements/Banner'
import { Button } from 'lib/elements/Button'
import { Dialog } from 'lib/elements/Dialog'
import { Label } from 'lib/elements/Label/Label'
import { Modal } from 'lib/elements/Modal'
import { Switch } from 'lib/elements/Switch/Switch'

import { verifiedDomainsLogic } from './verifiedDomainsLogic'

export function ConfigureSCIMModal(): JSX.Element {
    const { configureSCIMModalId, scimConfig, scimConfigLoading } = useValues(verifiedDomainsLogic)
    const { setConfigureSCIMModalId, enableScim, disableScim, regenerateScimToken } = useActions(verifiedDomainsLogic)
    const [tokenJustRevealed, setTokenJustRevealed] = useState(false)

    const handleClose = (): void => {
        setConfigureSCIMModalId(null)
        setTokenJustRevealed(false)
    }

    const handleToggleScim = async (): Promise<void> => {
        if (!configureSCIMModalId) {
            return
        }

        if (scimConfig.scim_enabled) {
            Dialog.open({
                title: 'Disable SCIM?',
                description:
                    'Your identity provider will no longer be able to manage users. SAML authentication will continue to work.',
                primaryButton: {
                    status: 'danger',
                    children: 'Disable SCIM',
                    onClick: async () => {
                        await disableScim(configureSCIMModalId)
                    },
                },
                secondaryButton: {
                    children: 'Cancel',
                },
            })
        } else {
            await enableScim(configureSCIMModalId)
            setTokenJustRevealed(true)
        }
    }

    const handleRegenerateToken = async (): Promise<void> => {
        if (!configureSCIMModalId) {
            return
        }

        Dialog.open({
            title: 'Regenerate SCIM token?',
            description:
                'This will invalidate the current token. You will need to update your identity provider with the new token.',
            primaryButton: {
                status: 'danger',
                children: 'Regenerate token',
                onClick: async () => {
                    await regenerateScimToken(configureSCIMModalId)
                    setTokenJustRevealed(true)
                },
            },
            secondaryButton: {
                children: 'Cancel',
            },
        })
    }

    const showToken = tokenJustRevealed && scimConfig.scim_bearer_token

    return (
        <Modal onClose={handleClose} isOpen={!!configureSCIMModalId} title="" simple>
            <div className="Modal__layout">
                <Modal.Header>
                    <h3>Configure SCIM provisioning</h3>
                </Modal.Header>
                <Modal.Content className="space-y-2">
                    <p>
                        <Link to="https://hanzo.ai/docs/data/sso#setting-up-scim" target="_blank" targetBlankIcon>
                            Read the docs
                        </Link>
                    </p>

                    <Switch
                        checked={scimConfig.scim_enabled ?? false}
                        onChange={handleToggleScim}
                        disabled={scimConfigLoading}
                        label="Enable SCIM"
                    />

                    {scimConfig.scim_enabled && (
                        <>
                            <div>
                                <Label className="block mb-1">SCIM Base URL</Label>
                                <CopyToClipboardInline description="SCIM base URL">
                                    {scimConfig.scim_base_url || ''}
                                </CopyToClipboardInline>
                            </div>

                            <div>
                                <Label className="block mb-1">Bearer Token</Label>
                                {showToken ? (
                                    <>
                                        <CopyToClipboardInline description="Bearer token">
                                            {scimConfig.scim_bearer_token || ''}
                                        </CopyToClipboardInline>
                                        <Banner type="warning" className="my-2">
                                            Save this token, it will only be shown once.
                                        </Banner>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-muted">
                                            The bearer token is only displayed once when generated.
                                        </p>
                                        <Button
                                            type="secondary"
                                            onClick={handleRegenerateToken}
                                            icon={<IconRefresh />}
                                            loading={scimConfigLoading}
                                        >
                                            Regenerate token
                                        </Button>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </Modal.Content>
                <Modal.Footer>
                    <Button type="secondary" onClick={handleClose}>
                        Close
                    </Button>
                </Modal.Footer>
            </div>
        </Modal>
    )
}
