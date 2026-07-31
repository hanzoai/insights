import { useActions, useValues } from 'kea'
import insights from '@hanzo/insights'
import { useState } from 'react'

import { IconCopy } from '@hanzo/icons'
import { Banner, Button, Divider, Modal } from '@hanzo/elements'

import { SHARING_MODAL_WIDTH } from 'lib/components/Sharing/SharingModal'
import { base64Encode } from 'lib/utils'
import { copyToClipboard } from 'lib/utils/copyToClipboard'
import { urls } from 'scenes/urls'

import { AccessControlPopoutCTA } from '~/layout/navigation-3000/sidepanel/panels/access_control/AccessControlPopoutCTA'
import { AccessControlResourceType } from '~/types'

import { notebookLogic } from './notebookLogic'

export type NotebookShareModalProps = {
    shortId: string
}

export function NotebookShareModal({ shortId }: NotebookShareModalProps): JSX.Element {
    const { content, isLocalOnly, isShareModalOpen } = useValues(notebookLogic({ shortId }))
    const { closeShareModal } = useActions(notebookLogic({ shortId }))

    const notebookUrl = urls.absolute(urls.currentProject(urls.notebook(shortId)))
    const canvasUrl = urls.absolute(urls.canvas()) + `#🦔=${base64Encode(JSON.stringify(content))}`

    const [interestTracked, setInterestTracked] = useState(false)

    const trackInterest = (): void => {
        insights.capture('pressed interested in notebook sharing', { url: notebookUrl })
    }

    return (
        <Modal
            title="Share notebook"
            onClose={() => closeShareModal()}
            isOpen={isShareModalOpen}
            width={SHARING_MODAL_WIDTH}
            footer={
                <Button type="secondary" onClick={closeShareModal}>
                    Done
                </Button>
            }
        >
            <div className="deprecated-space-y-4">
                <AccessControlPopoutCTA
                    resourceType={AccessControlResourceType.Notebook}
                    callback={() => {
                        closeShareModal()
                    }}
                />
                <Divider />
                <h3>Internal Link</h3>
                {!isLocalOnly ? (
                    <>
                        <p>
                            <b>Click the button below</b> to copy a direct link to this Notebook. Make sure the person
                            you share it with has access to this Insights project.
                        </p>
                        <Button
                            type="secondary"
                            fullWidth
                            center
                            truncate
                            sideIcon={<IconCopy />}
                            onClick={() => void copyToClipboard(notebookUrl, 'notebook link')}
                            title={notebookUrl}
                        >
                            {notebookUrl}
                        </Button>

                        <Divider className="my-4" />
                    </>
                ) : (
                    <Banner type="info">
                        <p>This Notebook cannot be shared directly with others as it is only visible to you.</p>
                    </Banner>
                )}

                <h3>Template Link</h3>
                <p>
                    The link below will open a Canvas with the contents of this Notebook, allowing the receiver to view
                    it, edit it or create their own Notebook without affecting this one.
                </p>
                <Button
                    type="secondary"
                    fullWidth
                    center
                    truncate
                    sideIcon={<IconCopy />}
                    onClick={() => void copyToClipboard(canvasUrl, 'canvas link')}
                    title={canvasUrl}
                >
                    {canvasUrl}
                </Button>

                <Divider className="my-4" />

                <h3>External Sharing</h3>

                <Banner
                    type="warning"
                    action={{
                        children: !interestTracked ? 'I would like this!' : 'Thanks!',
                        onClick: () => {
                            if (!interestTracked) {
                                trackInterest()
                                setInterestTracked(true)
                            }
                        },
                    }}
                >
                    We don’t currently support sharing notebooks externally, but it’s on our roadmap!
                </Banner>
            </div>
        </Modal>
    )
}
