import insights from 'insights-js'
import { Insights } from 'insights-js'

import {
    parseEncodedSnapshots as _parseEncodedSnapshots,
    ReplayTelemetry,
    SnappyDecompressor,
    RegisterWindowIdCallback,
} from '@hanzo/replay-shared'

import { getDecompressionWorkerManager } from 'scenes/session-recordings/player/snapshot-processing/DecompressionWorkerManager'

import { EncodedRecordingSnapshot, RecordingSnapshot } from '~/types'

export const insightsTelemetry: ReplayTelemetry = {
    capture: (event, properties) => insights.capture(event, properties),
    captureException: (error, properties) => insights.captureException(error, properties),
}

const createBrowserDecompressor = (insightsInstance?: Insights): SnappyDecompressor => {
    return async (block: Uint8Array): Promise<Uint8Array> => {
        const workerManager = getDecompressionWorkerManager(insightsInstance)
        return workerManager.decompress(block)
    }
}

export const parseEncodedSnapshots = async (
    items: (RecordingSnapshot | EncodedRecordingSnapshot | string)[] | ArrayBuffer | Uint8Array,
    sessionId: string,
    insightsInstance?: Insights,
    registerWindowId?: RegisterWindowIdCallback
): Promise<RecordingSnapshot[]> => {
    return _parseEncodedSnapshots(
        items,
        sessionId,
        insightsTelemetry,
        registerWindowId,
        createBrowserDecompressor(insightsInstance)
    )
}
