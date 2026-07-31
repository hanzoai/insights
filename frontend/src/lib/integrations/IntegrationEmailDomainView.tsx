import { useActions } from 'kea'

import { IconGear, IconLetter, IconTrash } from '@hanzo/icons'
import { Button, Tag, Tooltip } from '@hanzo/elements'

import { EmailIntegrationDomainGroupedType, IntegrationType } from '~/types'

import { ChannelType } from 'products/workflows/frontend/Channels/MessageChannels'

import { integrationsLogic } from './integrationsLogic'

const isVerificationRequired = (integration: IntegrationType): boolean => {
    return ['email'].includes(integration.kind)
}

const isVerified = (integration: IntegrationType): boolean => {
    switch (integration.kind) {
        case 'email':
            return integration.config.verified === true
        default:
            return true
    }
}

export function IntegrationEmailDomainView({
    integration,
}: {
    integration: EmailIntegrationDomainGroupedType
}): JSX.Element {
    const { openSetupModal, deleteIntegration } = useActions(integrationsLogic)
    const { domain, integrations } = integration
    const verified = integrations.every(isVerified)
    const verificationRequired = integrations.some(isVerificationRequired)

    return (
        <div className="rounded border bg-surface-primary">
            <div className="flex flex-1 justify-between items-center p-2">
                <div className="flex flex-1 gap-4 items-center ml-2">
                    <IconLetter className="w-8 h-8" />
                    <div className="flex-1">
                        <div className="flex gap-2">
                            <span>
                                <strong>{domain}</strong>
                            </span>
                            {verificationRequired && (
                                <Tooltip
                                    title={
                                        verified
                                            ? 'This channel is ready to use'
                                            : 'You cannot send messages from this channel until it has been verified'
                                    }
                                >
                                    <Tag type={verified ? 'success' : 'warning'}>
                                        {verified ? 'Verified' : 'Unverified'}
                                    </Tag>
                                </Tooltip>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col">
                {integrations.map((integration) => (
                    <div key={integration.id} className="flex items-center px-4 py-2 border-t gap-2">
                        <span className="flex-1">
                            {integration.config.name} &lt;{integration.config.email}&gt;
                        </span>
                        <Button
                            type="primary"
                            size="small"
                            onClick={() => {
                                openSetupModal(integration, integration.kind as ChannelType)
                            }}
                            icon={<IconGear />}
                        >
                            Configure
                        </Button>
                        <Button
                            type="primary"
                            size="small"
                            status="danger"
                            onClick={() => {
                                deleteIntegration(integration.id)
                            }}
                            icon={<IconTrash />}
                        >
                            Disconnect
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    )
}
