import { instrumented } from '~/common/tracing/tracing-utils'

import { Hub } from '../../types'
import { logger } from '../../utils/logger'
import {
    CyclotronJobInvocation,
    CyclotronJobInvocationCustomFlow,
    CyclotronJobInvocationResult,
    CyclotronPerson,
} from '../types'
import { getPersonDisplayName } from '../utils'
import { convertToCustomFunctionFilterGlobal } from '../utils/custom-function-filtering'
import { CdpCyclotronWorker, CdpCyclotronWorkerHub } from './cdp-cyclotron-worker.consumer'

/**
 * Hub type for CdpCyclotronWorkerCustomFlow.
 * Extends CdpCyclotronWorkerHub with customflow-specific fields.
 */
export type CdpCyclotronWorkerCustomFlowHub = CdpCyclotronWorkerHub & Pick<Hub, 'teamManager'>

export class CdpCyclotronWorkerCustomFlow extends CdpCyclotronWorker<CdpCyclotronWorkerCustomFlowHub> {
    protected name = 'CdpCyclotronWorkerCustomFlow'

    constructor(hub: CdpCyclotronWorkerCustomFlowHub) {
        super(hub, 'customflow')
    }

    @instrumented('cdpConsumer.handleEachBatch.executeInvocations')
    public async processInvocations(invocations: CyclotronJobInvocation[]): Promise<CyclotronJobInvocationResult[]> {
        const loadedInvocations = await this.loadCustomFlows(invocations)
        return await Promise.all(loadedInvocations.map((item) => this.customFlowExecutor.execute(item)))
    }

    @instrumented('cdpConsumer.handleEachBatch.loadCustomFlows')
    protected async loadCustomFlows(invocations: CyclotronJobInvocation[]): Promise<CyclotronJobInvocationCustomFlow[]> {
        const loadedInvocations: CyclotronJobInvocationCustomFlow[] = []
        const failedInvocations: CyclotronJobInvocation[] = []
        const skippedInvocations: CyclotronJobInvocation[] = []

        await Promise.all(
            invocations.map(async (item) => {
                const team = await this.hub.teamManager.getTeam(item.teamId)
                const customFlow = await this.customFlowManager.getCustomFlow(item.functionId)
                if (!customFlow || !team) {
                    logger.error('⚠️', 'Error finding custom flow', {
                        id: item.functionId,
                    })

                    failedInvocations.push(item)

                    return null
                }

                // Skip execution if the workflow is no longer active (e.g., disabled/archived)
                if (customFlow.status !== 'active') {
                    logger.info('⏭️', 'Skipping custom flow invocation - workflow is no longer active', {
                        id: item.functionId,
                        status: customFlow.status,
                    })

                    skippedInvocations.push(item)

                    return null
                }

                const customFlowInvocationState = item.state as CyclotronJobInvocationCustomFlow['state']

                const dbPerson = await this.personsManager.get({
                    teamId: customFlow.team_id,
                    distinctId: customFlowInvocationState.event.distinct_id,
                })

                const personDisplayName = getPersonDisplayName(
                    team,
                    customFlowInvocationState.event.distinct_id,
                    dbPerson?.properties ?? {}
                )

                if (!dbPerson && customFlow.trigger?.type === 'event') {
                    logger.warn('⚠️', 'Person not found for custom flow invocation', {
                        customFlowId: customFlow.id,
                        distinctId: customFlowInvocationState.event.distinct_id,
                        invocationId: item.id,
                    })
                }

                const person: CyclotronPerson | undefined = dbPerson
                    ? {
                          id: dbPerson.id,
                          properties: dbPerson.properties,
                          name: personDisplayName,
                          url: `${this.hub.SITE_URL}/project/${customFlow.team_id}/person/${encodeURIComponent(
                              customFlowInvocationState.event.distinct_id
                          )}`,
                      }
                    : undefined

                const filterGlobals = convertToCustomFunctionFilterGlobal({
                    event: customFlowInvocationState.event,
                    person,
                    // TODO: Load groups as well
                    groups: {},
                    variables: customFlowInvocationState.variables || {},
                })

                loadedInvocations.push({
                    ...item,
                    state: customFlowInvocationState,
                    customFlow,
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
