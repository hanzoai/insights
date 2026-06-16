import { Message } from 'node-rdkafka'

import { instrumented } from '~/common/tracing/tracing-utils'
import { UUIDT } from '~/utils/utils'

import { STREAM_PERSON } from '../../config/stream-topics'
import { DatastorePerson, Team } from '../../types'
import { parseJSON } from '../../utils/json-parse'
import { logger } from '../../utils/logger'
import { CyclotronPerson, InsightsFunctionInvocationGlobals, InsightsFunctionType, InsightsFunctionTypeType } from '../types'
import { getPersonDisplayName } from '../utils'
import { CdpEventsConsumer, CdpEventsConsumerHub } from './cdp-events.consumer'
import { counterParseError } from './metrics'

export class CdpPersonUpdatesConsumer extends CdpEventsConsumer {
    protected name = 'CdpPersonUpdatesConsumer'
    protected scriptTypes: InsightsFunctionTypeType[] = ['destination']

    constructor(hub: CdpEventsConsumerHub) {
        super(hub, STREAM_PERSON, 'cdp-person-updates-consumer')
    }

    protected filterInsightsFunction(insightsFunction: InsightsFunctionType): boolean {
        return insightsFunction.filters?.source === 'person-updates'
    }

    // This consumer always parses from stream
    @instrumented('cdpConsumer.handleEachBatch.parseStreamMessages')
    public async _parseStreamBatch(messages: Message[]): Promise<InsightsFunctionInvocationGlobals[]> {
        return await this.runWithHeartbeat(async () => {
            const globals: InsightsFunctionInvocationGlobals[] = []
            await Promise.all(
                messages.map(async (message) => {
                    try {
                        const data = parseJSON(message.value!.toString()) as DatastorePerson

                        const [teamInsightsFunctions, team] = await Promise.all([
                            this.insightsFunctionManager.getInsightsFunctionsForTeam(data.team_id, ['destination']),
                            this.hub.teamManager.getTeam(data.team_id),
                        ])

                        const filteredInsightsFunctions = teamInsightsFunctions.filter(this.filterInsightsFunction)

                        if (!filteredInsightsFunctions.length || !team) {
                            return
                        }

                        globals.push(convertDatastorePersonToInvocationGlobals(data, team, this.hub.SITE_URL))
                    } catch (e) {
                        logger.error('Error parsing message', e)
                        counterParseError.labels({ error: e.message }).inc()
                    }
                })
            )

            return globals
        })
    }
}

function convertDatastorePersonToInvocationGlobals(
    data: DatastorePerson,
    team: Team,
    siteUrl: string
): InsightsFunctionInvocationGlobals {
    const projectUrl = `${siteUrl}/project/${team.id}`

    const person: CyclotronPerson = {
        id: data.id,
        properties: parseJSON(data.properties),
        name: '',
        url: '',
    }

    person.name = getPersonDisplayName(team, person.id, person.properties)
    person.url = `${projectUrl}/person/${person.id}`

    const context: InsightsFunctionInvocationGlobals = {
        project: {
            id: team.id,
            name: team.name,
            url: projectUrl,
        },
        event: {
            uuid: new UUIDT().toString(),
            event: '$person_updated',
            distinct_id: person.id,
            properties: {},
            timestamp: data.timestamp,
            url: person.url,
            elements_chain: '',
        },
        person,
    }

    return context
}
