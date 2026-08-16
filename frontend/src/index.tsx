import '~/styles'

import './buffer-polyfill'

import { Suspense, lazy } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import { apply, read } from '@hanzo/appearance/state'

import { retryBootImport } from 'lib/utils/retryImport'

import { RootErrorBoundary } from './RootErrorBoundary'
import { ChunkLoadErrorBoundary } from './scenes/ChunkLoadErrorBoundary'

// A person's type size, density and accent, put on <html> before anything renders.
// It runs at module scope rather than inside a component because the knobs have to
// be on the document by first paint, and the entry is the last thing that is
// guaranteed to run before one. The App chunk is lazy, so a mount hook would land
// after the shell is already on screen and resize it under the reader.
//
// The stored preference is per device, so the server cannot render it the way it
// renders data-boot-theme. @hanzo/appearance publishes bootScript() for that gap,
// to inline in <head> ahead of the bundle. It is not used here: the pre-React shell
// is a spinner on a flat background, so nothing it paints carries a type size or a
// spacing that could jump, and inlining the script into a Django template would put
// a second copy of the logic somewhere that cannot import the first.
apply(read())

// Lazy-load App so the entry chunk stays minimal: the entire transitive dependency
// graph (kea, insights-js, scene logic, UI components) is only fetched when it renders.
// bootApp() runs the one-time boot side effects (insights-js, kea) after the chunks
// load and before <App /> first renders. It lives in its own module so scenes/App
// keeps component-only exports and stays a React Fast Refresh boundary.
const App = lazy(() =>
    Promise.all([retryBootImport(() => import('scenes/App')), retryBootImport(() => import('scenes/bootApp'))]).then(
        ([appModule, bootModule]) => {
            bootModule.bootApp()
            return { default: appModule.App }
        }
    )
)

declare global {
    interface Window {
        __insightsAppRoot?: Root
    }
}

function renderApp(): void {
    const rootElement = document.getElementById('root')
    if (!rootElement) {
        console.error('Attempted, but could not render Insights app because <div id="root" /> is not found.')
        return
    }
    // Vite 8 can serve this entry module twice after an HMR invalidation reaches it (the script
    // tag's bare URL plus a timestamped copy), and a second createRoot on an already-rooted
    // container crashes React. Reuse one root so a repeat execution re-renders instead.
    const root = (window.__insightsAppRoot ??= createRoot(rootElement))
    root.render(
        <RootErrorBoundary>
            {/* Auto-reloads once on a chunk-load failure (stale deploy). Repeated or non-chunk
                errors bubble to RootErrorBoundary, which reports them and shows the failure UI. */}
            <ChunkLoadErrorBoundary>
                <Suspense
                    fallback={
                        <div className="Preloader" role="status" aria-label="Loading Insights">
                            <div className="Preloader__inner" />
                        </div>
                    }
                >
                    <App />
                </Suspense>
            </ChunkLoadErrorBoundary>
        </RootErrorBoundary>
    )
}

// Render react only when DOM has loaded - javascript might be cached and loaded before the page is ready.
if (document.readyState !== 'loading') {
    renderApp()
} else {
    document.addEventListener('DOMContentLoaded', renderApp)
}
