import { useActions, useValues } from 'kea'

import { CopyToClipboardInline } from 'lib/components/CopyToClipboard'
import { Button } from 'lib/elements/Button'
import { Field } from 'lib/elements/Field'
import { Modal } from 'lib/elements/Modal'
import { Tag } from 'lib/elements/Tag/Tag'

import { verifiedDomainsLogic } from './verifiedDomainsLogic'

export function VerifyDomainModal(): JSX.Element {
    const { domainBeingVerified, updatingDomainLoading } = useValues(verifiedDomainsLogic)
    const { setVerifyModal, verifyDomain } = useActions(verifiedDomainsLogic)
    const challengeName = `_insights-challenge.${domainBeingVerified?.domain}.`

    return (
        <Modal
            isOpen={!!domainBeingVerified}
            onClose={() => setVerifyModal(null)}
            title="Verify your domain"
            description={
                <>
                    <Tag className="uppercase">{domainBeingVerified?.domain || ''}</Tag>
                    <p>To verify your domain, you need to add a record to your DNS zone.</p>
                </>
            }
            footer={
                <>
                    <Button type="secondary" onClick={() => setVerifyModal(null)}>
                        Verify later
                    </Button>
                    <Button type="primary" disabled={updatingDomainLoading} onClick={verifyDomain}>
                        Verify
                    </Button>
                </>
            }
        >
            <div>
                <ol>
                    <li>Sign in to your DNS provider.</li>
                    <li>
                        Add the following <b>TXT</b> record.
                        <div className="my-4 deprecated-space-y-2">
                            <Field.Pure label="Name">
                                <div className="flex items-center gap-2">
                                    <div className="border rounded p-2 h-10 flex-1">{challengeName}</div>
                                    <CopyToClipboardInline explicitValue={challengeName} selectable={true} />
                                </div>
                            </Field.Pure>

                            <Field.Pure label="Value or content">
                                <div className="flex items-center gap-2">
                                    <div className="border rounded p-2 h-10 flex-1">
                                        {domainBeingVerified?.verification_challenge}
                                    </div>
                                    {domainBeingVerified && (
                                        <CopyToClipboardInline
                                            explicitValue={domainBeingVerified.verification_challenge}
                                            selectable={true}
                                        />
                                    )}
                                </div>
                            </Field.Pure>
                            <Field.Pure label="TTL">
                                <div className="flex items-center gap-2">
                                    <div className="border rounded p-2 h-10 flex-1">Default or 3600</div>
                                    <CopyToClipboardInline explicitValue="3600" selectable={true} />
                                </div>
                            </Field.Pure>
                        </div>
                    </li>
                    <li>Press verify below.</li>
                </ol>
            </div>
        </Modal>
    )
}
