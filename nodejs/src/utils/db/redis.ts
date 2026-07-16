import { createPool } from 'generic-pool'
import Redis, { RedisOptions } from 'ioredis'

import { BaseRedis, baseScopeFromUrl } from '../../common/redis/base-adapter'
import { RedisPool } from '../../types'
import { logger } from '../../utils/logger'
import { killGracefully } from '../../utils/utils'
import { captureException } from '../insights'

/** Number of Redis error events until the server is killed gracefully. */
const REDIS_ERROR_COUNTER_LIMIT = 10

/**
 * A shared Hanzo KV endpoint is a real, non-local RESP URL (KV_URL normalized
 * in config). Localhost / empty means "no shared KV" — KV is OPTIONAL and the
 * embedded Base (SQLite) backend carries everything per-pod. This is the ONE
 * definition of "is KV configured"; pub/sub pool creation keys off it too.
 */
export function isSharedKv(url: string | undefined): boolean {
    const target = url || ''
    const isLocal = target === '' || target.includes('127.0.0.1') || target.includes('localhost')
    return !isLocal && (target.startsWith('redis://') || target.startsWith('rediss://'))
}

/**
 * Backend selection — strangle seam.
 *
 * The default backend is Base (embedded SQLite via the base-adapter). The RESP
 * transport (Hanzo KV) is used ONLY when a shared KV endpoint is configured via
 * KV_URL AND `INSIGHTS_KV_BACKEND` is not `base`. This is the single place
 * transport is chosen; every call-site is transport-agnostic.
 */
function useBaseBackend(url: string): boolean {
    const backend = (process.env.INSIGHTS_KV_BACKEND || 'auto').toLowerCase()
    if (backend === 'resp') {
        return false
    }
    if (backend === 'base') {
        return true
    }
    // 'auto' (default): speak RESP to the shared Hanzo KV (scalable across pods,
    // native RESP pub/sub) whenever one is configured; embedded Base otherwise.
    return !isSharedKv(url)
}

/**
 * Configuration for a KV connection.
 * Consumers should build this config inline where they create KV connections,
 * rather than relying on centralized builder functions.
 */
export interface RedisConnectionConfig {
    url: string
    options?: RedisOptions
    name?: string
    /**
     * Force a specific transport for this pool, overriding INSIGHTS_KV_BACKEND.
     * Cross-process pools (pub/sub) MUST set `forceBackend: 'resp'` because the
     * Base adapter cannot fan messages across worker pods.
     */
    forceBackend?: 'base' | 'resp'
}

/**
 * Configuration needed to create Redis pool instances.
 */
export interface RedisPoolConfig {
    connection: RedisConnectionConfig
    poolMinSize: number
    poolMaxSize: number
}

export async function createRedisFromConfig(config: RedisConnectionConfig): Promise<Redis.Redis> {
    if (config.forceBackend === 'resp') {
        return createRedisClient(config.url, config.options, config.name)
    }
    if (config.forceBackend === 'base' || useBaseBackend(config.url)) {
        const scope = baseScopeFromUrl(config.url)
        if (process.env.NODE_ENV !== 'test') {
            logger.info('✅', `[base-adapter] ${config.name ?? 'kv'} backed by Base`, { scope })
        }
        // The base-adapter implements the ioredis subset insights uses. This is
        // the single deliberate cast at the strangle seam; it is removed when
        // call-sites are inlined onto Base collection calls directly.
        return new BaseRedis(scope) as unknown as Redis.Redis
    }
    return createRedisClient(config.url, config.options, config.name)
}

export function createRedisPoolFromConfig(config: RedisPoolConfig): RedisPool {
    return createPool<Redis.Redis>(
        {
            create: () => createRedisFromConfig(config.connection),
            destroy: async (client) => {
                await client.quit()
            },
        },
        {
            min: config.poolMinSize,
            max: config.poolMaxSize,
            autostart: true,
        }
    )
}

/**
 * Sanitizes a Redis URL for safe logging by extracting only the host portion.
 * This prevents leaking credentials that may be embedded in the URL.
 */
function getRedisHost(url: string, options?: RedisOptions): string {
    try {
        const parsed = new URL(url)
        return parsed.host || '[sanitized-redis-host]'
    } catch {
        const atIndex = url.lastIndexOf('@')
        const hostname = atIndex >= 0 ? url.substring(atIndex + 1) : url
        if (options?.port && !hostname.includes(':')) {
            return `${hostname}:${options.port}`
        }
        return hostname
    }
}

export async function createRedisClient(
    url: string,
    options?: RedisOptions,
    connectionName?: string
): Promise<Redis.Redis> {
    const redis = new Redis(url, {
        ...options,
        maxRetriesPerRequest: -1,
    })
    let errorCounter = 0
    const redisHost = getRedisHost(url, options)
    const connectionId = connectionName ? `[${connectionName}] ` : ''
    const creationStack = new Error().stack
    redis
        .on('error', (error) => {
            errorCounter++
            captureException(error)
            if (errorCounter > REDIS_ERROR_COUNTER_LIMIT) {
                logger.error(
                    '😡',
                    `${connectionId}Redis error encountered! host: ${redisHost} Enough of this, I quit!`,
                    { error, creationStack }
                )
                killGracefully()
            } else {
                logger.error(
                    '🔴',
                    `${connectionId}Redis error encountered! host: ${redisHost} Trying to reconnect...`,
                    { error, creationStack }
                )
            }
        })
        .on('ready', () => {
            if (process.env.NODE_ENV !== 'test') {
                logger.info('✅', `${connectionId}Connected to Redis!`, redisHost)
            }
        })
    await redis.info()
    return redis
}
