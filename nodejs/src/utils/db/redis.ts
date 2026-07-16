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
 * Backend selection — strangle seam.
 *
 * The default backend is Base (embedded SQLite via the base-adapter). The
 * legacy ioredis transport stays reachable ONLY when a `redis://` / `rediss://`
 * URL is configured AND `INSIGHTS_REDIS_BACKEND` is not `base`. This is the
 * single place transport is chosen; every call-site is transport-agnostic.
 */
function useBaseBackend(url: string): boolean {
    const backend = (process.env.INSIGHTS_REDIS_BACKEND || 'auto').toLowerCase()
    if (backend === 'redis') {
        return false
    }
    if (backend === 'base') {
        return true
    }
    // 'auto' (default): speak RESP to a real, shared endpoint — Hanzo KV, configured
    // via KV_URL and normalized to the redis:// wire. Fall back to the embedded Base
    // (per-pod SQLite) only for localhost / unconfigured targets, i.e. local dev.
    // Hanzo KV is the canonical shared backend in the cluster (scalable across pods,
    // and it serves RESP pub/sub natively); Base cannot fan pub/sub across pods.
    const target = url || ''
    const isLocal = target === '' || target.includes('127.0.0.1') || target.includes('localhost')
    if (!isLocal && (target.startsWith('redis://') || target.startsWith('rediss://'))) {
        return false
    }
    return true
}

/**
 * Configuration for a Redis connection.
 * Consumers should build this config inline where they create Redis connections,
 * rather than relying on centralized builder functions.
 */
export interface RedisConnectionConfig {
    url: string
    options?: RedisOptions
    name?: string
    /**
     * Force a specific transport for this pool, overriding INSIGHTS_REDIS_BACKEND.
     * Pub/Sub MUST set `forceBackend: 'redis'` because it is cross-process and
     * the Base adapter cannot fan messages across worker pods.
     */
    forceBackend?: 'base' | 'redis'
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
    if (config.forceBackend === 'redis') {
        return createRedisClient(config.url, config.options, config.name)
    }
    if (config.forceBackend === 'base' || useBaseBackend(config.url)) {
        const scope = baseScopeFromUrl(config.url)
        if (process.env.NODE_ENV !== 'test') {
            logger.info('✅', `[base-adapter] ${config.name ?? 'redis'} backed by Base`, { scope })
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
