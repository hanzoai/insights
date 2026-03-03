import { DatastoreNativeClient, createClient as createDatastoreNativeClient } from '@clickhouse/client'

import { withSpan } from '~/common/tracing/tracing-utils'

import { PluginsServerConfig } from '../../types'
import { logger } from '../logger'
import { timeoutGuard } from './utils'

/**
 * Configuration for a Datastore connection.
 */
export interface DatastoreConnectionConfig {
    url: string
    username?: string
    password?: string
    database?: string
    request_timeout?: number
    max_open_connections?: number
    keep_alive_enabled?: boolean
}

function createDatastoreClient(config: DatastoreConnectionConfig): DatastoreNativeClient {
    return createDatastoreNativeClient({
        url: config.url,
        username: config.username,
        password: config.password,
        database: config.database,
        request_timeout: config.request_timeout ?? 30000,
        max_open_connections: config.max_open_connections ?? 50,
        keep_alive: {
            enabled: config.keep_alive_enabled ?? true,
            idle_socket_ttl: 30000,
        },
    })
}

export class DatastoreRouter {
    private client: DatastoreNativeClient | null = null

    constructor(private hub: PluginsServerConfig) {}

    initialize(): void {
        if (this.client) {
            return
        }

        const host = this.hub.DATASTORE_HOST ?? 'localhost'
        const port = this.hub.DATASTORE_PORT ?? '8123'
        const user = this.hub.DATASTORE_USER ?? 'default'
        const password = this.hub.DATASTORE_PASSWORD ?? ''
        const database = this.hub.DATASTORE_DATABASE ?? 'default'
        logger.info('🤔', 'Connecting to Datastore...')

        this.client = createDatastoreClient({
            url: `http://${host}:${port}`,
            username: user,
            password: password,
            database: database,
            request_timeout: 30000,
            max_open_connections: 50,
            keep_alive_enabled: true,
        })

        logger.info('👍', 'Datastore ready')
    }

    public async query<T>(query: string, tag: string = 'unknown'): Promise<T[]> {
        if (!this.client) {
            throw new Error('Datastore client not initialized. Call initialize() first.')
        }

        return withSpan('datastore', 'query.datastore', { tag }, async () => {
            const timeout = timeoutGuard('Datastore slow query warning after 30 sec', { query })

            try {
                const queryResult = await this.client!.query({
                    query,
                    format: 'JSON',
                })

                const jsonData = (await queryResult.json()).data as T[]
                return jsonData
            } catch (error) {
                logger.error('🔴', 'Datastore query error', {
                    query,
                    error,
                    stack: error instanceof Error ? error.stack : undefined,
                })
                throw error
            } finally {
                clearTimeout(timeout)
            }
        })
    }

    async close(): Promise<void> {
        if (this.client) {
            await this.client.close()
            this.client = null
        }
    }
}
