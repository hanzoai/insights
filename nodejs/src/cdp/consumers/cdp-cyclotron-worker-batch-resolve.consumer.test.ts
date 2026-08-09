import { Team } from '~/types'

import { CyclotronJobInvocationFlow } from '../types'
import { buildAccountFlowInvocation } from './cdp-cyclotron-worker-batch-resolve.consumer'

describe('buildAccountFlowInvocation', () => {
    const team = { id: 123, name: 'Test team' } as Team

    it('carries the account group key and no person', () => {
        const invocation = buildAccountFlowInvocation({
            siteUrl: 'https://us.hanzo.ai',
            parentRunId: 'batch-job-1',
            team,
            flowId: 'flow-1',
            flowVersion: 4,
            externalId: 'acme-1',
            groupType: 'customer',
            defaultVariables: { greeting: 'hi' },
        })

        const state = invocation.state as CyclotronJobInvocationFlow['state']

        expect(state.event.event).toEqual('$batch_hog_flow_invocation')
        // distinct_id doubles as the per-account key for invocation_results; it must NOT
        // resolve to a person (the flow worker skips the lookup for account audiences).
        expect(state.event.distinct_id).toEqual('acme-1')
        expect(state.event.properties['$groups']).toEqual({ customer: 'acme-1' })
        expect(state.personId).toBeUndefined()
        // The stamp is what the flow worker trusts when the live trigger has been
        // edited to a person audience while these children were still queued.
        expect(state.accountAudience).toBe(true)
        // Account broadcasts convert long after the send, so the run has to carry the version
        // that sent or the conversion is credited to whatever is published by then.
        expect(state.flowVersion).toBe(4)
        expect(state.variables).toEqual({ greeting: 'hi' })
        expect(invocation.parentRunId).toEqual('batch-job-1')
        expect(invocation.queue).toEqual('hogflow')
        expect((invocation as any).person).toBeUndefined()
    })
})
