/* eslint-disable @typescript-eslint/require-await --
 * This adapter implements the ioredis interface, whose methods all return
 * Promises, over the synchronous node:sqlite engine. The method bodies are
 * intentionally synchronous; `async` is required for wire compatibility so
 * call-sites can `await` exactly as they did against ioredis. */
/**
 * base-adapter — Redis-compatible storage backed by Hanzo Base (embedded SQLite).
 *
 * STRANGLE-STAGE TRANSITIONAL LAYER. This adapter exposes the same method
 * surface that insights uses from `ioredis` (get/set/del/exists/expire/ttl/
 * incr/hset/zadd/pipeline/…) but persists to a Base instance instead of Redis.
 * It exists so existing call-sites keep working unchanged while we cut Redis
 * out. The end state is INLINED Base collection calls at every call-site and
 * the DELETION of this file. Tracking issue: hanzoai/insights#redis-to-base.
 *
 * Storage model — Base collection conventions over `node:sqlite`:
 *   - One SQLite file per tenant scope (per-org / per-service), Base's
 *     "one instance per project" multi-tenancy model. The `scope` is the
 *     Base instance key; a single `kv` collection (table) holds every record.
 *   - Each record is `{ key, field, value, score, position, expires_at }`,
 *     covering string/hash/sorted-set/list shapes in one orthogonal schema.
 *   - TTL is an `expires_at` epoch-ms column with lazy expiry on read plus a
 *     periodic vacuum. INCR/token-bucket use `BEGIN IMMEDIATE` transactions
 *     for real serializable atomicity (the Lua-script equivalent).
 *
 * Pub/Sub is intentionally NOT implemented here — it is cross-process and maps
 * to Base realtime, handled separately. See pubsub.ts.
 */
import { DatabaseSync, StatementSync } from 'node:sqlite'

/** Wire-compatible subset of ioredis we actually use across insights/src. */
export interface BaseRedisClient {
    get(key: string): Promise<string | null>
    set(key: string, value: string, ...args: (string | number)[]): Promise<'OK' | null>
    setex(key: string, seconds: number, value: string): Promise<'OK'>
    getex(key: string, ...args: (string | number)[]): Promise<string | null>
    setnx(key: string, value: string): Promise<number>
    getset(key: string, value: string): Promise<string | null>
    del(...keys: string[]): Promise<number>
    exists(...keys: string[]): Promise<number>
    expire(key: string, seconds: number): Promise<number>
    ttl(key: string): Promise<number>
    pttl(key: string): Promise<number>
    incr(key: string): Promise<number>
    incrby(key: string, increment: number): Promise<number>
    decr(key: string): Promise<number>
    mget(...keys: string[]): Promise<(string | null)[]>
    keys(pattern: string): Promise<string[]>
    scan(cursor: string | number, ...args: (string | number)[]): Promise<[string, string[]]>
    hset(key: string, ...args: (string | number)[]): Promise<number>
    hget(key: string, field: string): Promise<string | null>
    hgetall(key: string): Promise<Record<string, string>>
    hdel(key: string, ...fields: string[]): Promise<number>
    zadd(key: string, ...args: (string | number)[]): Promise<number>
    zrangebyscore(key: string, min: number | string, max: number | string): Promise<string[]>
    zrange(key: string, start: number, stop: number): Promise<string[]>
    zrem(key: string, ...members: string[]): Promise<number>
    sadd(key: string, ...members: string[]): Promise<number>
    srem(key: string, ...members: string[]): Promise<number>
    smembers(key: string): Promise<string[]>
    scard(key: string): Promise<number>
    sismember(key: string, member: string): Promise<number>
    ping(): Promise<'PONG'>
    info(): Promise<string>
    quit(): Promise<'OK'>
    pipeline(): BasePipeline
    /** Token-bucket rate limiter — Lua equivalent as one BEGIN IMMEDIATE txn. */
    checkRateLimit(
        key: string,
        now: number,
        cost: number,
        poolMax: number,
        fillRate: number,
        expiry: number
    ): Promise<[number, number]>
    checkRateLimitV2(
        key: string,
        now: number,
        cost: number,
        poolMax: number,
        fillRate: number,
        expiry: number
    ): Promise<[number, number]>
}

type PipelineOp = () => Promise<unknown>

/** ioredis pipeline: queue ops, exec returns [err, result] tuples in order. */
export class BasePipeline {
    private ops: PipelineOp[] = []

    constructor(private client: BaseRedisClient) {}

    private queue(op: PipelineOp): this {
        this.ops.push(op)
        return this
    }

    get(key: string): this {
        return this.queue(() => this.client.get(key))
    }
    set(key: string, value: string, ...args: (string | number)[]): this {
        return this.queue(() => this.client.set(key, value, ...args))
    }
    setex(key: string, seconds: number, value: string): this {
        return this.queue(() => this.client.setex(key, seconds, value))
    }
    getex(key: string, ...args: (string | number)[]): this {
        return this.queue(() => this.client.getex(key, ...args))
    }
    del(...keys: string[]): this {
        return this.queue(() => this.client.del(...keys))
    }
    expire(key: string, seconds: number): this {
        return this.queue(() => this.client.expire(key, seconds))
    }
    ttl(key: string): this {
        return this.queue(() => this.client.ttl(key))
    }
    incr(key: string): this {
        return this.queue(() => this.client.incr(key))
    }
    incrby(key: string, increment: number): this {
        return this.queue(() => this.client.incrby(key, increment))
    }
    hset(key: string, ...args: (string | number)[]): this {
        return this.queue(() => this.client.hset(key, ...args))
    }
    hget(key: string, field: string): this {
        return this.queue(() => this.client.hget(key, field))
    }
    sadd(key: string, ...members: string[]): this {
        return this.queue(() => this.client.sadd(key, ...members))
    }
    zadd(key: string, ...args: (string | number)[]): this {
        return this.queue(() => this.client.zadd(key, ...args))
    }
    checkRateLimit(key: string, now: number, cost: number, poolMax: number, fillRate: number, expiry: number): this {
        return this.queue(() => this.client.checkRateLimit(key, now, cost, poolMax, fillRate, expiry))
    }
    checkRateLimitV2(key: string, now: number, cost: number, poolMax: number, fillRate: number, expiry: number): this {
        return this.queue(() => this.client.checkRateLimitV2(key, now, cost, poolMax, fillRate, expiry))
    }

    async exec(): Promise<Array<[Error | null, unknown]>> {
        const results: Array<[Error | null, unknown]> = []
        for (const op of this.ops) {
            try {
                results.push([null, await op()])
            } catch (e) {
                results.push([e instanceof Error ? e : new Error(String(e)), null])
            }
        }
        this.ops = []
        return results
    }
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS kv (
    key         TEXT NOT NULL,
    field       TEXT NOT NULL DEFAULT '',
    value       TEXT,
    score       REAL,
    position    INTEGER,
    expires_at  INTEGER,
    PRIMARY KEY (key, field)
);
CREATE INDEX IF NOT EXISTS idx_kv_expires ON kv (expires_at);
CREATE INDEX IF NOT EXISTS idx_kv_key_score ON kv (key, score);
`

/** Field sentinel for plain string values (no hash field). */
const STRING_FIELD = ''
/** Field prefix marking a set member; member identity lives in `field`. */
const SET_PREFIX = 's:'
/** Field prefix marking a sorted-set member; member in `field`, rank in `score`. */
const ZSET_PREFIX = 'z:'

/**
 * One Base instance == one SQLite file. The `scope` selects the tenant DB so
 * org/service isolation is a file boundary, matching Base's per-project model.
 * `:memory:` is used by tests for a real, in-process SQLite engine.
 */
export class BaseRedis implements BaseRedisClient {
    private db: DatabaseSync
    private vacuumTimer?: NodeJS.Timeout
    private stmts: Map<string, StatementSync> = new Map()

    constructor(scope = ':memory:', opts: { vacuumIntervalMs?: number } = {}) {
        this.db = new DatabaseSync(scope)
        this.db.exec('PRAGMA journal_mode = WAL;')
        this.db.exec('PRAGMA busy_timeout = 5000;')
        this.db.exec(SCHEMA)
        const interval = opts.vacuumIntervalMs ?? 60_000
        if (interval > 0 && scope !== ':memory:') {
            this.vacuumTimer = setInterval(() => this.vacuum(), interval)
            this.vacuumTimer.unref?.()
        }
    }

    private prep(sql: string): StatementSync {
        let s = this.stmts.get(sql)
        if (!s) {
            s = this.db.prepare(sql)
            this.stmts.set(sql, s)
        }
        return s
    }

    private now(): number {
        return Date.now()
    }

    /** Lazy expiry: delete any rows for `key` whose expires_at has passed. */
    private expireKey(key: string): void {
        this.prep('DELETE FROM kv WHERE key = ? AND expires_at IS NOT NULL AND expires_at <= ?').run(key, this.now())
    }

    /** Periodic vacuum of all expired rows (the EXPIRE/TTL sweep). */
    vacuum(): void {
        this.prep('DELETE FROM kv WHERE expires_at IS NOT NULL AND expires_at <= ?').run(this.now())
    }

    // ---- strings ----

    async get(key: string): Promise<string | null> {
        this.expireKey(key)
        const row = this.prep('SELECT value FROM kv WHERE key = ? AND field = ?').get(key, STRING_FIELD) as
            | { value: string | null }
            | undefined
        return row?.value ?? null
    }

    async set(key: string, value: string, ...args: (string | number)[]): Promise<'OK' | null> {
        // Parse ioredis option tail: EX <s> | PX <ms> | NX | XX
        let expiresAt: number | null = null
        let nx = false
        let xx = false
        for (let i = 0; i < args.length; i++) {
            const a = String(args[i]).toUpperCase()
            if (a === 'EX') {
                expiresAt = this.now() + Number(args[++i]) * 1000
            } else if (a === 'PX') {
                expiresAt = this.now() + Number(args[++i])
            } else if (a === 'NX') {
                nx = true
            } else if (a === 'XX') {
                xx = true
            }
        }
        this.expireKey(key)
        const exists =
            (this.prep('SELECT 1 FROM kv WHERE key = ? AND field = ?').get(key, STRING_FIELD) as unknown) !== undefined
        if ((nx && exists) || (xx && !exists)) {
            return null
        }
        this.prep(
            'INSERT INTO kv (key, field, value, expires_at) VALUES (?, ?, ?, ?) ' +
                'ON CONFLICT(key, field) DO UPDATE SET value = excluded.value, expires_at = excluded.expires_at'
        ).run(key, STRING_FIELD, value, expiresAt)
        return 'OK'
    }

    async setex(key: string, seconds: number, value: string): Promise<'OK'> {
        await this.set(key, value, 'EX', seconds)
        return 'OK'
    }

    async getex(key: string, ...args: (string | number)[]): Promise<string | null> {
        // GETEX key [EX s | PX ms | PERSIST]: read value and (re)set its TTL.
        this.expireKey(key)
        const value = await this.get(key)
        if (value === null) {
            return null
        }
        for (let i = 0; i < args.length; i++) {
            const a = String(args[i]).toUpperCase()
            if (a === 'EX') {
                await this.expire(key, Number(args[++i]))
            } else if (a === 'PX') {
                this.prep('UPDATE kv SET expires_at = ? WHERE key = ?').run(this.now() + Number(args[++i]), key)
            } else if (a === 'PERSIST') {
                this.prep('UPDATE kv SET expires_at = NULL WHERE key = ?').run(key)
            }
        }
        return value
    }

    async setnx(key: string, value: string): Promise<number> {
        return (await this.set(key, value, 'NX')) === 'OK' ? 1 : 0
    }

    async getset(key: string, value: string): Promise<string | null> {
        const prev = await this.get(key)
        await this.set(key, value)
        return prev
    }

    async del(...keys: string[]): Promise<number> {
        let n = 0
        const stmt = this.prep('DELETE FROM kv WHERE key = ?')
        for (const key of keys) {
            n += stmt.run(key).changes as number
        }
        return n > 0 ? keys.length : 0
    }

    async exists(...keys: string[]): Promise<number> {
        let n = 0
        for (const key of keys) {
            this.expireKey(key)
            if ((this.prep('SELECT 1 FROM kv WHERE key = ? LIMIT 1').get(key) as unknown) !== undefined) {
                n++
            }
        }
        return n
    }

    async expire(key: string, seconds: number): Promise<number> {
        this.expireKey(key)
        const res = this.prep('UPDATE kv SET expires_at = ? WHERE key = ?').run(this.now() + seconds * 1000, key)
        return (res.changes as number) > 0 ? 1 : 0
    }

    async pttl(key: string): Promise<number> {
        this.expireKey(key)
        const row = this.prep('SELECT expires_at FROM kv WHERE key = ? ORDER BY field LIMIT 1').get(key) as
            | { expires_at: number | null }
            | undefined
        if (row === undefined) {
            return -2 // key does not exist
        }
        if (row.expires_at === null) {
            return -1 // exists, no TTL
        }
        return Math.max(0, row.expires_at - this.now())
    }

    async ttl(key: string): Promise<number> {
        const ms = await this.pttl(key)
        return ms < 0 ? ms : Math.ceil(ms / 1000)
    }

    async incrby(key: string, increment: number): Promise<number> {
        return this.transaction(() => {
            this.expireKey(key)
            const row = this.prep('SELECT value FROM kv WHERE key = ? AND field = ?').get(key, STRING_FIELD) as
                | { value: string | null }
                | undefined
            const current = row?.value != null ? parseInt(row.value, 10) : 0
            if (Number.isNaN(current)) {
                throw new Error('ERR value is not an integer or out of range')
            }
            const next = current + increment
            this.prep(
                'INSERT INTO kv (key, field, value) VALUES (?, ?, ?) ' +
                    'ON CONFLICT(key, field) DO UPDATE SET value = excluded.value'
            ).run(key, STRING_FIELD, String(next))
            return next
        })
    }

    async incr(key: string): Promise<number> {
        return this.incrby(key, 1)
    }

    async decr(key: string): Promise<number> {
        return this.incrby(key, -1)
    }

    async mget(...keys: string[]): Promise<(string | null)[]> {
        return Promise.all(keys.map((k) => this.get(k)))
    }

    async keys(pattern: string): Promise<string[]> {
        // Translate Redis glob (* ?) to SQL LIKE (% _), escaping LIKE specials.
        const like = pattern.replace(/[%_]/g, '\\$&').replace(/\*/g, '%').replace(/\?/g, '_')
        this.vacuum()
        const rows = this.prep(
            "SELECT DISTINCT key FROM kv WHERE key LIKE ? ESCAPE '\\' AND (expires_at IS NULL OR expires_at > ?)"
        ).all(like, this.now()) as { key: string }[]
        return rows.map((r) => r.key)
    }

    async scan(cursor: string | number, ...args: (string | number)[]): Promise<[string, string[]]> {
        // Single-shot scan: cursor 0 returns everything matching, next cursor 0.
        let match = '*'
        for (let i = 0; i < args.length; i++) {
            if (String(args[i]).toUpperCase() === 'MATCH') {
                match = String(args[++i])
            }
        }
        if (String(cursor) !== '0') {
            return ['0', []]
        }
        return ['0', await this.keys(match)]
    }

    // ---- hashes ----

    async hset(key: string, ...args: (string | number)[]): Promise<number> {
        // hset key f1 v1 f2 v2 ...  OR  hset key {obj}
        const pairs: [string, string][] = []
        if (args.length === 1 && typeof args[0] === 'object') {
            for (const [f, v] of Object.entries(args[0] as Record<string, unknown>)) {
                pairs.push([f, String(v)])
            }
        } else {
            for (let i = 0; i < args.length; i += 2) {
                pairs.push([String(args[i]), String(args[i + 1])])
            }
        }
        return this.transaction(() => {
            let added = 0
            const stmt = this.prep(
                'INSERT INTO kv (key, field, value) VALUES (?, ?, ?) ' +
                    'ON CONFLICT(key, field) DO UPDATE SET value = excluded.value'
            )
            for (const [f, v] of pairs) {
                const existed =
                    (this.prep('SELECT 1 FROM kv WHERE key = ? AND field = ?').get(key, f) as unknown) !== undefined
                stmt.run(key, f, v)
                if (!existed) {
                    added++
                }
            }
            return added
        })
    }

    async hget(key: string, field: string): Promise<string | null> {
        this.expireKey(key)
        const row = this.prep('SELECT value FROM kv WHERE key = ? AND field = ?').get(key, field) as
            | { value: string | null }
            | undefined
        return row?.value ?? null
    }

    async hgetall(key: string): Promise<Record<string, string>> {
        this.expireKey(key)
        const rows = this.prep('SELECT field, value FROM kv WHERE key = ? AND field != ?').all(key, STRING_FIELD) as {
            field: string
            value: string
        }[]
        const out: Record<string, string> = {}
        for (const r of rows) {
            if (!r.field.startsWith(SET_PREFIX) && !r.field.startsWith(ZSET_PREFIX)) {
                out[r.field] = r.value
            }
        }
        return out
    }

    async hdel(key: string, ...fields: string[]): Promise<number> {
        let n = 0
        const stmt = this.prep('DELETE FROM kv WHERE key = ? AND field = ?')
        for (const f of fields) {
            n += stmt.run(key, f).changes as number
        }
        return n
    }

    // ---- sorted sets ----

    async zadd(key: string, ...args: (string | number)[]): Promise<number> {
        // zadd key score member [score member ...]
        return this.transaction(() => {
            let added = 0
            const stmt = this.prep(
                'INSERT INTO kv (key, field, score) VALUES (?, ?, ?) ' +
                    'ON CONFLICT(key, field) DO UPDATE SET score = excluded.score'
            )
            for (let i = 0; i < args.length; i += 2) {
                const score = Number(args[i])
                const member = ZSET_PREFIX + String(args[i + 1])
                const existed =
                    (this.prep('SELECT 1 FROM kv WHERE key = ? AND field = ?').get(key, member) as unknown) !==
                    undefined
                stmt.run(key, member, score)
                if (!existed) {
                    added++
                }
            }
            return added
        })
    }

    async zrangebyscore(key: string, min: number | string, max: number | string): Promise<string[]> {
        this.expireKey(key)
        const lo = min === '-inf' ? -Infinity : Number(min)
        const hi = max === '+inf' ? Infinity : Number(max)
        const rows = this.prep(
            'SELECT field FROM kv WHERE key = ? AND field LIKE ? AND score >= ? AND score <= ? ORDER BY score ASC'
        ).all(key, ZSET_PREFIX + '%', lo, hi) as { field: string }[]
        return rows.map((r) => r.field.slice(ZSET_PREFIX.length))
    }

    async zrange(key: string, start: number, stop: number): Promise<string[]> {
        this.expireKey(key)
        const rows = this.prep('SELECT field FROM kv WHERE key = ? AND field LIKE ? ORDER BY score ASC').all(
            key,
            ZSET_PREFIX + '%'
        ) as { field: string }[]
        const members = rows.map((r) => r.field.slice(ZSET_PREFIX.length))
        const end = stop < 0 ? members.length + stop + 1 : stop + 1
        return members.slice(start, end)
    }

    async zrem(key: string, ...members: string[]): Promise<number> {
        let n = 0
        const stmt = this.prep('DELETE FROM kv WHERE key = ? AND field = ?')
        for (const m of members) {
            n += stmt.run(key, ZSET_PREFIX + m).changes as number
        }
        return n
    }

    // ---- sets ----

    async sadd(key: string, ...members: string[]): Promise<number> {
        return this.transaction(() => {
            let added = 0
            const stmt = this.prep('INSERT INTO kv (key, field) VALUES (?, ?) ON CONFLICT(key, field) DO NOTHING')
            for (const m of members) {
                added += stmt.run(key, SET_PREFIX + m).changes as number
            }
            return added
        })
    }

    async srem(key: string, ...members: string[]): Promise<number> {
        let n = 0
        const stmt = this.prep('DELETE FROM kv WHERE key = ? AND field = ?')
        for (const m of members) {
            n += stmt.run(key, SET_PREFIX + m).changes as number
        }
        return n
    }

    async smembers(key: string): Promise<string[]> {
        this.expireKey(key)
        const rows = this.prep('SELECT field FROM kv WHERE key = ? AND field LIKE ?').all(key, SET_PREFIX + '%') as {
            field: string
        }[]
        return rows.map((r) => r.field.slice(SET_PREFIX.length))
    }

    async scard(key: string): Promise<number> {
        this.expireKey(key)
        const row = this.prep('SELECT COUNT(*) AS n FROM kv WHERE key = ? AND field LIKE ?').get(
            key,
            SET_PREFIX + '%'
        ) as { n: number }
        return row.n
    }

    async sismember(key: string, member: string): Promise<number> {
        this.expireKey(key)
        return (this.prep('SELECT 1 FROM kv WHERE key = ? AND field = ?').get(key, SET_PREFIX + member) as unknown) !==
            undefined
            ? 1
            : 0
    }

    // ---- rate limiting (Lua token bucket → BEGIN IMMEDIATE transaction) ----

    private tokenBucket(
        key: string,
        now: number,
        cost: number,
        poolMax: number,
        fillRate: number,
        expiry: number
    ): [number, number] {
        return this.transaction(() => {
            this.expireKey(key)
            const tsRow = this.prep('SELECT value FROM kv WHERE key = ? AND field = ?').get(key, 'ts') as
                | { value: string }
                | undefined
            const expiresAt = now * 1000 + expiry * 1000
            const upsert = this.prep(
                'INSERT INTO kv (key, field, value, expires_at) VALUES (?, ?, ?, ?) ' +
                    'ON CONFLICT(key, field) DO UPDATE SET value = excluded.value, expires_at = excluded.expires_at'
            )

            if (tsRow === undefined) {
                const tokensBefore = poolMax
                const tokensAfter = poolMax - cost >= 0 ? poolMax - cost : -1
                upsert.run(key, 'ts', String(now), expiresAt)
                upsert.run(key, 'pool', String(tokensAfter), expiresAt)
                return [tokensBefore, tokensAfter] as [number, number]
            }

            const before = Number(tsRow.value)
            let timeDiffSeconds = now - before
            if (timeDiffSeconds > 0) {
                upsert.run(key, 'ts', String(now), expiresAt)
            } else {
                timeDiffSeconds = 0
            }

            const poolRow = this.prep('SELECT value FROM kv WHERE key = ? AND field = ?').get(key, 'pool') as
                | { value: string }
                | undefined
            let currentTokens = poolRow ? Number(poolRow.value) : poolMax
            currentTokens = Math.min(currentTokens + timeDiffSeconds * fillRate, poolMax)
            const tokensBefore = currentTokens
            const tokensAfter = currentTokens - cost >= 0 ? currentTokens - cost : -1
            upsert.run(key, 'pool', String(tokensAfter), expiresAt)
            return [tokensBefore, tokensAfter] as [number, number]
        })
    }

    async checkRateLimit(
        key: string,
        now: number,
        cost: number,
        poolMax: number,
        fillRate: number,
        expiry: number
    ): Promise<[number, number]> {
        return this.tokenBucket(key, now, cost, poolMax, fillRate, expiry)
    }

    async checkRateLimitV2(
        key: string,
        now: number,
        cost: number,
        poolMax: number,
        fillRate: number,
        expiry: number
    ): Promise<[number, number]> {
        return this.tokenBucket(key, now, cost, poolMax, fillRate, expiry)
    }

    // ---- control ----

    async ping(): Promise<'PONG'> {
        return 'PONG'
    }

    async info(): Promise<string> {
        return '# Server\nredis_version:base-adapter\n'
    }

    async quit(): Promise<'OK'> {
        if (this.vacuumTimer) {
            clearInterval(this.vacuumTimer)
        }
        this.db.close()
        return 'OK'
    }

    pipeline(): BasePipeline {
        return new BasePipeline(this)
    }

    /**
     * Pub/Sub is cross-process (Django publishes; many Node worker pods
     * subscribe to invalidate in-memory caches). Embedded SQLite cannot fan a
     * message out to other processes, so faking it with a local emitter would
     * SILENTLY break cache invalidation across pods. We refuse loudly instead.
     *
     * The correct target is Base realtime (SSE/WS record-change events). Until
     * that channel→collection mapping ships (it also touches the Django
     * publisher, out of scope here), run the pub/sub pool on real Redis via
     * INSIGHTS_KV_BACKEND=resp with a redis:// URL. See pubsub.ts.
     */
    private refusePubSub(op: string): never {
        throw new Error(
            `base-adapter: ${op} is cross-process and not supported by embedded SQLite. ` +
                'Configure the pub/sub pool with INSIGHTS_KV_BACKEND=resp (Base realtime migration pending).'
        )
    }

    async publish(): Promise<number> {
        return this.refusePubSub('publish')
    }

    async subscribe(): Promise<number> {
        return this.refusePubSub('subscribe')
    }

    async unsubscribe(): Promise<number> {
        return this.refusePubSub('unsubscribe')
    }

    on(): this {
        return this.refusePubSub('on')
    }

    /** Serializable multi-op atomicity — the Lua-script / MULTI equivalent. */
    private transaction<T>(fn: () => T): T {
        this.db.exec('BEGIN IMMEDIATE')
        try {
            const result = fn()
            this.db.exec('COMMIT')
            return result
        } catch (e) {
            this.db.exec('ROLLBACK')
            throw e
        }
    }
}

/** Resolve a Base SQLite file path from a Redis-style URL or scope name. */
export function baseScopeFromUrl(url: string | undefined, fallback = ':memory:'): string {
    if (!url || url.startsWith('redis://') || url.startsWith('rediss://')) {
        // No real Base path configured → use a per-process temp file or memory.
        return process.env.INSIGHTS_BASE_PATH || fallback
    }
    return url
}
/* eslint-enable @typescript-eslint/require-await */
