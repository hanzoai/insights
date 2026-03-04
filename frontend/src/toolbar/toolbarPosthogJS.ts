import insights from '@hanzo/insights'
import { useEffect, useState } from 'react'

import { FeatureFlagKey } from 'lib/constants'

const DEFAULT_API_KEY = 'sTMFPsFhdP1Ssg'

const runningOnInsights = !!window.INSIGHTS_APP_CONTEXT
const apiKey = runningOnInsights ? window.JS_INSIGHTS_API_KEY : DEFAULT_API_KEY
const apiHost = runningOnInsights ? window.JS_INSIGHTS_HOST : 'https://internal-j.hanzo.ai'

const initResult = insights.init(
    apiKey || DEFAULT_API_KEY,
    {
        api_host: apiHost,
        opt_out_capturing_by_default: true, // must call .opt_in_capturing() before any events are sent
        persistence: 'memory', // We don't want to persist anything, all events are in-memory
        persistence_name: apiKey + '_toolbar', // We don't need this but it ensures we don't accidentally mess with the standard persistence
        bootstrap: {
            featureFlags: {},
        },
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        disable_surveys: true,
        disable_scroll_properties: true,
        disable_product_tours: true,
        disable_session_recording: true,
        session_recording: {
            // we want to capture the toolbar (which is marked with ph-no-capture
            // so customer sessions don't see it), but also respect the customer's
            // ph-no-capture marks
            blockClass: 'ph-internal-no-capture',
            blockSelector: '.ph-no-capture:not(#__INSIGHTS_TOOLBAR__):not(#__INSIGHTS_TOOLBAR__ *)',
            maskAllInputs: true,
        },
    },
    'ph_toolbar_internal'
)
if (!initResult) {
    throw new Error('Failed to initialize Insights toolbar instance')
}
export const toolbarInsightsJS = initResult

if (runningOnInsights && window.JS_INSIGHTS_SELF_CAPTURE) {
    toolbarInsightsJS.debug()
}

export const useToolbarFeatureFlag = (flag: FeatureFlagKey, match?: string): boolean => {
    const [flagValue, setFlagValue] = useState<boolean | string | undefined>(toolbarInsightsJS.getFeatureFlag(flag))

    useEffect(() => {
        return toolbarInsightsJS.onFeatureFlags(() => setFlagValue(toolbarInsightsJS.getFeatureFlag(flag)))
    }, [flag, match])

    if (match) {
        return flagValue === match
    }

    return !!flagValue
}
