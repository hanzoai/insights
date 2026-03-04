import insights from '@hanzo/insights'

import { ExportedData } from '~/exporter/types'

declare global {
    interface Window {
        JS_URL?: string
        JS_INSIGHTS_API_KEY?: string
        JS_INSIGHTS_HOST?: string
        JS_INSIGHTS_UI_HOST?: string
        JS_INSIGHTS_SELF_CAPTURE?: boolean
        JS_CAPTURE_TIME_TO_SEE_DATA?: boolean
        insights?: insights
        ESBUILD_LOAD_SCRIPT: (name) => void
        ESBUILD_LOAD_CHUNKS: (name) => void
        ESBUILD_LOADED_CHUNKS: Set<string>
        INSIGHTS_EXPORTED_DATA: ExportedData
        INSIGHTS_USER_IDENTITY_WITH_FLAGS?: {
            distinctID: string
            isIdentifiedID: boolean
            featureFlags: Record<string, boolean | string>
        }
        IMPERSONATED_SESSION?: boolean
        INSIGHTS_JS_UUID_VERSION?: string

        // These are used to track global errors across the app.
        // Can be used to determine whether we should show warnings in different places in the app.
        INSIGHTS_GLOBAL_ERRORS?: Record<string, boolean>
    }
}
