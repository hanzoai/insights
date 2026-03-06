import { PluginEvent } from '@posthog/plugin-scaffold'

import { StreamProducerWrapper } from '../../stream/producer'
import { EventHeaders, Team } from '../../types'
import { TeamManager } from '../../utils/team-manager'
import { EventPipelineRunnerOptions } from '../../worker/ingestion/event-pipeline/runner'
import { GroupTypeManager } from '../../worker/ingestion/group-type-manager'
import { BatchWritingGroupStore } from '../../worker/ingestion/groups/batch-writing-group-store'
import { PersonsStore } from '../../worker/ingestion/persons/persons-store'
import { createDisablePersonProcessingStep } from '../event-processing/disable-person-processing-step'
import { createEventPipelineRunnerHeatmapStep } from '../event-processing/event-pipeline-runner-heatmap-step'
import { createExtractHeatmapDataStep } from '../event-processing/extract-heatmap-data-step'
import { createNormalizeEventStep } from '../event-processing/normalize-event-step'
import { createSkipEmitEventStep } from '../event-processing/skip-emit-event-step'
import { PipelineBuilder, StartPipelineBuilder } from '../pipelines/builders/pipeline-builders'

export interface HeatmapSubpipelineInput {
    event: PluginEvent
    team: Team
    headers: EventHeaders
}

export interface HeatmapSubpipelineConfig {
    options: EventPipelineRunnerOptions & {
        DATASTORE_HEATMAPS_STREAM_TOPIC: string
    }
    teamManager: TeamManager
    groupTypeManager: GroupTypeManager
    personsStore: PersonsStore
    groupStore: BatchWritingGroupStore
    streamProducer: StreamProducerWrapper
}

export function createHeatmapSubpipeline<TInput extends HeatmapSubpipelineInput, TContext>(
    builder: StartPipelineBuilder<TInput, TContext>,
    config: HeatmapSubpipelineConfig
): PipelineBuilder<TInput, void, TContext> {
    const { options, teamManager, groupTypeManager, personsStore, groupStore, streamProducer } = config

    return builder
        .pipe(createDisablePersonProcessingStep())
        .pipe(createNormalizeEventStep())
        .pipe(
            createEventPipelineRunnerHeatmapStep(
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
        .pipe(createSkipEmitEventStep())
}
