import { BaseRedis } from './base-adapter'

/**
 * Integration tests for the Base-backed Redis adapter. These run against a
 * REAL in-process SQLite engine (node:sqlite, `:memory:`), not a mock, and
 * assert ioredis wire-compatible behavior for every method insights uses.
 */
describe('BaseRedis (base-adapter)', () => {
    let r: BaseRedis

    beforeEach(() => {
        r = new BaseRedis(':memory:', { vacuumIntervalMs: 0 })
    })

    afterEach(async () => {
        await r.quit()
    })

    describe('strings + TTL', () => {
        it('get/set round-trips', async () => {
            expect(await r.get('a')).toBeNull()
            expect(await r.set('a', 'hello')).toBe('OK')
            expect(await r.get('a')).toBe('hello')
        })

        it('set NX only sets when absent', async () => {
            expect(await r.set('k', 'v1', 'NX')).toBe('OK')
            expect(await r.set('k', 'v2', 'NX')).toBeNull()
            expect(await r.get('k')).toBe('v1')
        })

        it('set XX only sets when present', async () => {
            expect(await r.set('k', 'v', 'XX')).toBeNull()
            await r.set('k', 'v1')
            expect(await r.set('k', 'v2', 'XX')).toBe('OK')
            expect(await r.get('k')).toBe('v2')
        })

        it('setex + ttl + lazy expiry', async () => {
            await r.setex('k', 100, 'v')
            const ttl = await r.ttl('k')
            expect(ttl).toBeGreaterThan(95)
            expect(ttl).toBeLessThanOrEqual(100)
            expect(await r.get('k')).toBe('v')
        })

        it('EX expiry removes value on read (lazy expire)', async () => {
            // expire in the past via direct PX of 1ms then wait a tick
            await r.set('k', 'v', 'PX', 1)
            await new Promise((res) => setTimeout(res, 5))
            expect(await r.get('k')).toBeNull()
            expect(await r.exists('k')).toBe(0)
        })

        it('ttl semantics: -2 missing, -1 no-ttl', async () => {
            expect(await r.ttl('missing')).toBe(-2)
            await r.set('k', 'v')
            expect(await r.ttl('k')).toBe(-1)
        })

        it('setnx returns 1/0', async () => {
            expect(await r.setnx('k', 'v')).toBe(1)
            expect(await r.setnx('k', 'v2')).toBe(0)
        })

        it('getset returns previous', async () => {
            expect(await r.getset('k', 'a')).toBeNull()
            expect(await r.getset('k', 'b')).toBe('a')
            expect(await r.get('k')).toBe('b')
        })

        it('del + exists', async () => {
            await r.set('a', '1')
            await r.set('b', '2')
            expect(await r.exists('a', 'b')).toBe(2)
            expect(await r.del('a', 'b')).toBe(2)
            expect(await r.exists('a', 'b')).toBe(0)
        })

        it('mget preserves order with nulls', async () => {
            await r.set('a', '1')
            await r.set('c', '3')
            expect(await r.mget('a', 'b', 'c')).toEqual(['1', null, '3'])
        })

        it('keys with glob', async () => {
            await r.set('user:1', 'x')
            await r.set('user:2', 'x')
            await r.set('post:1', 'x')
            expect((await r.keys('user:*')).sort()).toEqual(['user:1', 'user:2'])
        })
    })

    describe('counters (atomic)', () => {
        it('incr/incrby/decr', async () => {
            expect(await r.incr('c')).toBe(1)
            expect(await r.incr('c')).toBe(2)
            expect(await r.incrby('c', 5)).toBe(7)
            expect(await r.decr('c')).toBe(6)
        })

        it('concurrent incr is serialized', async () => {
            await Promise.all(Array.from({ length: 50 }, () => r.incr('c')))
            expect(await r.get('c')).toBe('50')
        })
    })

    describe('hashes', () => {
        it('hset/hget/hgetall/hdel', async () => {
            expect(await r.hset('h', 'f1', 'v1', 'f2', 'v2')).toBe(2)
            expect(await r.hget('h', 'f1')).toBe('v1')
            expect(await r.hgetall('h')).toEqual({ f1: 'v1', f2: 'v2' })
            expect(await r.hdel('h', 'f1')).toBe(1)
            expect(await r.hget('h', 'f1')).toBeNull()
        })
    })

    describe('sorted sets', () => {
        it('zadd/zrangebyscore/zrange/zrem', async () => {
            await r.zadd('z', 1, 'a', 3, 'c', 2, 'b')
            expect(await r.zrange('z', 0, -1)).toEqual(['a', 'b', 'c'])
            expect(await r.zrangebyscore('z', 2, 3)).toEqual(['b', 'c'])
            expect(await r.zrangebyscore('z', '-inf', '+inf')).toEqual(['a', 'b', 'c'])
            expect(await r.zrem('z', 'b')).toBe(1)
            expect(await r.zrange('z', 0, -1)).toEqual(['a', 'c'])
        })
    })

    describe('sets', () => {
        it('sadd/smembers/scard/sismember/srem', async () => {
            expect(await r.sadd('s', 'a', 'b', 'a')).toBe(2)
            expect((await r.smembers('s')).sort()).toEqual(['a', 'b'])
            expect(await r.scard('s')).toBe(2)
            expect(await r.sismember('s', 'a')).toBe(1)
            expect(await r.sismember('s', 'z')).toBe(0)
            expect(await r.srem('s', 'a')).toBe(1)
            expect(await r.scard('s')).toBe(1)
        })
    })

    describe('pipeline', () => {
        it('queues and execs in order with [err, result] tuples', async () => {
            const res = await r.pipeline().set('a', '1').incr('a').get('a').exec()
            expect(res).toEqual([
                [null, 'OK'],
                [null, 2],
                [null, '2'],
            ])
        })
    })

    describe('token bucket rate limiter', () => {
        it('fills then deducts, returns [before, after]', async () => {
            const now = Math.floor(Date.now() / 1000)
            // first call fills to poolMax=10, costs 3 → [10, 7]
            expect(await r.checkRateLimit('rl', now, 3, 10, 1, 60)).toEqual([10, 7])
            // same second, no refill, costs 3 → [7, 4]
            expect(await r.checkRateLimit('rl', now, 3, 10, 1, 60)).toEqual([7, 4])
        })

        it('refills over time at fillRate', async () => {
            const now = Math.floor(Date.now() / 1000)
            await r.checkRateLimit('rl', now, 10, 10, 1, 60) // drains to 0
            // 5 seconds later at fillRate 1 → 5 tokens available, cost 2 → [5, 3]
            expect(await r.checkRateLimit('rl', now + 5, 2, 10, 1, 60)).toEqual([5, 3])
        })

        it('returns -1 after when over budget', async () => {
            const now = Math.floor(Date.now() / 1000)
            const [, after] = await r.checkRateLimit('rl', now, 100, 10, 1, 60)
            expect(after).toBe(-1)
        })
    })

    describe('control', () => {
        it('ping/info', async () => {
            expect(await r.ping()).toBe('PONG')
            expect(await r.info()).toContain('base-adapter')
        })
    })
})
