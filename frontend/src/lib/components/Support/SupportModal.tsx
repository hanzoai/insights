import { useActions, useValues } from 'kea'
import { useEffect } from 'react'
import { createRoot } from 'react-dom/client'

import { Button } from '@hanzo/elements'

import { Modal } from 'lib/elements/Modal/Modal'
import { preflightLogic } from 'scenes/PreflightCheck/preflightLogic'

import { sidePanelStateLogic } from '~/layout/navigation-3000/sidepanel/sidePanelStateLogic'

import { SupportForm } from './SupportForm'
import { supportLogic } from './supportLogic'

function SupportModal({ onAfterClose }: { onAfterClose: () => void }): JSX.Element | null {
    const { sendSupportRequest, isSupportFormOpen, title } = useValues(supportLogic)
    const { closeSupportForm, resetSendSupportRequest } = useActions(supportLogic)
    const { isCloudOrDev } = useValues(preflightLogic)
    const { sidePanelAvailable } = useValues(sidePanelStateLogic)

    useEffect(() => {
        if (!isCloudOrDev) {
            onAfterClose()
        }
    }, [isCloudOrDev]) // oxlint-disable-line react-hooks/exhaustive-deps

    if (!isCloudOrDev || sidePanelAvailable) {
        return null
    }

    return (
        <Modal
            isOpen={isSupportFormOpen}
            onClose={closeSupportForm}
            title={title}
            footer={
                <div className="flex items-center gap-2">
                    <Button
                        form="support-modal-form"
                        type="secondary"
                        onClick={() => {
                            closeSupportForm()
                            resetSendSupportRequest()
                        }}
                    >
                        Cancel
                    </Button>
                    <Button form="support-modal-form" htmlType="submit" type="primary" data-attr="submit">
                        Submit
                    </Button>
                </div>
            }
            hasUnsavedInput={!!sendSupportRequest.message}
            onAfterClose={onAfterClose}
        >
            <SupportForm />
        </Modal>
    )
}

export const openSupportModal = (): void => {
    const div = document.createElement('div')
    const root = createRoot(div)
    function destroy(): void {
        root.unmount()
        if (div.parentNode) {
            div.parentNode.removeChild(div)
        }
    }

    document.body.appendChild(div)
    root.render(<SupportModal onAfterClose={destroy} />)
    return
}
