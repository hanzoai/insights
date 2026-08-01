import insights from 'insights-js'
import type { ErrorInfo } from 'react'

/** `onError` handler for script-charts trends adapters. Captures the React error
 *  boundary's error/info to Insights, tagged with the chart `feature` name. */
export function makeChartErrorHandler(feature: string): (error: Error, info: ErrorInfo) => void {
    return (error, info) => {
        insights.captureException(error, {
            feature,
            componentStack: info.componentStack ?? undefined,
        })
    }
}
