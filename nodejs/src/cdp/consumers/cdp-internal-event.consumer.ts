import { Message } from 'node-rdkafka'

import { instrumented } from '~/common/tracing/tracing-utils'

import { KAFKA_CDP_INTERNAL_EVENTS } from '../../config/kafka-topics'
import { parseJSON } from '../../utils/json-parse'
import { logger } from '../../utils/logger'
import { CdpInternalEventSchema } from '../schema'
import { InsightsFunctionInvocationGlobals, InsightsFunctionTypeType } from '../types'
import { convertInternalEventToInsightsFunctionInvocationGlobals } from '../utils'
import { CdpEventsConsumer, CdpEventsConsumerHub } from './cdp-events.consumer'
import { counterParseError } from './metrics'

export class CdpInternalEventsConsumer extends CdpEventsConsumer {
    protected name = 'CdpInternalEventsConsumer'
    protected scriptTypes: InsightsFunctionTypeType[] = ['internal_destination']

    constructor(hub: CdpEventsConsumerHub) {
        super(hub, KAFKA_CDP_INTERNAL_EVENTS, 'cdp-internal-events-consumer')
    }

    // This consumer always parses from kafka
    @instrumented('cdpConsumer.handleEachBatch.parseKafkaMessages')
    public async _parseKafkaBatch(messages: Message[]): Promise<InsightsFunctionInvocationGlobals[]> {
        return await this.runWithHeartbeat(async () => {
            const events: InsightsFunctionInvocationGlobals[] = []
            await Promise.all(
                messages.map(async (message) => {
                    try {
                        const kafkaEvent = parseJSON(message.value!.toString()) as unknown
                        // This is the input stream from elsewhere so we want to do some proper validation
                        const event = CdpInternalEventSchema.parse(kafkaEvent)

                        const [teamInsightsFunctions, team] = await Promise.all([
                            this.insightsFunctionManager.getInsightsFunctionsForTeam(event.team_id, ['internal_destination']),
                            this.hub.teamManager.getTeam(event.team_id),
                        ])

                        if (!teamInsightsFunctions.length || !team) {
                            return
                        }

                        events.push(convertInternalEventToInsightsFunctionInvocationGlobals(event, team, this.hub.SITE_URL))
                    } catch (e) {
                        logger.error('Error parsing message', e)
                        counterParseError.labels({ error: e.message }).inc()
                    }
                })
            )

            return events
        })
    }
}
