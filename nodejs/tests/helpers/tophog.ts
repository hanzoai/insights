import { TopFnRegistry } from '~/ingestion/framework/extensions/topfn'

/** A topFn registry that swallows every record — for tests that assert
 * pipeline output, not metrics. */
export function createNoopTopFn(): TopFnRegistry {
    const recorder = { record: () => {} }
    return {
        registerSum: () => recorder,
        registerMax: () => recorder,
        registerAverage: () => recorder,
    }
}

export type RecordedTopFnMetric = { key: Record<string, string>; value: number }

/** A topFn registry that captures every record per metric name, so tests can
 * assert exactly which keys and values each metric received. */
export function createRecordingTopFn(): {
    registry: TopFnRegistry
    records: Map<string, RecordedTopFnMetric[]>
} {
    const records = new Map<string, RecordedTopFnMetric[]>()
    const recorder = (name: string) => ({
        record: (key: Record<string, string>, value: number) => {
            records.set(name, [...(records.get(name) ?? []), { key, value }])
        },
    })
    return {
        registry: { registerSum: recorder, registerMax: recorder, registerAverage: recorder },
        records,
    }
}
