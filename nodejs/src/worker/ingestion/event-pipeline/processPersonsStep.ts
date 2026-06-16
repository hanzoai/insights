import { DateTime } from 'luxon'

import { PluginEvent } from '@hanzo/plugin-scaffold'

import { Person, Team } from '~/types'

import { PipelineResult, isOkResult, ok } from '../../../ingestion/pipelines/results'
import { StreamProducerWrapper } from '../../../stream/producer'
import { PersonContext } from '../persons/person-context'
import { PersonEventProcessor } from '../persons/person-event-processor'
import { PersonMergeService } from '../persons/person-merge-service'
import { MergeMode } from '../persons/person-merge-types'
import { PersonPropertyService } from '../persons/person-property-service'
import { PersonsStore } from '../persons/persons-store'

export async function processPersonsStep(
    streamProducer: StreamProducerWrapper,
    mergeMode: MergeMode,
    measurePersonJsonbSize: number,
    personPropertiesUpdateAll: boolean,
    event: PluginEvent,
    team: Team,
    timestamp: DateTime,
    processPerson: boolean,
    personsStore: PersonsStore
): Promise<PipelineResult<[PluginEvent, Person, Promise<void>]>> {
    const context = new PersonContext(
        event,
        team,
        String(event.distinct_id),
        timestamp,
        processPerson,
        streamProducer,
        personsStore,
        measurePersonJsonbSize,
        mergeMode,
        personPropertiesUpdateAll
    )

    const processor = new PersonEventProcessor(
        context,
        new PersonPropertyService(context),
        new PersonMergeService(context)
    )
    const [result, streamAck] = await processor.processEvent()

    if (isOkResult(result)) {
        return ok([event, result.value, streamAck])
    } else {
        return result
    }
}
