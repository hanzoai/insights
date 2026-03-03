import { Message } from 'node-rdkafka'

import { PluginEvent } from '@hanzo/plugin-scaffold'

import { ScriptTransformerService } from '../../cdp/script-transformations/script-transformer.service'
import { StreamProducerWrapper } from '../../stream/producer'
import { EventHeaders, Team } from '../../types'
import { TeamManager } from '../../utils/team-manager'
import { EventPipelineRunnerOptions } from '../../worker/ingestion/event-pipeline/runner'
import { GroupTypeManager } from '../../worker/ingestion/group-type-manager'
import { BatchWritingGroupStore } from '../../worker/ingestion/groups/batch-writing-group-store'
import { PersonsStore } from '../../worker/ingestion/persons/persons-store'
import { createCreateEventStep } from '../event-processing/create-event-step'
import { createEmitEventStep } from '../event-processing/emit-event-step'
import { createEventPipelineRunnerV1Step } from '../event-processing/event-pipeline-runner-v1-step'
import { createExtractHeatmapDataStep } from '../event-processing/extract-heatmap-data-step'
import { createScriptTransformEventStep } from '../event-processing/script-transform-event-step'
import { createNormalizeEventStep } from '../event-processing/normalize-event-step'
import { createNormalizeProcessPersonFlagStep } from '../event-processing/normalize-process-person-flag-step'
import { createProcessPersonlessStep } from '../event-processing/process-personless-step'
import { PipelineBuilder, StartPipelineBuilder } from '../pipelines/builders/pipeline-builders'

export interface EventSubpipelineInput {
    message: Message
    event: PluginEvent
    team: Team
    headers: EventHeaders
}

export interface EventSubpipelineConfig {
    options: EventPipelineRunnerOptions & {
        DATASTORE_JSON_EVENTS_STREAM_TOPIC: string
        DATASTORE_HEATMAPS_STREAM_TOPIC: string
    }
    teamManager: TeamManager
    groupTypeManager: GroupTypeManager
    scriptTransformer: ScriptTransformerService
    personsStore: PersonsStore
    groupStore: BatchWritingGroupStore
    streamProducer: StreamProducerWrapper
    groupId: string
}

export function createEventSubpipeline<TInput extends EventSubpipelineInput, TContext>(
    builder: StartPipelineBuilder<TInput, TContext>,
    config: EventSubpipelineConfig
): PipelineBuilder<TInput, void, TContext> {
    const { options, teamManager, groupTypeManager, scriptTransformer, personsStore, groupStore, streamProducer, groupId } =
        config

    return builder
        .pipe(createNormalizeProcessPersonFlagStep())
        .pipe(createScriptTransformEventStep(scriptTransformer))
        .pipe(createNormalizeEventStep())
        .pipe(createProcessPersonlessStep(personsStore))
        .pipe(
            createEventPipelineRunnerV1Step(
                options,
                streamProducer,
                teamManager,
                groupTypeManager,
                personsStore,
                groupStore
            )
        )
        .pipe(
            createExtractHeatmapDataStep({
                streamProducer,
                DATASTORE_HEATMAPS_STREAM_TOPIC: options.DATASTORE_HEATMAPS_STREAM_TOPIC,
            })
        )
        .pipe(createCreateEventStep())
        .pipe(
            createEmitEventStep({
                streamProducer,
                datastoreJsonEventsTopic: options.DATASTORE_JSON_EVENTS_STREAM_TOPIC,
                groupId,
            })
        )
}
