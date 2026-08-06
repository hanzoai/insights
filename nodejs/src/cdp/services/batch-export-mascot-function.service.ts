import { z } from 'zod'

import { PromiseScheduler } from '~/common/utils/promise-scheduler'
import { TeamManager } from '~/common/utils/team-manager'
import { UUID, UUIDT } from '~/common/utils/utils'

import { RawDatastoreEvent, Team } from '../../types'
import {
    CyclotronJobInvocationInsightsFunction,
    CyclotronJobInvocationResult,
    InsightsFunctionInvocationGlobals,
    InsightsFunctionType,
} from '../types'
import { convertToInsightsFunctionInvocationGlobals } from '../utils'
import { createInvocation } from '../utils/invocation-utils'
import { HogExecutorService } from './script-executor.service'
import { InvocationResultsService } from './invocation-results.service'
import { GroupsManagerService } from './managers/groups-manager.service'
import { InsightsFunctionManagerService } from './managers/script-function-manager.service'
import { HogWatcherService } from './monitoring/script-watcher.service'

// TODO: This might be too strict so we need to validate that it matches well what we would expect to get from batch exports
const batchExportRequestBodySchema = z.object({
    datastore_event: z.object({
        uuid: z.string(),
        event: z.string(),
        team_id: z.number(),
        distinct_id: z.string(),
        person_id: z.string().optional(),
        timestamp: z.string(),
        captured_at: z.string().nullish(),
        properties: z.string().optional(),
        elements_chain: z.string().default(''),
        person_properties: z.string().optional(),
    }),
    invocation_id: z.guid().optional(),
})

export class BatchExportInsightsFunctionService {
    private promiseScheduler: PromiseScheduler

    constructor(
        private siteUrl: string,
        private teamManager: TeamManager,
        private groupsManager: GroupsManagerService,
        private insightsFunctionManager: InsightsFunctionManagerService,
        private hogExecutor: HogExecutorService,
        private hogWatcher: HogWatcherService,
        private invocationResultsService: InvocationResultsService
    ) {
        this.promiseScheduler = new PromiseScheduler()
    }

    async execute(
        params: { team_id: string; insights_function_id: string },
        body: unknown
    ): Promise<CyclotronJobInvocationResult<CyclotronJobInvocationInsightsFunction>> {
        const parsed = batchExportRequestBodySchema.safeParse(body)
        if (!parsed.success) {
            throw new ParseError('Invalid request body: ' + parsed.error.message)
        }

        const { datastore_event, invocation_id } = parsed.data
        const invocationId = invocation_id ? new UUID(invocation_id) : new UUIDT()

        let team: Team | null
        try {
            team = await this.teamManager.getTeam(parseInt(params.team_id))
        } catch {
            throw new ParseError('Invalid team_id: ' + params.team_id)
        }
        if (!team) {
            throw new NotFoundError('Missing team with id: ' + params.team_id)
        }

        const insightsFunction = await this.insightsFunctionManager.getInsightsFunction(params.insights_function_id)
        if (!insightsFunction) {
            throw new NotFoundError('Missing script function with id: ' + params.insights_function_id)
        }
        if (insightsFunction.team_id !== team.id || !insightsFunction.batch_export_id) {
            throw new NotFoundError('Missing script function with id: ' + params.insights_function_id)
        }

        const globals = this.buildRequestGlobals(datastore_event as RawDatastoreEvent, insightsFunction, team)
        await this.groupsManager.addGroupsToGlobals(globals)

        const globalsWithInputs = await this.hogExecutor.buildInputsWithGlobals(insightsFunction, globals)
        const invocation = createInvocation(globalsWithInputs, insightsFunction)
        invocation.id = invocationId.toString()

        const result = await this.hogExecutor.executeWithAsyncFunctions(invocation, { maxFetchRetries: 0 }) // Retries are handled by the batch export service

        // TODO: Follow up - we might want to more accuratelt link an execution to the fact it came from a batch export
        // We have the parent_id but that overrides the function id which is not always what we want
        // Likely after v0 we will want to add an extra field or concept depending on whether it is a backfill vs a standard run

        void this.promiseScheduler.schedule(
            Promise.all([
                this.invocationResultsService.queueInvocationResultsAndFlush([result]),
                this.hogWatcher.observeResultsBuffered(result),
            ])
        )

        return result
    }

    private buildRequestGlobals(
        event: RawDatastoreEvent,
        insightsFunction: InsightsFunctionType,
        team: Team
    ): InsightsFunctionInvocationGlobals {
        const globals = convertToInsightsFunctionInvocationGlobals(event, team, this.siteUrl)
        const projectUrl = `${this.siteUrl}/project/${team.id}`

        return {
            ...globals,
            source: {
                name: insightsFunction.name ?? `Script function: ${insightsFunction.id}`,
                url: `${projectUrl}/functions/${insightsFunction.id}`,
            },
        }
    }

    public async stop(): Promise<void> {
        await this.promiseScheduler.waitForAllSettled()
    }
}

export class NotFoundError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'NotFoundError'
    }
}

export class ParseError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'ParseError'
    }
}
