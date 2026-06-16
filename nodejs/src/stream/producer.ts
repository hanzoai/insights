import {
    ClientMetrics,
    HighLevelProducer,
    LibrdKafkaError,
    MessageHeader,
    MessageValue,
    NumberNullUndefined,
    ProducerGlobalConfig,
    MessageKey as RdStreamMessageKey,
} from 'node-rdkafka'
import { hostname } from 'os'
import { Counter, Summary } from 'prom-client'

import { DependencyUnavailableError, MessageSizeTooLarge } from '../utils/db/error'
import { logger } from '../utils/logger'
import { StreamConfigTarget, getStreamConfigFromEnv } from './config'

/** This class is a wrapper around the rdstream producer, and does very little.
 *
 * The big difference between this and the original is that we return a promise from
 * queueMessage, which will only resolve once we get an ack that the message has
 * been persisted to stream. So we should get stronger guarantees on processing.
 *
 * TODO: refactor stream producer usage to use rdkafka directly.
 */

export type MessageKey = Exclude<RdStreamMessageKey, undefined>

export type TopicMessage = {
    topic: string
    messages: {
        value: string | Buffer | null
        key?: MessageKey
        headers?: Record<string, string>
    }[]
}

export class StreamProducerWrapper {
    /** Stream producer used for syncing Postgres and datastore person data. */
    private producer: HighLevelProducer

    static async create(streamClientRack: string | undefined, mode: StreamConfigTarget = 'PRODUCER') {
        // NOTE: In addition to some defaults we allow overriding any setting via env vars.
        // This makes it much easier to react to issues without needing code changes

        const producerConfig: ProducerGlobalConfig = {
            // Defaults that could be overridden by env vars
            'client.id': hostname(),
            'client.rack': streamClientRack,
            'metadata.broker.list': 'stream:9092',
            'linger.ms': 20,
            log_level: 4, // WARN as the default
            'batch.size': 8 * 1024 * 1024,
            'queue.buffering.max.messages': 100_000,
            'compression.codec': 'snappy',
            'enable.idempotence': true,
            'metadata.max.age.ms': 30000, // Refresh metadata every 30s
            'retry.backoff.ms': 500, // Backoff between retry attempts
            'socket.timeout.ms': 30000, // Timeout for socket operations
            'max.in.flight.requests.per.connection': 5, // Required for idempotence ordering
            ...getStreamConfigFromEnv(mode),
            dr_cb: true,
        }

        logger.info('📝', 'librdkafka producer config', { config: producerConfig })

        const producer = new HighLevelProducer(producerConfig)

        producer.on('event.log', function (log) {
            logger.info('📝', 'librdkafka log', { log: log })
        })

        producer.on('event.error', function (err) {
            logger.error('📝', 'librdkafka error', { log: err })
        })

        await new Promise((resolve, reject) =>
            producer.connect(undefined, (error, data) => {
                if (error) {
                    logger.error('⚠️', 'connect_error', { error: error })
                    reject(error)
                } else {
                    logger.info('📝', 'librdkafka producer connected', { error, brokers: data?.brokers })
                    resolve(data)
                }
            })
        )

        return new StreamProducerWrapper(producer)
    }

    constructor(producer: HighLevelProducer) {
        this.producer = producer
    }

    async produce({
        value,
        key,
        topic,
        headers,
    }: {
        value: MessageValue
        key: MessageKey
        topic: string
        headers?: Record<string, string>
    }): Promise<void> {
        try {
            const produceTimer = ingestEventStreamProduceLatency.labels({ topic }).startTimer()
            streamProducerMessagesQueuedCounter.labels({ topic_name: topic }).inc()
            logger.debug('📤', 'Producing message', { topic: topic })

            // NOTE: The MessageHeader type is super weird. Essentially you are passing in a record and it expects a string key and a string or buffer value.
            const streamHeaders: MessageHeader[] =
                Object.entries(headers ?? {}).map(([key, value]) => ({
                    [key]: value,
                })) ?? []

            const result = await new Promise((resolve, reject) => {
                this.producer.produce(
                    topic,
                    null,
                    value,
                    key,
                    Date.now(),
                    streamHeaders,
                    (error: any, offset: NumberNullUndefined) => {
                        return error ? reject(error) : resolve(offset)
                    }
                )
            })

            streamProducerMessagesWrittenCounter.labels({ topic_name: topic }).inc()
            logger.debug('📤', 'Produced message', { topic: topic, offset: result })
            produceTimer()
        } catch (error) {
            streamProducerMessagesFailedCounter.labels({ topic_name: topic }).inc()
            logger.error('⚠️', 'stream_produce_error', {
                error: typeof error?.message === 'string' ? error.message : JSON.stringify(error),
                topic: topic,
            })

            if ((error as LibrdKafkaError).isRetriable) {
                // If we get a retriable error, bubble that up so that the
                // caller can retry.
                throw new DependencyUnavailableError(error.message, 'Stream', error)
            } else if ((error as LibrdKafkaError).code === 10) {
                throw new MessageSizeTooLarge(error.message, error)
            }

            throw error
        }
    }

    /**
     * Currently this produces messages in parallel.
     * If ordering is required then you should use the `produce` method instead in an awaited loop.
     */
    async queueMessages(topicMessages: TopicMessage | TopicMessage[]): Promise<void> {
        topicMessages = Array.isArray(topicMessages) ? topicMessages : [topicMessages]

        await Promise.all(
            topicMessages.map((record) => {
                return Promise.all(
                    record.messages.map((message) =>
                        this.produce({
                            topic: record.topic,
                            key: message.key ? Buffer.from(message.key) : null,
                            value: message.value ? Buffer.from(message.value) : null,
                            headers: message.headers,
                        })
                    )
                )
            })
        )
    }

    public async flush() {
        logger.debug('📤', 'flushing_producer')

        return await new Promise((resolve, reject) =>
            this.producer.flush(10000, (error) => {
                logger.debug('📤', 'flushed_producer')
                if (error) {
                    reject(error)
                } else {
                    resolve(null)
                }
            })
        )
    }

    public async disconnect(): Promise<void> {
        logger.info('🔌', 'Disconnecting producer. Flushing...')
        await this.flush()

        logger.info('🔌', 'Disconnecting producer. Disconnecting...')
        await new Promise<ClientMetrics>((resolve, reject) =>
            this.producer.disconnect((error: any, data: ClientMetrics) => {
                logger.info('🔌', 'Disconnected producer')
                if (error) {
                    reject(error)
                } else {
                    resolve(data)
                }
            })
        )
    }
}

export const streamProducerMessagesQueuedCounter = new Counter({
    name: 'stream_producer_messages_queued_total',
    help: 'Count of messages queued to the Stream producer, by destination topic.',
    labelNames: ['topic_name'],
})

export const streamProducerMessagesWrittenCounter = new Counter({
    name: 'stream_producer_messages_written_total',
    help: 'Count of messages written to stream, by destination topic.',
    labelNames: ['topic_name'],
})

export const streamProducerMessagesFailedCounter = new Counter({
    name: 'stream_producer_messages_failed_total',
    help: 'Count of write failures by the Stream producer, by destination topic.',
    labelNames: ['topic_name'],
})

export const ingestEventStreamProduceLatency = new Summary({
    name: 'ingest_event_stream_produce_latency',
    help: 'Wait time for individual stream produces',
    labelNames: ['topic'],
    percentiles: [0.5, 0.9, 0.95, 0.99],
})
