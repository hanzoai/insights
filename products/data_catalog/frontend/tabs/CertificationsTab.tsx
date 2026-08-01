import { useActions, useValues } from 'kea'

import { IconPlusSmall, IconRefresh } from '@hanzo/icons'
import { Button, Dialog } from '@hanzo/elements'

import { More } from 'lib/elements/Button/More'
import { Table, TableColumns } from 'lib/elements/Table'
import { Tag } from 'lib/elements/Tag'

import { certificationsLogic } from '../certificationsLogic'
import { NewCertificationModal } from '../components/NewCertificationModal'
import type { DataCatalogCertificationApi } from '../generated/api.schemas'

const STATUS_TAG: Record<string, { label: string; type: 'warning' | 'success' | 'muted' }> = {
    proposed: { label: 'Proposed', type: 'warning' },
    certified: { label: 'Certified', type: 'success' },
    deprecated: { label: 'Deprecated', type: 'muted' },
}

export function CertificationsTab(): JSX.Element {
    const { certifications, certificationsLoading, actionsInFlight } = useValues(certificationsLogic)
    const {
        loadCertifications,
        openNewCertificationModal,
        certifyCertification,
        deprecateCertification,
        revokeCertification,
    } = useActions(certificationsLogic)

    const confirmRevoke = (certification: DataCatalogCertificationApi): void => {
        Dialog.open({
            title: 'Revoke this certification?',
            content: (
                <div className="text-sm text-secondary">
                    Revoking deletes the trust mark on {certification.target_name}. This cannot be undone.
                </div>
            ),
            primaryButton: {
                children: 'Revoke',
                status: 'danger',
                onClick: () => revokeCertification(certification.id),
            },
            secondaryButton: { children: 'Cancel' },
        })
    }

    const columns: TableColumns<DataCatalogCertificationApi> = [
        {
            title: 'Target',
            key: 'target_name',
            render: (_, certification) => certification.target_name,
        },
        {
            title: 'Type',
            key: 'target_type',
            render: (_, certification) => <Tag type="option">{certification.target_type}</Tag>,
        },
        {
            title: 'Status',
            key: 'status',
            render: (_, certification) => {
                const tag = STATUS_TAG[certification.status] ?? { label: certification.status, type: 'muted' as const }
                return <Tag type={tag.type}>{tag.label}</Tag>
            },
        },
        {
            title: 'Notes',
            key: 'notes',
            render: (_, certification) => certification.notes || <span className="text-secondary">-</span>,
        },
        {
            title: 'Certified by',
            key: 'certified_by',
            render: (_, certification) =>
                certification.certified_by?.email || <span className="text-secondary">-</span>,
        },
        {
            key: 'actions',
            width: 0,
            render: (_, certification) => {
                const inFlight = !!actionsInFlight[certification.id]
                return (
                    <More
                        overlay={
                            <>
                                {certification.status !== 'certified' && (
                                    <Button
                                        fullWidth
                                        loading={inFlight}
                                        onClick={() => certifyCertification(certification.id)}
                                    >
                                        Certify
                                    </Button>
                                )}
                                {certification.status === 'certified' && (
                                    <Button
                                        fullWidth
                                        loading={inFlight}
                                        onClick={() => deprecateCertification(certification.id)}
                                    >
                                        Deprecate
                                    </Button>
                                )}
                                <Button
                                    fullWidth
                                    status="danger"
                                    disabledReason={inFlight ? 'Working' : undefined}
                                    onClick={() => confirmRevoke(certification)}
                                >
                                    Revoke
                                </Button>
                            </>
                        }
                    />
                )
            },
        },
    ]

    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-end gap-2 flex-wrap items-center">
                <Button
                    type="secondary"
                    icon={<IconRefresh />}
                    size="small"
                    loading={certificationsLoading}
                    onClick={() => loadCertifications()}
                >
                    Reload
                </Button>
                <Button
                    type="primary"
                    icon={<IconPlusSmall />}
                    size="small"
                    onClick={openNewCertificationModal}
                    data-attr="data-catalog-new-certification-button"
                >
                    Propose certification
                </Button>
            </div>
            <Table
                data-attr="data-catalog-certifications-table"
                dataSource={certifications}
                rowKey="id"
                columns={columns}
                loading={certificationsLoading}
                pagination={{ pageSize: 20 }}
                emptyState="No certifications yet."
                nouns={['certification', 'certifications']}
            />
            <NewCertificationModal />
        </div>
    )
}
