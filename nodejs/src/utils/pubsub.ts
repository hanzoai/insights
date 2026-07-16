import { EventEmitter } from 'events'
import { Redis } from 'ioredis'

import { RedisPool } from '../types'
import { parseJSON } from './json-parse'
import { logger } from './logger'
import { PromiseScheduler } from './promise-scheduler'

/**
 * Cross-process pub/sub over the shared Hanzo KV (native RESP pub/sub).
 *
 * KV is OPTIONAL: constructed with a `null` pool (no shared KV configured),
 * pub/sub degrades to process-LOCAL delivery — publishes loop back to this
 * process only, announced with a loud warning. Cross-pod cache invalidation
 * then relies on cache TTLs until Base realtime carries the fan-out.
 */
export class PubSub {
    private eventEmitter: EventEmitter
    private redisSubscriber?: Redis
    private redisPublisher?: Redis
    private promises: PromiseScheduler
    private started = false

    constructor(private kvPool: RedisPool | null) {
        this.eventEmitter = new EventEmitter()
        this.promises = new PromiseScheduler()
    }

    public async start(): Promise<void> {
        if (this.started) {
            throw new Error('Started PubSub cannot be started again!')
        }
        this.started = true

        if (!this.kvPool) {
            logger.warn(
                '⚠️',
                'No shared KV configured (KV_URL unset) — pub/sub is process-local. ' +
                    'Cross-pod cache invalidation falls back to cache TTLs.'
            )
            return
        }
        this.redisSubscriber = await this.kvPool.acquire()

        this.redisSubscriber.on('message', (channel: string, message: string) => {
            this.eventEmitter.emit(channel, message)
        })
        logger.info('👀', 'Pub-sub started')
    }

    public async stop(): Promise<void> {
        if (!this.started) {
            logger.error('🛑', 'Unstarted PubSub cannot be stopped!')
            return
        }
        this.started = false

        await this.promises.waitForAll()

        if (this.redisSubscriber) {
            await this.redisSubscriber.unsubscribe()
            this.redisSubscriber.removeAllListeners('message')
            await this.kvPool!.release(this.redisSubscriber)
        }
        this.redisSubscriber = undefined

        if (this.redisPublisher) {
            await this.kvPool!.release(this.redisPublisher)
            this.redisPublisher = undefined
        }

        this.eventEmitter.removeAllListeners()

        logger.info('🛑', 'Pub-sub stopped')
    }

    public async publish(channel: string, message: string): Promise<void> {
        if (!this.kvPool) {
            // Process-local delivery: loop the message back to our own listeners.
            this.eventEmitter.emit(channel, message)
            return
        }
        if (!this.redisPublisher) {
            this.redisPublisher = await this.kvPool.acquire()
        }

        await this.redisPublisher.publish(channel, message)
    }

    public on<T extends Record<string, any>>(channel: string, listener: (message: T) => void): void {
        if (!this.started) {
            throw new Error('PubSub must be started before subscribing to channels!')
        }

        if (this.redisSubscriber) {
            void this.promises.schedule(this.redisSubscriber.subscribe(channel))
        }
        this.eventEmitter.on(channel, (message) => listener(message ? parseJSON(message) : {}))
    }
}
