import {
    APP_METRICS_OUTPUT,
    DLQ_OUTPUT,
    EVENTS_OUTPUT,
    INGESTION_WARNINGS_OUTPUT,
    LOG_ENTRIES_OUTPUT,
    OVERFLOW_OUTPUT,
    TOPFN_OUTPUT,
} from '~/common/outputs'
import { IngestionOutputsBuilder } from '~/common/outputs/ingestion-outputs-builder'

/** Register all error tracking outputs on the builder. Call `.build(registry, config)` to resolve. */
export function createOutputsRegistry() {
    return new IngestionOutputsBuilder()
        .register(EVENTS_OUTPUT, {
            topicKey: 'ERROR_TRACKING_CONSUMER_OUTPUT_TOPIC',
            producerKey: 'ERROR_TRACKING_OUTPUT_EVENTS_PRODUCER',
        })
        .register(INGESTION_WARNINGS_OUTPUT, {
            topicKey: 'ERROR_TRACKING_OUTPUT_INGESTION_WARNINGS_TOPIC',
            producerKey: 'ERROR_TRACKING_OUTPUT_INGESTION_WARNINGS_PRODUCER',
        })
        .register(DLQ_OUTPUT, {
            topicKey: 'ERROR_TRACKING_CONSUMER_DLQ_TOPIC',
            producerKey: 'ERROR_TRACKING_OUTPUT_DLQ_PRODUCER',
        })
        .register(OVERFLOW_OUTPUT, {
            topicKey: 'ERROR_TRACKING_CONSUMER_OVERFLOW_TOPIC',
            producerKey: 'ERROR_TRACKING_OUTPUT_OVERFLOW_PRODUCER',
        })
        .register(APP_METRICS_OUTPUT, {
            topicKey: 'ERROR_TRACKING_OUTPUT_APP_METRICS_TOPIC',
            producerKey: 'ERROR_TRACKING_OUTPUT_APP_METRICS_PRODUCER',
        })
        .register(LOG_ENTRIES_OUTPUT, {
            topicKey: 'ERROR_TRACKING_OUTPUT_LOG_ENTRIES_TOPIC',
            producerKey: 'ERROR_TRACKING_OUTPUT_LOG_ENTRIES_PRODUCER',
        })
        .register(TOPFN_OUTPUT, {
            topicKey: 'ERROR_TRACKING_OUTPUT_TOPFN_TOPIC',
            producerKey: 'ERROR_TRACKING_OUTPUT_TOPFN_PRODUCER',
        })
}
