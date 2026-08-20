import { instrumented } from '~/common/tracing/tracing-utils'
import { logger } from '~/common/utils/logger'
import { PluginsServerConfig } from '~/types'

import { JobQueue } from '../services/job-queue/job-queue.interface'
import { CyclotronJobInvocation, CyclotronJobInvocationFlow, CyclotronJobInvocationResult } from '../types'
import { convertToInsightsFunctionFilterGlobal } from '../utils/script-function-filtering'
import { CdpConsumerBaseDeps } from './cdp-base.consumer'
import { CdpCyclotronWorker } from './cdp-cyclotron-worker.consumer'

export class CdpCyclotronWorkerFlow extends CdpCyclotronWorker {
    protected override name = 'CdpCyclotronWorkerFlow'

    constructor(config: PluginsServerConfig, deps: CdpConsumerBaseDeps, jobQueue: JobQueue) {
        super(config, deps, jobQueue, 'flow')
    }

    @instrumented('cdpConsumer.handleEachBatch.executeInvocations')
    public override async processInvocations(
        invocations: CyclotronJobInvocation[]
    ): Promise<CyclotronJobInvocationResult[]> {
        const loadedInvocations = await this.loadFlows(invocations)
        return await Promise.all(loadedInvocations.map((item) => this.flowExecutor.execute(item)))
    }

    @instrumented('cdpConsumer.handleEachBatch.loadFlows')
    protected async loadFlows(invocations: CyclotronJobInvocation[]): Promise<CyclotronJobInvocationFlow[]> {
        const loadedInvocations: CyclotronJobInvocationFlow[] = []
        const failedInvocations: CyclotronJobInvocation[] = []
        const skippedInvocations: CyclotronJobInvocation[] = []

        await Promise.all(
            invocations.map(async (item) => {
                const team = await this.deps.teamManager.getTeam(item.teamId)
                const flow = await this.flowManager.getFlow(item.functionId)
                if (!flow || !team) {
                    logger.error('⚠️', 'Error finding script flow', {
                        id: item.functionId,
                    })

                    failedInvocations.push(item)

                    return
                }

                // Skip execution if the workflow is no longer active (e.g., disabled/archived)
                if (flow.status !== 'active') {
                    logger.info('⏭️', 'Skipping script flow invocation - workflow is no longer active', {
                        id: item.functionId,
                        status: flow.status,
                    })

                    skippedInvocations.push(item)

                    return
                }

                const flowInvocationState = item.state as CyclotronJobInvocationFlow['state']

                // Warehouse-row invocations don't have a real person — the row is the unit of work
                // and person-dependent steps no-op for these flows. Explicitly skip the person lookup
                // rather than relying on event.distinct_id being empty so future changes to the
                // synthetic event shape don't accidentally re-enable the lookup.
                const isWarehouseRow = flow.trigger?.type === 'data-warehouse-table'
                // Account-audience batch invocations carry the account's group key as
                // event.distinct_id; resolving it as a person distinct_id would attach an
                // unrelated person to the run. Accounts have no person — skip the lookup.
                // The state stamp wins over the live trigger, which may have been edited to a
                // person audience while these children were queued; the trigger check remains
                // as a fallback for jobs enqueued before the stamp existed.
                const isAccountAudience =
                    flowInvocationState.accountAudience === true ||
                    (flow.trigger?.type === 'batch' && flow.trigger.filters?.audience_type === 'accounts')
                // The matcher wrote this job's personId anchor: a merge repointed the distinct_id onto a
                // survivor, or the distinct_id acquired its first person. Resolve by that personId so the step
                // reads the right person — resolving by the distinct_id would hit its stale ~1min cache entry
                // (the pre-merge person, or none at all) and e.g. drop an email.
                const resolveByRepointedPerson =
                    flowInvocationState.personIdRepointed === true && !!flowInvocationState.personId
                // One-shot: consume the flag on this wake-resolution only. Later steps fall back to normal
                // distinct_id-first resolution, which self-heals to the latest survivor if the distinct_id is
                // repointed again (a second merge onto a non-wait step is out of processMoveBatch's scope).
                if (resolveByRepointedPerson) {
                    delete flowInvocationState.personIdRepointed
                }
                const personIdOrDistinctId =
                    isWarehouseRow || isAccountAudience
                        ? undefined
                        : resolveByRepointedPerson
                          ? flowInvocationState.personId
                          : flowInvocationState.event.distinct_id || flowInvocationState.personId
                const kind =
                    resolveByRepointedPerson || !flowInvocationState.event.distinct_id ? 'person_id' : 'distinct_id'

                const [person, groups] = await Promise.all([
                    personIdOrDistinctId
                        ? this.personsManager.getCyclotronPerson(flow.team_id, personIdOrDistinctId, kind)
                        : undefined,
                    this.groupsManager.getGroupsForEvent(
                        flow.team_id,
                        flowInvocationState.event.properties,
                        `${this.config.SITE_URL}/project/${flow.team_id}`
                    ),
                ])

                if (!person && flow.trigger?.type === 'event') {
                    logger.warn('⚠️', 'Person not found for script flow invocation', {
                        flowId: flow.id,
                        distinctId: flowInvocationState.event?.distinct_id || flowInvocationState.personId,
                        invocationId: item.id,
                    })
                }

                // Batch-triggered invocations arrive with an empty event.distinct_id because the
                // blast-radius query returns UUIDs only. The person lookup above resolves one
                // distinct_id for us (when the person has any), so backfill it here so templates
                // defaulting to `{event.distinct_id}` resolve at script runtime.
                if (!flowInvocationState.event.distinct_id && person?.distinct_id) {
                    flowInvocationState.event.distinct_id = person.distinct_id
                }

                // Persist the resolved person UUID into state so a re-parked wait keeps its person_id
                // even when a later re-resolution transiently misses. datastore_person wakes match on
                // person_id only, so a wait parked with person_id = null could never be woken by a
                // person-property change — it would depend entirely on the polling backstop.
                if (person?.id && !flowInvocationState.personId) {
                    flowInvocationState.personId = person.id
                }

                const filterGlobals = convertToInsightsFunctionFilterGlobal({
                    event: flowInvocationState.event,
                    person: person ?? undefined,
                    groups,
                    variables: flowInvocationState.variables || {},
                })

                loadedInvocations.push({
                    ...item,
                    state: flowInvocationState,
                    flow,
                    person: person ?? undefined,
                    groups,
                    filterGlobals,
                })
            })
        )

        await this.cyclotronJobQueue.dequeueInvocations(failedInvocations)
        await this.cyclotronJobQueue.cancelInvocations(skippedInvocations)

        return loadedInvocations
    }
}
