import { useValues } from 'kea'
import { createPortal } from 'react-dom'

import { IconX } from '@hanzo/icons'

import { Logomark } from 'lib/brand'
import { useFloatingContainer } from 'lib/hooks/useFloatingContainerContext'

import { toolbarConfigLogic } from '~/toolbar/toolbarConfigLogic'

interface UiHostConfigModalProps {
    visible: boolean
    onClose: () => void
}

export function UiHostConfigModal({ visible, onClose }: UiHostConfigModalProps): JSX.Element | null {
    const { uiHost } = useValues(toolbarConfigLogic)
    const floatingContainer = useFloatingContainer()

    if (!visible || !floatingContainer) {
        return null
    }

    return createPortal(
        <div
            className="UiHostConfigModal"
            onClick={onClose}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
        >
            <div className="UiHostConfigModal__content" onClick={(e) => e.stopPropagation()}>
                <button className="UiHostConfigModal__close" onClick={onClose} aria-label="Close">
                    <IconX />
                </button>
                <div className="UiHostConfigModal__branding">
                    <Logomark variant="mono" />
                </div>
                <div className="UiHostConfigModal__header">
                    <strong>Insights could not be reached</strong>
                </div>
                <p>
                    The toolbar tried to connect to the Insights app at <code>{uiHost}</code> but could not reach it.
                    This happens when you use a reverse proxy for <code>api_host</code> — the toolbar needs to know the
                    direct URL of the Insights app to authenticate.
                </p>
                <p>
                    Add <code>ui_host</code> to your Insights JS initialisation to point directly to Insights:
                </p>
                <pre className="UiHostConfigModal__code">
                    {`insights.init('<ph_project_api_key>', {
    api_host: '${uiHost}', // your reverse proxy
    ui_host: '<ph_app_host>',  // see note below
})`}
                </pre>
                <p className="UiHostConfigModal__hint">
                    Replace <code>{'<ph_app_host>'}</code> with the Insights app URL for your region:{' '}
                    <code>https://us.hanzo.ai</code> (US) or <code>https://eu.hanzo.ai</code> (EU).
                </p>
            </div>
        </div>,
        floatingContainer
    )
}
