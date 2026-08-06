import { useActions, useValues } from 'kea'
import { useState } from 'react'

import { IconCopy, IconPlus, IconRefresh } from '@hanzo/icons'
import { Banner, Button, Card, Collapse, Input, Tag } from '@hanzo/elements'

import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { OrganizationMembershipLevel } from 'lib/constants'
import { Dialog } from 'lib/elements/Dialog'
import { toast } from 'lib/elements/Toast/Toast'

import { SceneSection } from '~/layout/scenes/components/SceneSection'

import { EmailConfigStatus, supportSettingsLogic } from './supportSettingsLogic'

interface DnsRecord {
    record_type: string
    name: string
    value: string
    valid: string
}

function DnsRecordsTable({ records }: { records: DnsRecord[] }): JSX.Element | null {
    if (!records || records.length === 0) {
        return null
    }
    return (
        <div className="border rounded overflow-x-auto">
            <table className="w-full text-xs">
                <thead>
                    <tr className="bg-surface-primary">
                        <th className="text-left px-2 py-1">Type</th>
                        <th className="text-left px-2 py-1">Name</th>
                        <th className="text-left px-2 py-1">Value</th>
                        <th className="text-left px-2 py-1">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {records.map((record: DnsRecord, i: number) => (
                        <tr key={i} className="border-t">
                            <td className="px-2 py-1 font-mono">{record.record_type}</td>
                            <td className="px-2 py-1 font-mono break-all max-w-[200px]">{record.name}</td>
                            <td className="px-2 py-1 font-mono break-all max-w-[300px]">{record.value}</td>
                            <td className="px-2 py-1">
                                {record.valid === 'valid' ? (
                                    <Tag type="success" size="small">
                                        Valid
                                    </Tag>
                                ) : (
                                    <Tag type="warning" size="small">
                                        Pending
                                    </Tag>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function EmailConfigContent({ config }: { config: EmailConfigStatus }): JSX.Element {
    const { emailVerifyingConfigId, emailTestingConfigId, settingDefaultEmailConfigId } =
        useValues(supportSettingsLogic)
    const { disconnectEmail, verifyEmailDomain, sendTestEmail, setDefaultEmail } = useActions(supportSettingsLogic)
    const adminRestrictionReason = useRestrictedArea({
        scope: RestrictionScope.Organization,
        minimumAccessLevel: OrganizationMembershipLevel.Admin,
    })

    const sendingRecords = config.dns_records?.sending_dns_records as DnsRecord[] | undefined
    const isVerifying = emailVerifyingConfigId === config.id
    const isTesting = emailTestingConfigId === config.id
    const isSettingDefault = settingDefaultEmailConfigId === config.id
    const isSettingAnyDefault = settingDefaultEmailConfigId !== null

    return (
        <div className="flex flex-col gap-3 p-3">
            {/* Forwarding address */}
            {config.forwarding_address && (
                <div>
                    <label className="font-medium text-sm">Forwarding address</label>
                    <p className="text-xs text-muted-alt mb-1">
                        Forward incoming emails to this address in your email provider.
                    </p>
                    <div className="flex items-center gap-2">
                        <code className="bg-surface-primary px-2 py-1 rounded text-sm break-all">
                            {config.forwarding_address}
                        </code>
                        <Button
                            type="secondary"
                            size="small"
                            icon={<IconCopy />}
                            onClick={() => {
                                void navigator.clipboard.writeText(config.forwarding_address!)
                                toast.success('Copied to clipboard')
                            }}
                        />
                    </div>
                    <div className="text-xs text-muted-alt mt-2 flex flex-col gap-0.5">
                        <p className="mb-0">
                            <strong>Gmail:</strong> Settings → Forwarding → Add a forwarding address
                        </p>
                        <p className="mb-0">
                            <strong>Outlook:</strong> Settings → Mail → Forwarding → Enable forwarding
                        </p>
                    </div>
                </div>
            )}

            {/* Domain verification */}
            <div>
                <label className="font-medium text-sm">Domain verification</label>
                <p className="text-xs text-muted-alt mb-1">Add DNS records to enable outbound sending (SPF/DKIM).</p>

                {sendingRecords && sendingRecords.length > 0 && <DnsRecordsTable records={sendingRecords} />}

                {!config.domain_verified && (
                    <Banner type="info" className="mt-2">
                        Add the DNS records above, then click "Verify domain". If you already have an SPF record (e.g.{' '}
                        <code className="text-xs">v=spf1 include:someservice.com ~all</code>), don't create a second one
                        — merge them into a single record:{' '}
                        <code className="text-xs">v=spf1 include:someservice.com include:mailgun.org ~all</code>
                    </Banner>
                )}

                <div className="flex gap-2 mt-2">
                    <Button
                        type={config.domain_verified ? 'secondary' : 'primary'}
                        size="small"
                        onClick={() => verifyEmailDomain(config.id)}
                        loading={isVerifying}
                        disabledReason={adminRestrictionReason}
                        icon={<IconRefresh />}
                    >
                        {config.domain_verified ? 'Re-verify' : 'Verify domain'}
                    </Button>

                    {config.domain_verified && (
                        <Button
                            type="secondary"
                            size="small"
                            onClick={() => sendTestEmail(config.id)}
                            loading={isTesting}
                        >
                            Send test email
                        </Button>
                    )}
                </div>
            </div>

            {/* Default + disconnect */}
            <div className="flex justify-between items-center border-t pt-2">
                <Button
                    type="secondary"
                    size="small"
                    loading={isSettingDefault}
                    disabledReason={
                        adminRestrictionReason ??
                        (config.is_default
                            ? 'This is already the primary email address'
                            : isSettingAnyDefault
                              ? 'Updating the primary address…'
                              : undefined)
                    }
                    tooltip="Tickets opened from the widget are sent from the primary address"
                    onClick={() => setDefaultEmail(config.id)}
                >
                    {config.is_default ? 'Primary address' : 'Set as primary'}
                </Button>
                <Button
                    type="secondary"
                    status="danger"
                    size="small"
                    disabledReason={adminRestrictionReason}
                    onClick={() => {
                        Dialog.open({
                            title: `Disconnect ${config.from_email}?`,
                            description:
                                'This will stop creating tickets from this email and may remove the sending domain. Existing tickets will not be affected.',
                            primaryButton: {
                                status: 'danger',
                                children: 'Disconnect',
                                onClick: () => disconnectEmail(config.id),
                            },
                            secondaryButton: { children: 'Cancel' },
                        })
                    }}
                >
                    Disconnect
                </Button>
            </div>
        </div>
    )
}

function AddEmailForm(): JSX.Element {
    const { newEmailFromEmail, newEmailFromName, emailConnecting, addEmailFormVisible } =
        useValues(supportSettingsLogic)
    const { setNewEmailFromEmail, setNewEmailFromName, connectEmail, setAddEmailFormVisible } =
        useActions(supportSettingsLogic)
    const adminRestrictionReason = useRestrictedArea({
        scope: RestrictionScope.Organization,
        minimumAccessLevel: OrganizationMembershipLevel.Admin,
    })

    if (!addEmailFormVisible) {
        return (
            <div>
                <Button
                    type="secondary"
                    size="small"
                    icon={<IconPlus />}
                    onClick={() => setAddEmailFormVisible(true)}
                    disabledReason={adminRestrictionReason}
                >
                    Add email address
                </Button>
            </div>
        )
    }

    return (
        <Card hoverEffect={false} className="flex flex-col gap-2 px-4 py-3">
            <label className="font-medium">Connect new email</label>
            <p className="text-xs text-muted-alt">
                Enter the email address customers will contact you at (e.g. support@company.com). We'll give you a
                forwarding address to set up in your email provider and register your domain for outbound sending.
            </p>
            <Input
                value={newEmailFromEmail}
                onChange={(value) => setNewEmailFromEmail(value)}
                placeholder="support@company.com"
                fullWidth
            />
            <Input
                value={newEmailFromName}
                onChange={(value) => setNewEmailFromName(value)}
                placeholder="Display name (e.g. Acme Support)"
                fullWidth
            />
            <div className="flex gap-2">
                <Button
                    type="primary"
                    size="small"
                    onClick={connectEmail}
                    loading={emailConnecting}
                    disabledReason={
                        adminRestrictionReason ??
                        (!newEmailFromEmail || !newEmailFromName ? 'Enter email address and display name' : undefined)
                    }
                >
                    Connect email
                </Button>
                <Button type="secondary" size="small" onClick={() => setAddEmailFormVisible(false)}>
                    Cancel
                </Button>
            </div>
        </Card>
    )
}

function configHeader(config: EmailConfigStatus): JSX.Element {
    return (
        <div className="flex min-w-0 items-center gap-2 text-left">
            <span className="font-medium truncate">{config.from_email}</span>
            {config.from_name && <span className="text-xs text-muted truncate">({config.from_name})</span>}
            {config.is_default && (
                <Tag type="primary" size="small" className="shrink-0">
                    Primary
                </Tag>
            )}
            {config.domain_verified ? (
                <Tag type="success" size="small" className="shrink-0">
                    Verified
                </Tag>
            ) : (
                <Tag type="warning" size="small" className="shrink-0">
                    Unverified
                </Tag>
            )}
        </div>
    )
}

export function EmailSection(): JSX.Element {
    const { emailConfigs } = useValues(supportSettingsLogic)
    const [expandedKeys, setExpandedKeys] = useState<string[]>([])

    return (
        <SceneSection
            title="Email channel"
            description="Receive customer emails as support tickets and reply directly from Insights. Set up forwarding and verify your domain to enable two-way email."
        >
            <div className="flex flex-col gap-3 max-w-[800px]">
                {emailConfigs.length > 0 && (
                    <Collapse
                        className="bg-surface-primary"
                        multiple
                        activeKeys={expandedKeys}
                        onChange={setExpandedKeys}
                        panels={emailConfigs.map((config: EmailConfigStatus) => ({
                            key: config.id,
                            header: configHeader(config),
                            content: <EmailConfigContent config={config} />,
                        }))}
                    />
                )}
                <AddEmailForm />
            </div>
        </SceneSection>
    )
}
