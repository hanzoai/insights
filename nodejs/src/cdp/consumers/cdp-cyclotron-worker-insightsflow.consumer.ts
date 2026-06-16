// @ts-nocheck
import { instrumented } from '~/common/tracing/tracing-utils'

import { Hub } from '../../types'
import { logger } from '../../utils/logger'
import {
    CyclotronJobInvocation,
    CyclotronJobInvocationInsightsFlow,
    CyclotronJobInvocationResult,
    CyclotronPerson,
} from '../types'
import { getPersonDisplayName } from '../utils'
import { convertToInsightsFunctionFilterGlobal } from '../utils/insights-function-filtering'
import { CdpCyclotronWorker, CdpCyclotronWorkerHub } from './cdp-cyclotron-worker.consumer'

/**
 * Hub type for CdpCyclotronWorkerInsightsFlow.
 * Extends CdpCyclotronWorkerHub with customflow-specific fields.
 */
export type CdpCyclotronWorkerInsightsFlowHub = CdpCyclotronWorkerHub & Pick<Hub, 'teamManager'>

export class CdpCyclotronWorkerInsightsFlow extends CdpCyclotronWorker<CdpCyclotronWorkerInsightsFlowHub> {
    protected name = 'CdpCyclotronWorkerInsightsFlow'

    constructor(hub: CdpCyclotronWorkerInsightsFlowHub) {
        super(hub, 'customflow')
    }

    @instrumented('cdpConsumer.handleEachBatch.executeInvocations')
    public async processInvocations(invocations: CyclotronJobInvocation[]): Promise<CyclotronJobInvocationResult[]> {
        const loadedInvocations = await this.loadInsightsFlows(invocations)
        return await Promise.all(loadedInvocations.map((item) => this.insightsFlowExecutor.execute(item)))
    }

    @instrumented('cdpConsumer.handleEachBatch.loadInsightsFlows')
    protected async loadInsightsFlows(invocations: CyclotronJobInvocation[]): Promise<CyclotronJobInvocationInsightsFlow[]> {
        const loadedInvocations: CyclotronJobInvocationInsightsFlow[] = []
        const failedInvocations: CyclotronJobInvocation[] = []
        const skippedInvocations: CyclotronJobInvocation[] = []

        await Promise.all(
            invocations.map(async (item) => {
                const team = await this.hub.teamManager.getTeam(item.teamId)
                const insightsFlow = await this.insightsFlowManager.getInsightsFlow(item.functionId)
                if (!insightsFlow || !team) {
                    logger.error('⚠️', 'Error finding custom flow', {
                        id: item.functionId,
                    })

                    failedInvocations.push(item)

                    return null
                }

                // Skip execution if the workflow is no longer active (e.g., disabled/archived)
                if (insightsFlow.status !== 'active') {
                    logger.info('⏭️', 'Skipping custom flow invocation - workflow is no longer active', {
                        id: item.functionId,
                        status: insightsFlow.status,
                    })

                    skippedInvocations.push(item)

                    return null
                }

                const insightsFlowInvocationState = item.state as CyclotronJobInvocationInsightsFlow['state']

                const dbPerson = await this.personsManager.get({
                    teamId: insightsFlow.team_id,
                    distinctId: insightsFlowInvocationState.event.distinct_id,
                })

                const personDisplayName = getPersonDisplayName(
                    team,
                    insightsFlowInvocationState.event.distinct_id,
                    dbPerson?.properties ?? {}
                )

                if (!dbPerson && insightsFlow.trigger?.type === 'event') {
                    logger.warn('⚠️', 'Person not found for custom flow invocation', {
                        insightsFlowId: insightsFlow.id,
                        distinctId: insightsFlowInvocationState.event.distinct_id,
                        invocationId: item.id,
                    })
                }

                const person: CyclotronPerson | undefined = dbPerson
                    ? {
                          id: dbPerson.id,
                          properties: dbPerson.properties,
                          name: personDisplayName,
                          url: `${this.hub.SITE_URL}/project/${insightsFlow.team_id}/person/${encodeURIComponent(
                              insightsFlowInvocationState.event.distinct_id
                          )}`,
                      }
                    : undefined

                const filterGlobals = convertToInsightsFunctionFilterGlobal({
                    event: insightsFlowInvocationState.event,
                    person,
                    // TODO: Load groups as well
                    groups: {},
                    variables: insightsFlowInvocationState.variables || {},
                })

                loadedInvocations.push({
                    ...item,
                    state: insightsFlowInvocationState,
                    insightsFlow,
                    person,
                    filterGlobals,
                })
            })
        )

        await this.cyclotronJobQueue.dequeueInvocations(failedInvocations)
        await this.cyclotronJobQueue.cancelInvocations(skippedInvocations)

        return loadedInvocations
    }
}
