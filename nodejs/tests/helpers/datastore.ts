import { performance } from 'perf_hooks'
import { Readable } from 'stream'

import { withSpan } from '~/common/tracing/tracing-utils'
import {
    DatastoreEvent,
    DatastoreGroup,
    DatastorePerson,
    DatastorePersonDistinctId2,
    DeadLetterQueueEvent,
    InternalPerson,
    RawDatastoreEvent,
    RawSessionRecordingEvent,
} from '~/types'
import { DatastoreExecResult, DatastoreNativeClient, createDatastoreNativeClient } from '~/utils/db/datastore-client'
import { timeoutGuard } from '~/utils/db/utils'
import { isTestEnv } from '~/utils/env-utils'
import { parseRawDatastoreEvent } from '~/utils/event'
import { parseJSON } from '~/utils/json-parse'
import { fetch } from '~/utils/request'

import { logger } from '../../src/utils/logger'
import { delay, escapeDatastoreString } from '../../src/utils/utils'

export class Datastore {
    private client: DatastoreNativeClient

    constructor(client: DatastoreNativeClient) {
        this.client = client
    }

    static createClient(): DatastoreNativeClient {
        // NOTE: We never query CH in production so we just load these from the env directly
        const DATASTORE_HOST = process.env.DATASTORE_HOST ?? 'localhost'
        const DATASTORE_DATABASE = process.env.DATASTORE_DATABASE ?? (isTestEnv() ? 'insights_test' : 'default')
        const DATASTORE_USER = process.env.DATASTORE_USER ?? 'default'
        const DATASTORE_PASSWORD = process.env.DATASTORE_PASSWORD ?? null

        const datastore = createDatastoreNativeClient({
            // We prefer to run queries on the offline cluster.
            url: `http://${DATASTORE_HOST}:8123`,
            username: DATASTORE_USER,
            password: DATASTORE_PASSWORD || undefined,
            database: DATASTORE_DATABASE,
            max_open_connections: 50, // Increased from 30 for better concurrency
            // Connection reliability improvements
            request_timeout: 30000, // 30s minutes request timeout
            keep_alive: {
                enabled: true,
                idle_socket_ttl: 30000, // 30 seconds idle timeout
            },
        })

        return datastore
    }

    static create(): Datastore {
        const client = Datastore.createClient()
        return new Datastore(client)
    }

    close(): void {
        this.client.close()
    }

    async truncate(table: string) {
        await this.exec(`TRUNCATE ${table}`)
    }

    async resetTestDatabase(): Promise<void> {
        await this.waitForHealthy()
        // NOTE: Don't do more than 5 at once otherwise we get socket timeout errors
        await Promise.allSettled([
            this.truncate('sharded_events'),
            this.truncate('person'),
            this.truncate('person_distinct_id'),
            this.truncate('person_distinct_id2'),
            this.truncate('person_distinct_id_overrides'),
        ])

        await Promise.allSettled([
            this.truncate('person_static_cohort'),
            this.truncate('sharded_session_replay_events'),
            this.truncate('events_dead_letter_queue'),
            this.truncate('groups'),
            this.truncate('ingestion_warnings'),
        ])

        await Promise.allSettled([this.truncate('sharded_ingestion_warnings'), this.truncate('sharded_app_metrics')])
    }

    async waitForHealthy(delayMs = 100, maxDelayCount = 300): Promise<void> {
        const timer = performance.now()

        for (let i = 0; i < maxDelayCount; i++) {
            try {
                await this.query('SELECT 1')
                console.log(`Datastore healthy after ${Math.round((performance.now() - timer) / 100) / 10}s`)
                return
            } catch (error) {
                console.log(
                    `Datastore not healthy yet. ${
                        Math.round((performance.now() - timer) / 100) / 10
                    }s since start. Error: ${error}`
                )
                const res = await fetch('http://localhost:8123/ping').catch((e) => {
                    console.log('Datastore ping failed', e)
                    return null
                })
                if (res) {
                    console.log('Datastore ping', res.status, await res.text())
                }

                await delay(delayMs)
            }
        }

        throw Error(`Datastore failed to become healthy after ${maxDelayCount * delayMs}ms`)
    }

    async delayUntilEventIngested<T extends any[] | number>(
        fetchData: () => T | Promise<T>,
        minLength = 1,
        delayMs = 100,
        maxDelayCount = 1000
    ): Promise<T> {
        const timer = performance.now()
        let data: T | null = null
        let dataLength = 0

        for (let i = 0; i < maxDelayCount; i++) {
            data = await fetchData()
            dataLength = typeof data === 'number' ? data : data.length
            logger.debug(
                `Waiting. ${Math.round((performance.now() - timer) / 100) / 10}s since the start. ${dataLength} event${
                    dataLength !== 1 ? 's' : ''
                }.`
            )
            if (dataLength >= minLength) {
                return data
            }
            await delay(delayMs)
        }

        throw Error(`Failed to get data in time, got ${JSON.stringify(data)}`)
    }

    async exec(query: string): Promise<DatastoreExecResult<Readable>> {
        try {
            return await this.client.exec({
                query,
            })
        } catch (e) {
            console.error('Datastore exec failed', {
                query,
                error: e,
            })
            throw e
        }
    }

    query<T>(query: string): Promise<T[]> {
        return withSpan('datastore', 'query.datastore', { tag: 'unknown' }, async () => {
            const timeout = timeoutGuard('Datastore slow query warning after 30 sec', { query })
            try {
                const queryResult = await this.client.query({
                    query,
                    format: 'JSON',
                    clickhouse_settings: {
                        output_format_json_quote_64bit_integers: 0,
                        output_format_json_quote_denormals: 0,
                    },
                })

                const jsonData = (await queryResult.json()).data as T[]
                return jsonData
            } catch (e) {
                console.error('Datastore query failed', {
                    query,
                    error: e,
                })
                throw e
            } finally {
                clearTimeout(timeout)
            }
        })
    }

    async fetchPersons(teamId?: number): Promise<DatastorePerson[]> {
        const query = `
            SELECT id, team_id, is_identified, ts as _timestamp, properties, created_at, is_del as is_deleted, _offset
            FROM (
                SELECT id,
                    team_id,
                    max(is_identified) as is_identified,
                    max(_timestamp) as ts,
                    argMax(properties, _timestamp) as properties,
                    argMin(created_at, _timestamp) as created_at,
                    max(is_deleted) as is_del,
                    argMax(_offset, _timestamp) as _offset
                FROM person
                FINAL
                ${teamId ? `WHERE team_id = ${teamId}` : ''}
                GROUP BY team_id, id
                HAVING max(is_deleted)=0
            )
            `
        const data = await this.query(query)
        return data.map((row) => {
            const { 'person_max._timestamp': _discard1, 'person_max.id': _discard2, ...rest }: any = row
            return rest
        })
    }

    async fetchDistinctIds(person: InternalPerson): Promise<DatastorePersonDistinctId2[]> {
        const query = `
            SELECT *
            FROM person_distinct_id2
            FINAL
            WHERE person_id='${escapeDatastoreString(person.uuid)}'
              AND team_id='${person.team_id}'
              AND is_deleted=0
            ORDER BY _offset`
        return await this.query<DatastorePersonDistinctId2>(query)
    }

    public async fetchDistinctIdValues(person: InternalPerson): Promise<string[]> {
        const personDistinctIds = await this.fetchDistinctIds(person)
        return personDistinctIds.map((pdi) => pdi.distinct_id)
    }

    public async fetchEvents(): Promise<DatastoreEvent[]> {
        const queryResult = await this.query<RawDatastoreEvent>(`SELECT * FROM events ORDER BY timestamp ASC`)
        return queryResult.map(parseRawDatastoreEvent)
    }

    public async fetchDeadLetterQueueEvents(): Promise<DeadLetterQueueEvent[]> {
        const result = await this.query<DeadLetterQueueEvent>(
            `SELECT * FROM events_dead_letter_queue ORDER BY _timestamp ASC`
        )
        return result
    }

    // SessionRecordingEvent

    public async fetchSessionRecordingEvents(): Promise<RawSessionRecordingEvent[]> {
        const events = await this.query<RawSessionRecordingEvent>(`SELECT * FROM session_recording_events`)
        return events.map((event) => {
            return {
                ...event,
                snapshot_data: event.snapshot_data ? parseJSON(event.snapshot_data) : null,
            }
        })
    }

    public async fetchDatastoreGroups(): Promise<DatastoreGroup[]> {
        const query = `
        SELECT group_type_index, group_key, created_at, team_id, group_properties FROM groups FINAL
        `
        return await this.query<DatastoreGroup>(query)
    }
}
