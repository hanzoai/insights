import { useActions, useValues } from 'kea'
import { useCallback, useState } from 'react'

import { IconX } from '@hanzo/icons'
import { Button, Modal } from '@hanzo/elements'

import { FloatingContainerContext } from 'lib/hooks/useFloatingContainerContext'
import { useKeepMountedWhileOpen } from 'lib/hooks/useKeepMountedWhileOpen'

import { LogsViewer } from 'products/logs/frontend/components/LogsViewer'

import { logsViewerModalLogic } from './logsViewerModalLogic'

export function LogsViewerModal(): JSX.Element | null {
    const { isOpen, viewerId, fullScreen, initialFilters } = useValues(logsViewerModalLogic)
    const { closeLogsViewerModal } = useActions(logsViewerModalLogic)
    const [floatingContainer, setFloatingContainer] = useState<HTMLDivElement | null>(null)
    const floatingContainerRef = useCallback((el: HTMLDivElement | null) => setFloatingContainer(el), [])
    const shouldRender = useKeepMountedWhileOpen(isOpen)

    if (!shouldRender) {
        return null
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={closeLogsViewerModal}
            simple
            title=""
            fullScreen={fullScreen}
            forceAbovePopovers
            hideCloseButton
            className={fullScreen ? 'bg-primary' : 'bg-primary h-[calc(100vh-60px-2rem)]'}
            width={fullScreen ? undefined : '90vw'}
            maxWidth={fullScreen ? undefined : 1600}
        >
            <FloatingContainerContext.Provider value={floatingContainer}>
                <div className="flex items-center justify-end border-b px-1 py-0.5">
                    <Button icon={<IconX />} size="small" onClick={closeLogsViewerModal} tooltip="Close" />
                </div>
                <Modal.Content embedded className="flex flex-col flex-1 min-h-0 overflow-x-hidden">
                    <div className="flex-1 min-h-0 overflow-hidden p-2">
                        <LogsViewer
                            id={viewerId}
                            showFullScreenButton={false}
                            initialFilters={initialFilters ?? undefined}
                        />
                    </div>
                </Modal.Content>
                <div ref={floatingContainerRef} />
            </FloatingContainerContext.Provider>
        </Modal>
    )
}
