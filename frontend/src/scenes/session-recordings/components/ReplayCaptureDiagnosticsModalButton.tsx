import { useState } from 'react'

import { IconVideoCamera } from '@hanzo/icons'

import { Button } from 'lib/elements/Button'
import { Modal } from 'lib/elements/Modal'

import { ReplayCaptureDiagnosticsPanel } from './ReplayCaptureDiagnosticsPanel'

export function ReplayCaptureDiagnosticsModalButton({
    eventProperties,
}: {
    eventProperties: Record<string, any>
}): JSX.Element {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <Button
                type="secondary"
                size="small"
                icon={<IconVideoCamera />}
                onClick={() => setIsOpen(true)}
                data-attr="check-session-recording-status"
            >
                Check session recording status
            </Button>
            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title="Session recording diagnosis"
                width={600}
            >
                <ReplayCaptureDiagnosticsPanel eventProperties={eventProperties} />
            </Modal>
        </>
    )
}
