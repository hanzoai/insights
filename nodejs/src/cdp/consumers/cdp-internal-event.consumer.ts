import { Message } from 'node-rdkafka'

import { instrumented } from '~/common/tracing/tracing-utils'

import { KAFKA_CDP_INTERNAL_EVENTS } from '../../config/kafka-topics'
import { parseJSON } from '../../utils/json-parse'
import { logger } from '../../utils/logger'
import { CdpInternalEventSchema } from '../schema'
import { CustomFunctionInvocationGlobals, CustomFunctionTypeType } from '../types'
import { convertInternalEventToCustomFunctionInvocationGlobals } from '../utils'
import { CdpEventsConsumer, CdpEventsConsumerHub } from './cdp-events.consumer'
import { counterParseError } from './metrics'

export class CdpInternalEventsConsumer extends CdpEventsConsumer {
    protected name = 'CdpInternalEventsConsumer'
    protected scriptTypes: CustomFunctionTypeType[] = ['internal_destination']

    constructor(hub: CdpEventsConsumerHub) {
        super(hub, KAFKA_CDP_INTERNAL_EVENTS, 'cdp-internal-events-consumer')
    }

    // This consumer always parses from kafka
    @instrumented('cdpConsumer.handleEachBatch.parseKafkaMessages')
    public async _parseKafkaBatch(messages: Message[]): Promise<CustomFunctionInvocationGlobals[]> {
        return await this.runWithHeartbeat(async () => {
            const events: CustomFunctionInvocationGlobals[] = []
            await Promise.all(
                messages.map(async (message) => {
                    try {
                        const kafkaEvent = parseJSON(message.value!.toString()) as unknown
                        // This is the input stream from elsewhere so we want to do some proper validation
                        const event = CdpInternalEventSchema.parse(kafkaEvent)

                        const [teamCustomFunctions, team] = await Promise.all([
                            this.customFunctionManager.getCustomFunctionsForTeam(event.team_id, ['internal_destination']),
                            this.hub.teamManager.getTeam(event.team_id),
                        ])

                        if (!teamCustomFunctions.length || !team) {
                            return
                        }

                        events.push(convertInternalEventToCustomFunctionInvocationGlobals(event, team, this.hub.SITE_URL))
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
