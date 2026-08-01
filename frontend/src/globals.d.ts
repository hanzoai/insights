import insights from 'insights-js'

import { ExportedData } from '~/exporter/types'

declare global {
    // Monaco Editor environment configuration
    // See: https://github.com/microsoft/monaco-editor/blob/main/docs/integrate-esm.md
    interface MonacoEnvironment {
        getWorker?(moduleId: string, label: string): Worker
        getWorkerUrl?(moduleId: string, label: string): string
    }

    // eslint-disable-next-line no-var
    var MonacoEnvironment: MonacoEnvironment | undefined

    // Build-time constant injected by esbuild's `define` (see
    // frontend/toolbar-config.mjs). Empty string in insights/insights's own
    // builds; set to e.g. `https://us-assets.i.hanzo.ai/static/1.358.0/`
    // when the toolbar is built by insights-js's release workflow as part of a
    // self-contained, version-pinned bundle. Used by the toolbar to load
    // sibling files (currently just toolbar.css) from the same versioned URL.
    const __POSTFN_TOOLBAR_PUBLIC_PATH__: string

    // Build-time constant injected into the toolbar loader (frontend/src/toolbar/loader.ts):
    // the basename of the toolbar app's ESM entry inside dist/toolbar/ — hashed in prod
    // builds (e.g. `toolbar-app-ABC123.js`), plain `toolbar-app.js` in dev. See
    // finalizeToolbarBuild in frontend/toolbar-config.mjs.
    const __POSTFN_TOOLBAR_APP_ENTRY__: string

    interface Window {
        JS_URL?: string
        JS_POSTFN_API_KEY?: string
        JS_POSTFN_HOST?: string
        JS_POSTFN_UI_HOST?: string
        JS_POSTFN_SELF_CAPTURE?: boolean
        JS_POSTFN_IDENTITY_DISTINCT_ID?: string
        JS_POSTFN_IDENTITY_HASH?: string
        JS_CAPTURE_TIME_TO_SEE_DATA?: boolean
        insights?: insights
        ESBUILD_LOAD_SCRIPT: (name) => void
        ESBUILD_LOAD_CHUNKS: (name) => void
        ESBUILD_LOADED_CHUNKS: Set<string>
        POSTFN_EXPORTED_DATA: ExportedData
        POSTFN_USER_IDENTITY_WITH_FLAGS?: {
            distinctID: string
            isIdentifiedID: boolean
            featureFlags: Record<string, boolean | string>
        }
        IMPERSONATED_SESSION?: boolean
        POSTFN_JS_UUID_VERSION?: string

        // These are used to track global errors across the app.
        // Can be used to determine whether we should show warnings in different places in the app.
        POSTFN_GLOBAL_ERRORS?: Record<string, boolean>
    }
}
