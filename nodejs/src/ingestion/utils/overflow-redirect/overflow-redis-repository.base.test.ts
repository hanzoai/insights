import { createRedisPoolFromConfig } from '../../../utils/db/redis'
import { RedisOverflowRepository } from './overflow-redis-repository'

/**
 * End-to-end seam test: the overflow repository against a REAL Base-backed
 * pool (the production code path with INSIGHTS_KV_BACKEND defaulting to
 * Base). No live Redis. Proves mget / pipeline.set EX / getex / ping all flow
 * through the base-adapter unchanged.
 */
describe('RedisOverflowRepository over Base adapter', () => {
    const pool = createRedisPoolFromConfig({
        connection: { url: ':memory:', name: 'overflow-base-test', forceBackend: 'base' },
        poolMinSize: 1,
        poolMaxSize: 1,
    })

    const repo = new RedisOverflowRepository({ redisPool: pool, redisTTLSeconds: 300 })

    afterAll(async () => {
        await pool.drain()
        await pool.clear()
    })

    it('flags, checks, and refreshes TTL through Base', async () => {
        const keys = [
            { token: 't1', distinctId: 'd1' },
            { token: 't2', distinctId: 'd2' },
        ]

        // nothing flagged yet
        let result = await repo.batchCheck('events', keys)
        expect(result.get('t1:d1')).toBe(false)
        expect(result.get('t2:d2')).toBe(false)

        // flag both
        await repo.batchFlag('events', keys)

        result = await repo.batchCheck('events', keys)
        expect(result.get('t1:d1')).toBe(true)
        expect(result.get('t2:d2')).toBe(true)

        // refresh TTL does not throw and keeps them flagged
        await repo.batchRefreshTTL('events', keys)
        result = await repo.batchCheck('events', keys)
        expect(result.get('t1:d1')).toBe(true)
    })

    it('health check pings Base successfully', async () => {
        const health = await repo.healthCheck()
        expect(health.status).toBe('ok')
    })
})
