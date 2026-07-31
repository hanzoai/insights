import clsx from 'clsx'
import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'

import { IconEllipsis, IconInfo } from '@hanzo/icons'
import {
    Banner,
    Button,
    Checkbox,
    Dialog,
    Input,
    Menu,
    Table,
    TableColumns,
    Tabs,
    Spinner,
    Tooltip,
} from '@hanzo/elements'

import { CodeSnippet, Language } from 'lib/components/CodeSnippet'
import { DomainConnectBanner } from 'lib/components/DomainConnect'
import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { OrganizationMembershipLevel } from 'lib/constants'
import { Field } from 'lib/elements/Field'
import { Markdown } from 'lib/elements/Markdown'
import { Link } from 'lib/elements/Link'
import { preflightLogic } from 'scenes/PreflightCheck/preflightLogic'

import { ProxyRecord, proxyLogic } from './proxyLogic'

const statusText = {
    valid: 'live',
    timed_out: 'timed out',
}

export function ManagedReverseProxy(): JSX.Element {
    const { cloudflareOptInAcknowledged, formState, proxyRecords, proxyRecordsLoading, maxProxyRecords } =
        useValues(proxyLogic)
    const { acknowledgeCloudflareOptIn, deleteRecord, showForm } = useActions(proxyLogic)
    const { preflight } = useValues(preflightLogic)

    const cloudflareProxyEnabled = preflight?.instance_preferences?.cloudflare_proxy_enabled

    const restrictionReason = useRestrictedArea({
        minimumAccessLevel: OrganizationMembershipLevel.Admin,
        scope: RestrictionScope.Organization,
    })

    const maxRecordsReached = proxyRecords.length >= maxProxyRecords

    const recordsWithMessages = proxyRecords.filter((record) => !!record.message)

    const columns: TableColumns<ProxyRecord> = [
        {
            title: 'Domain',
            dataIndex: 'domain',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            render: function RenderStatus(status) {
                if (!status) {
                    return <span>Unknown</span>
                }

                return (
                    <div
                        className={clsx(
                            'deprecated-space-x-1',
                            status === 'valid'
                                ? 'text-success'
                                : status == 'erroring'
                                  ? 'text-danger'
                                  : 'text-warning-dark'
                        )}
                    >
                        {status === 'issuing' && <Spinner />}
                        <span className="capitalize">{statusText[status] || status}</span>
                        {status === 'waiting' && (
                            <Tooltip title="Waiting for DNS records to be created">
                                <IconInfo className="cursor-pointer" />
                            </Tooltip>
                        )}
                        {status === 'timed_out' && (
                            <Tooltip title="Timed out waiting for DNS records to be created. Please delete the record and try again">
                                <IconInfo className="cursor-pointer" />
                            </Tooltip>
                        )}
                    </div>
                )
            },
        },
        {
            title: <span className="h-5" />,
            width: 20,
            className: 'flex justify-center',
            render: function Render(_, { id, status }) {
                return (
                    status != 'deleting' &&
                    !restrictionReason && (
                        <Menu
                            items={[
                                {
                                    label: 'Delete',
                                    status: 'danger',
                                    onClick: () => {
                                        Dialog.open({
                                            title: 'Delete managed proxy',
                                            width: '20rem',
                                            content:
                                                'Are you sure you want to delete this managed proxy? This cannot be undone and if it is in use then events sent to the domain will not be processed.',
                                            primaryButton: {
                                                status: 'danger',
                                                onClick: () => deleteRecord(id),
                                                children: 'Delete',
                                            },
                                            secondaryButton: {
                                                children: 'Cancel',
                                            },
                                        })
                                    },
                                },
                            ]}
                        >
                            <Button size="small" icon={<IconEllipsis className="text-secondary" />} />
                        </Menu>
                    )
                )
            },
        },
    ]

    // Show opt-in banner if Cloudflare proxy is enabled but not yet acknowledged
    if (cloudflareProxyEnabled && !cloudflareOptInAcknowledged) {
        return (
            <CloudflareOptInBanner onAcknowledge={acknowledgeCloudflareOptIn} restrictionReason={restrictionReason} />
        )
    }

    return (
        <div className="flex flex-col gap-2">
            {recordsWithMessages.map((r) => (
                <Banner type="warning" key={r.id}>
                    <Markdown>{`**${r.domain}**\n ${r.message}`}</Markdown>
                </Banner>
            ))}
            <Table
                loading={proxyRecords.length === 0 && proxyRecordsLoading}
                columns={columns}
                dataSource={proxyRecords}
                expandable={{
                    expandedRowRender: (record) => <ExpandedRow record={record} />,
                }}
            />

            <WaitingRecords />

            {formState === 'collapsed' ? (
                maxRecordsReached ? (
                    <Banner type="info">
                        There is a maximum of {maxProxyRecords} records allowed per organization.
                    </Banner>
                ) : (
                    <div className="flex">
                        <Button onClick={showForm} type="primary" disabledReason={restrictionReason}>
                            Add managed proxy
                        </Button>
                    </div>
                )
            ) : (
                <CreateRecordForm />
            )}
        </div>
    )
}

function CloudflareOptInBanner({
    onAcknowledge,
    restrictionReason,
}: {
    onAcknowledge: () => void
    restrictionReason: string | false | undefined | null
}): JSX.Element {
    const { cloudflareOptInChecked } = useValues(proxyLogic)
    const { setCloudflareOptInChecked } = useActions(proxyLogic)

    return (
        <div className="bg-surface-primary rounded border px-5 py-4 space-y-4">
            <div className="text-xl font-semibold leading-tight">Enable Managed Proxy (Beta)</div>
            <p className="text-secondary">
                This feature is disabled by default and has no effect unless you explicitly enable it.
            </p>
            <p>
                By enabling this beta feature, you explicitly instruct us to route applicable traffic via{' '}
                <Link to="https://www.cloudflare.com" target="_blank">
                    Cloudflare
                </Link>
                , and understand that data processed as part of this feature will be transmitted to and processed by
                Cloudflare.
            </p>
            <div className="border rounded p-4 space-y-3 bg-surface-secondary">
                <div className="font-semibold">Third-party processing (Cloudflare)</div>
                <p className="text-sm">
                    This beta feature routes certain customer and customer end-user traffic through Cloudflare, a
                    third-party infrastructure provider, for the purpose of delivering the managed proxy functionality.
                </p>
                <p className="text-sm">By enabling this feature, you:</p>
                <ul className="text-sm list-disc pl-5 space-y-1">
                    <li>Explicitly instruct us to route applicable data through Cloudflare for this service;</li>
                    <li>
                        Acknowledge and agree that data processed as part of this feature will be transmitted to and
                        processed by Cloudflare; and
                    </li>
                    <li>Understand that this feature is experimental (beta) and may change or be discontinued.</li>
                </ul>
                <p className="text-sm">
                    Cloudflare is not currently listed as an Insights subprocessor for this feature, and you choose to
                    enable this feature notwithstanding the foregoing. If we decide to make this functionality generally
                    available, we will update our Data Processing Agreement and provide notice in accordance with its
                    terms.
                </p>
            </div>
            <div className="space-y-3">
                <Checkbox
                    checked={cloudflareOptInChecked}
                    onChange={setCloudflareOptInChecked}
                    label="I have read and agree to the above terms"
                />
                <Button
                    type="primary"
                    onClick={onAcknowledge}
                    disabled={!cloudflareOptInChecked}
                    disabledReason={
                        restrictionReason || (!cloudflareOptInChecked ? 'You must agree to the terms' : undefined)
                    }
                >
                    Enable Managed Proxy
                </Button>
            </div>
        </div>
    )
}

const ExpandedRow = ({ record }: { record: ProxyRecord }): JSX.Element => {
    return (
        <div className="pb-4 pr-4 space-y-2">
            <Tabs
                size="small"
                activeKey="cname"
                tabs={[
                    {
                        label: 'CNAME',
                        key: 'cname',
                        content: (
                            <CodeSnippet key={record.id} language={Language.HTTP}>
                                {record.target_cname}
                            </CodeSnippet>
                        ),
                    },
                ]}
            />
            {record.status === 'waiting' && (
                <DomainConnectBanner
                    logicKey={`proxy-${record.id}`}
                    domain={record.domain}
                    context="proxy"
                    proxyRecordId={record.id}
                />
            )}
        </div>
    )
}

function CreateRecordForm(): JSX.Element {
    const { formState, proxyRecordsLoading } = useValues(proxyLogic)
    const { collapseForm } = useActions(proxyLogic)

    return (
        <div className="bg-surface-primary rounded border px-5 py-4 deprecated-space-y-2">
            {formState == 'active' && (
                <Form
                    logic={proxyLogic}
                    formKey="createRecord"
                    enableFormOnSubmit
                    className="w-full deprecated-space-y-2"
                >
                    <Banner type="warning">
                        <p className="font-semibold mb-1">
                            Avoid domains that ad-blockers may flag as analytics or advertising related.
                        </p>
                        <ul className="list-disc pl-5 space-y-0.5 mb-1">
                            <li>
                                <strong>Do not use</strong> subdomains containing words related to tracking, analytics,
                                or advertising (e.g. <code>analytics.mydomain.com</code>,{' '}
                                <code>insights.mydomain.com</code>). These are commonly blocked by ad-blockers and will
                                cause data loss.
                            </li>
                            <li>
                                <strong>Use a generic subdomain</strong> such as <code>t.mydomain.com</code> or{' '}
                                <code>app.mydomain.com</code> instead.
                            </li>
                        </ul>
                    </Banner>
                    <Field name="domain" label="Domain">
                        <Input
                            autoFocus
                            placeholder="Enter a domain (e.g. t.mydomain.com)"
                            data-attr="domain-input"
                        />
                    </Field>
                    <div className="flex justify-end gap-2">
                        <Button
                            type="secondary"
                            onClick={collapseForm}
                            disabledReason={proxyRecordsLoading ? 'Saving' : undefined}
                        >
                            Cancel
                        </Button>
                        <Button
                            htmlType="submit"
                            type="primary"
                            data-attr="domain-save"
                            loading={proxyRecordsLoading}
                        >
                            Add
                        </Button>
                    </div>
                </Form>
            )}
        </div>
    )
}

const WaitingRecords = (): JSX.Element | null => {
    const { proxyRecords } = useValues(proxyLogic)

    const waitingRecords = proxyRecords.filter((r) => r.status === 'waiting')

    if (waitingRecords.length === 0) {
        return null
    }

    return (
        <div className="flex flex-col gap-2 bg-surface-primary rounded border px-5 py-4">
            <div className="text-xl font-semibold leading-tight">Almost there</div>
            <div>
                You need to set the following <b>CNAME</b> records in your DNS provider:
            </div>
            <div className="flex flex-col gap-1">
                {waitingRecords.map((r) => (
                    <div key={r.id}>
                        <span className="font-semibold">{r.domain}</span>
                        <CodeSnippet key={r.id} language={Language.HTTP}>
                            {r.target_cname}
                        </CodeSnippet>

                        <DomainConnectBanner
                            logicKey={`proxy-${r.id}`}
                            domain={r.domain}
                            context="proxy"
                            proxyRecordId={r.id}
                            className="mt-2"
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}
