import '~/styles'

import './RenderQuery.scss'

import { createRoot } from 'react-dom/client'

import { initKea } from '~/initKea'
import { ErrorBoundary } from '~/layout/ErrorBoundary'
import { loadInsightsJS } from '~/loadInsightsJS'

import { RenderQueryApp } from './RenderQueryApp'

// Disable tracking inside render-query frames. They are expected to run on third-party sites.
// Without this, embeds would send events to insights.hanzo.ai.
window.JS_INSIGHTS_API_KEY = undefined

loadInsightsJS()
initKea({ replaceInitialPathInWindow: false })

function renderApp(): void {
    const root = document.getElementById('root')
    if (!root) {
        console.error('Attempted to render Insights render_query app but #root was not found.')
        return
    }

    createRoot(root).render(
        <ErrorBoundary>
            <RenderQueryApp />
        </ErrorBoundary>
    )
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderApp)
} else {
    renderApp()
}
