import { DateTime } from 'luxon'

import { KAFKA_FN_INVOCATION_RESULTS } from '~/common/config/kafka-topics'
import { KafkaProducerWrapper } from '~/common/kafka/producer'
import { Datastore } from '~/tests/helpers/datastore'
import { waitForExpect } from '~/tests/helpers/expectations'

// `~/common/kafka/producer` is auto-mocked in these tests; use the real wrapper to push probe rows.
const ActualKafkaProducerWrapper: typeof KafkaProducerWrapper =
    jest.requireActual('~/common/kafka/producer').KafkaProducerWrapper

/**
 * Probe hog_invocation_results until a row lands, proving the Datastore Kafka engine's consumer has
 * attached. Its `auto.offset.reset=latest` drops rows produced before attach, so a seed right after
 * topic (re)creation can lose rows and never satisfy a count poll. Mirrors waitForDatastoreKafkaConsumer.
 */
export const waitForHogInvocationResultsMvReady = async (datastore: Datastore): Promise<void> => {
    const producer = await ActualKafkaProducerWrapper.create(undefined)
    const probeTeamId = -999_999
    try {
        await waitForExpect(async () => {
            await producer.queueMessages({
                topic: KAFKA_FN_INVOCATION_RESULTS,
                messages: [
                    {
                        key: 'probe',
                        value: JSON.stringify({
                            team_id: probeTeamId,
                            function_kind: 'insights_function',
                            function_id: 'probe',
                            invocation_id: 'probe',
                            parent_run_id: '',
                            status: 'running',
                            attempts: 0,
                            is_retry: 0,
                            scheduled_at: DateTime.utc().toFormat("yyyy-MM-dd HH:mm:ss.SSS'000'"),
                            started_at: null,
                            finished_at: null,
                            duration_ms: null,
                            error_kind: '',
                            error_message: '',
                            event_uuid: '',
                            distinct_id: '',
                            person_id: '',
                            invocation_globals: '{}',
                            version: String(BigInt(Date.now()) * 1000n),
                            is_deleted: 0,
                        }),
                    },
                ],
            })
            await producer.flush()

            const result = await datastore.query<{ c: number }>(
                `SELECT count() AS c FROM hog_invocation_results WHERE team_id = ${probeTeamId}`
            )
            expect(Number(result[0]?.c ?? 0)).toBeGreaterThan(0)
        }, 30_000)
    } finally {
        await producer.disconnect()
    }
}
