import { useActions, useValues } from 'kea'

import { IconCheckCircle, IconInfo, IconLock, IconTrash, IconWarning } from '@hanzo/icons'

import { PayGateMini } from 'lib/components/PayGateMini/PayGateMini'
import { RestrictionScope } from 'lib/components/RestrictedArea'
import { useRestrictedArea } from 'lib/components/RestrictedArea'
import { OrganizationMembershipLevel } from 'lib/constants'
import { Button } from 'lib/elements/Button'
import { More } from 'lib/elements/Button/More'
import { Dialog } from 'lib/elements/Dialog'
import { Switch } from 'lib/elements/Switch/Switch'
import { Table, TableColumns } from 'lib/elements/Table'
import { Tag } from 'lib/elements/Tag/Tag'
import { Link } from 'lib/elements/Link'
import { Tooltip } from 'lib/elements/Tooltip'
import { IconExclamation, IconOffline } from 'lib/elements/icons'
import { preflightLogic } from 'scenes/PreflightCheck/preflightLogic'
import { urls } from 'scenes/urls'

import { AvailableFeature, OrganizationDomainType } from '~/types'

import { AddDomainModal } from './AddDomainModal'
import { ConfigureSAMLModal } from './ConfigureSAMLModal'
import { ConfigureSCIMModal } from './ConfigureSCIMModal'
import { SSOSelect } from './SSOSelect'
import { VerifyDomainModal } from './VerifyDomainModal'
import { verifiedDomainsLogic } from './verifiedDomainsLogic'

const iconStyle = { marginRight: 4, fontSize: '1.15em', paddingTop: 2 }

export function VerifiedDomains(): JSX.Element {
    const { verifiedDomainsLoading, updatingDomainLoading } = useValues(verifiedDomainsLogic)
    const { setAddModalShown } = useActions(verifiedDomainsLogic)

    const restrictionReason = useRestrictedArea({
        minimumAccessLevel: OrganizationMembershipLevel.Admin,
        scope: RestrictionScope.Organization,
    })

    return (
        <PayGateMini feature={AvailableFeature.AUTOMATIC_PROVISIONING}>
            <p>
                Enable users to sign up automatically with an email address on verified domains and enforce SSO for
                accounts under your domains.
            </p>

            <VerifiedDomainsTable />
            <Button
                type="primary"
                onClick={() => setAddModalShown(true)}
                className="mt-4"
                disabledReason={verifiedDomainsLoading || updatingDomainLoading ? 'loading...' : restrictionReason}
            >
                Add domain
            </Button>
        </PayGateMini>
    )
}

function VerifiedDomainsTable(): JSX.Element {
    const {
        verifiedDomains,
        verifiedDomainsLoading,
        currentOrganization,
        updatingDomainLoading,
        isSSOEnforcementAvailable,
        isSAMLAvailable,
        isSCIMAvailable,
    } = useValues(verifiedDomainsLogic)
    const { updateDomain, deleteVerifiedDomain, setVerifyModal, setConfigureSAMLModalId, setConfigureSCIMModalId } =
        useActions(verifiedDomainsLogic)
    const { preflight } = useValues(preflightLogic)

    const restrictionReason = useRestrictedArea({
        minimumAccessLevel: OrganizationMembershipLevel.Admin,
        scope: RestrictionScope.Organization,
    })

    const columns: TableColumns<OrganizationDomainType> = [
        {
            key: 'domain',
            title: 'Domain name',
            dataIndex: 'domain',
            render: function RenderDomainName(_, { domain }) {
                return <Tag>{domain}</Tag>
            },
        },
        ...(preflight?.cloud
            ? ([
                  {
                      key: 'is_verified',
                      title: (
                          <div className="flex items-center deprecated-space-x-1">
                              <span>Verification</span>
                              <Tooltip title="Verification (through DNS) is required to use domains for authentication (e.g. SAML or enforce SSO).">
                                  <IconInfo />
                              </Tooltip>
                          </div>
                      ),
                      render: function Verified(_, { is_verified, verified_at }) {
                          return is_verified ? (
                              <div className="flex items-center text-success">
                                  <IconCheckCircle style={iconStyle} /> Verified
                              </div>
                          ) : verified_at ? (
                              <div className="flex items-center text-danger">
                                  <IconExclamation style={iconStyle} /> Verification expired
                              </div>
                          ) : (
                              <div className="flex items-center text-warning">
                                  <IconWarning style={iconStyle} /> Pending verification
                              </div>
                          )
                      },
                  },
              ] as TableColumns<OrganizationDomainType>)
            : []),
        {
            key: 'jit_provisioning_enabled',
            title: (
                <div className="flex items-center deprecated-space-x-1">
                    <span>Automatic provisioning</span>
                    <Tooltip
                        title={`Enables just-in-time provisioning. If a user logs in with SSO with an email address on this domain an account will be created in ${
                            currentOrganization?.name || 'this organization'
                        } if it does not exist.`}
                    >
                        <IconInfo />
                    </Tooltip>
                </div>
            ),
            render: function AutomaticProvisioning(_, { jit_provisioning_enabled, id, is_verified }) {
                return is_verified ? (
                    <div className="flex items-center">
                        <Switch
                            checked={jit_provisioning_enabled}
                            disabled={updatingDomainLoading || !is_verified}
                            disabledReason={restrictionReason}
                            onChange={(checked) => updateDomain({ id, jit_provisioning_enabled: checked })}
                            label={
                                <span className="font-normal">{jit_provisioning_enabled ? 'Enabled' : 'Disabled'}</span>
                            }
                        />
                    </div>
                ) : (
                    <i className="text-secondary">Verify domain to enable automatic provisioning</i>
                )
            },
        },
        {
            key: 'sso_enforcement',
            title: (
                <div className="flex items-center deprecated-space-x-1">
                    <span>Enforce SSO</span>
                    <Tooltip title="Require users with email addresses on this domain to always log in using a specific SSO provider.">
                        <IconInfo />
                    </Tooltip>
                </div>
            ),
            render: function SSOEnforcement(_, { sso_enforcement, is_verified, id, has_saml }, index) {
                if (!isSSOEnforcementAvailable) {
                    return index === 0 ? (
                        <Link to={urls.organizationBilling()} className="flex items-center">
                            <IconLock style={{ color: 'var(--warning)', marginLeft: 4 }} /> Upgrade to enable SSO
                            enforcement
                        </Link>
                    ) : (
                        <></>
                    )
                }
                return is_verified ? (
                    <SSOSelect
                        value={sso_enforcement}
                        loading={updatingDomainLoading}
                        onChange={(val) => updateDomain({ id, sso_enforcement: val })}
                        samlAvailable={has_saml}
                        disabledReason={restrictionReason}
                    />
                ) : (
                    <i className="text-secondary">Verify domain to enable</i>
                )
            },
        },
        {
            key: 'saml',
            title: 'SAML',
            render: function SAML(_, { is_verified, saml_acs_url, saml_entity_id, saml_x509_cert, has_saml }, index) {
                if (!isSAMLAvailable) {
                    return index === 0 ? (
                        <Link to={urls.organizationBilling()} className="flex items-center">
                            <IconLock style={{ color: 'var(--warning)', marginLeft: 4 }} /> Upgrade to enable SAML
                        </Link>
                    ) : (
                        <></>
                    )
                }
                return is_verified ? (
                    <>
                        {has_saml ? (
                            <div className="flex items-center text-success">
                                <IconCheckCircle style={iconStyle} /> SAML enabled
                            </div>
                        ) : saml_acs_url || saml_entity_id || saml_x509_cert ? (
                            <div className="flex items-center text-warning">
                                <IconWarning style={iconStyle} /> SAML partially configured
                            </div>
                        ) : (
                            <div className="flex items-center">
                                <IconOffline style={iconStyle} /> SAML not set up
                            </div>
                        )}
                    </>
                ) : (
                    <i className="text-secondary">Verify domain to enable</i>
                )
            },
        },
        {
            key: 'verify',
            width: 32,
            align: 'center',
            render: function RenderActions(_, { is_verified, id }) {
                return is_verified ? (
                    <></>
                ) : (
                    <Button type="primary" onClick={() => setVerifyModal(id)} disabledReason={restrictionReason}>
                        Verify
                    </Button>
                )
            },
        },
        {
            key: 'actions',
            width: 32,
            align: 'center',
            render: function RenderActions(_, { is_verified, id, domain }) {
                return (
                    <More
                        overlay={
                            <>
                                {is_verified && (
                                    <>
                                        <Button
                                            onClick={() => setConfigureSAMLModalId(id)}
                                            fullWidth
                                            disabledReason={
                                                restrictionReason ||
                                                (!isSAMLAvailable ? 'Upgrade to enable SAML' : undefined)
                                            }
                                        >
                                            Configure SAML
                                        </Button>
                                        {/* TODO: After SCIM is fully rolled out, show the Configure SCIM button with 'Upgrade to enable SCIM' disabledReason */}
                                        {isSCIMAvailable && (
                                            <Button
                                                onClick={() => setConfigureSCIMModalId(id)}
                                                fullWidth
                                                disabledReason={restrictionReason}
                                            >
                                                Configure SCIM
                                            </Button>
                                        )}
                                    </>
                                )}
                                <Button
                                    status="danger"
                                    onClick={() =>
                                        Dialog.open({
                                            title: `Remove ${domain}?`,
                                            description:
                                                'This cannot be undone. If you have SAML configured or SSO enforced,it will be immediately disabled.',
                                            primaryButton: {
                                                status: 'danger',
                                                children: 'Remove domain',
                                                onClick: () => deleteVerifiedDomain(id),
                                            },
                                            secondaryButton: {
                                                children: 'Cancel',
                                            },
                                        })
                                    }
                                    fullWidth
                                    icon={<IconTrash />}
                                    disabledReason={restrictionReason}
                                >
                                    Remove domain
                                </Button>
                            </>
                        }
                    />
                )
            },
        },
    ]
    return (
        <div>
            <Table
                dataSource={verifiedDomains}
                columns={columns}
                loading={verifiedDomainsLoading}
                rowKey="id"
                emptyState="You haven't registered any authentication domains yet."
            />
            <AddDomainModal />
            <ConfigureSAMLModal />
            <ConfigureSCIMModal />
            <VerifyDomainModal />
        </div>
    )
}
