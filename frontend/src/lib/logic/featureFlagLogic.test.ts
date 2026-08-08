import { expectLogic } from 'kea-test-utils'

import api from 'lib/api'
import { featureFlagLogic, getFeatureFlagPayload } from 'lib/logic/featureFlagLogic'

import { useMocks } from '~/mocks/jest'
import { initKeaTests } from '~/test/init'
import { AppContext } from '~/types'

/** The evaluator's own output, captured from `hanzoai/cloud` `apps/flags`.
 *
 * Not hand-written: this is what the shipped Go evaluator returned for three
 * definitions (a boolean rollout, a multivariate with a payload, and an inactive
 * flag). Note that an OFF flag arrives as `false` rather than absent -- the
 * reason a verdict has to be able to turn a deployment default back off.
 */
const REAL_VERDICT = {
    featureFlags: { 'new-editor': true, 'off-flag': false, theme: 'dark' },
    featureFlagPayloads: { theme: { hue: 2 } },
    errorsWhileComputingFlags: false,
}

function setAppContext(context: Record<string, any>): void {
    window.INSIGHTS_APP_CONTEXT = context as unknown as AppContext
}

describe('featureFlagLogic', () => {
    let logic: ReturnType<typeof featureFlagLogic.build>

    beforeEach(() => {
        localStorage.clear()
        setAppContext({ anonymous: false, persisted_feature_flags: [] })
        jest.restoreAllMocks()
    })

    afterEach(() => {
        logic?.unmount()
    })

    /** Every URL this logic asked its own backend for.
     *
     * Filtered rather than counted: `initKeaTests` mounts the common logics, which
     * make their own requests through the same client.
     */
    function flagRequests(get: jest.SpyInstance): string[] {
        return get.mock.calls.map((call) => call[0] as string).filter((url) => String(url).includes('flags'))
    }

    /** Mount with a given verdict on the wire and whatever the deployment defaults to. */
    // useMocks is msw's request stubber, not a React hook; the rule only sees the `use`
    // prefix. Every other test file calls it from an anonymous beforeEach arrow, which
    // the rule does not inspect. This one needs the verdict per call, so it lives in a
    // named helper and the rule applies. There is no React tree in this file at all.
    //
    // The directive sits HERE, on the function, because that is where the rule reports:
    // "React Hook useMocks is called in function mountFlags" is anchored at the
    // DECLARATION below, not at the call ten lines further down.
    // A -next-line directive above the call suppresses nothing, and one above a block of
    // explanation suppresses the first comment line.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    async function mountFlags(
        verdict: any,
        persisted: string[] = [],
        anonymous = false
    ): Promise<jest.SpyInstance> {
        useMocks({ get: { '/v1/flags/': typeof verdict === 'function' ? verdict : () => [200, verdict] } })
        setAppContext({ anonymous, persisted_feature_flags: persisted })
        // Before initKeaTests: it mounts the common logics, and this one rides
        // along with them, so a spy installed afterwards would miss its request.
        const get = jest.spyOn(api, 'get')
        initKeaTests()
        setAppContext({ anonymous, persisted_feature_flags: persisted })
        logic = featureFlagLogic()
        logic.mount()
        await expectLogic(logic).toDispatchActions(['setFeatureFlags'])
        return get
    }

    it('asks this deployment for the verdict, at /v1/flags/ and never under /api/', async () => {
        const get = await mountFlags(REAL_VERDICT)

        expect(flagRequests(get)).toEqual(['v1/flags/'])
        const url = flagRequests(get)[0]
        expect(url).not.toContain('/api/')
        expect(url).not.toContain('v2')
    })

    it('honours an evaluated flag even though preflight.cloud is false', async () => {
        // The regression this exists for: `cloud` is an upstream multi-region SaaS
        // concept this deployment does not have, so it reads false on our own
        // hosted install. A verdict has to survive that.
        useMocks({ get: { '/v1/flags/': () => [200, REAL_VERDICT] } })
        initKeaTests()
        setAppContext({
            anonymous: false,
            persisted_feature_flags: [],
            preflight: { cloud: false, is_debug: false },
        })
        logic = featureFlagLogic()
        logic.mount()
        await expectLogic(logic).toDispatchActions(['setFeatureFlags'])

        expect(logic.values.featureFlags['new-editor' as never]).toBe(true)
    })

    it('carries a variant through, not just a boolean', async () => {
        await mountFlags(REAL_VERDICT)

        expect(logic.values.featureFlags['theme' as never]).toBe('dark')
    })

    it('lets the verdict turn a deployment default back off', async () => {
        await mountFlags(REAL_VERDICT, ['off-flag'])

        expect(logic.values.featureFlags['off-flag' as never]).toBe(false)
    })

    it('keeps a deployment default the verdict does not mention', async () => {
        await mountFlags(REAL_VERDICT, ['a-default'])

        expect(logic.values.featureFlags['a-default' as never]).toBe(true)
        expect(logic.values.featureFlags['new-editor' as never]).toBe(true)
    })

    it('exposes payloads from the verdict', async () => {
        await mountFlags(REAL_VERDICT)

        expect(getFeatureFlagPayload('theme' as never)).toEqual({ hue: 2 })
        expect(getFeatureFlagPayload('absent' as never)).toBeUndefined()
    })

    it('a refused evaluation grants nothing and still unblocks the app', async () => {
        // The app waits on receivedFeatureFlags before it renders anything, so a
        // failure that stayed silent would be a blank product for three seconds.
        await mountFlags(() => [502, { featureFlags: {}, featureFlagPayloads: {}, detail: 'nope' }], ['a-default'])

        expect(logic.values.receivedFeatureFlags).toBe(true)
        expect(logic.values.featureFlags['a-default' as never]).toBe(true)
        expect(logic.values.featureFlags['never-granted' as never]).toBeUndefined()
    })

    it('says evaluation failed, instead of looking like nothing is turned on', async () => {
        // The regression this exists for: a broken evaluator and a deployment with
        // nothing turned on produce the same empty set, so a reader checking
        // whether a gated control is gone cannot tell which one they are seeing.
        await mountFlags(() => [502, { featureFlags: {}, featureFlagPayloads: {}, evaluated: false }])
        await expectLogic(logic).toDispatchActions(['setFlagsUnavailable'])

        expect(logic.values.flagsUnavailable).toBe(true)
        // Still fails closed, and still unblocks the render.
        expect(logic.values.receivedFeatureFlags).toBe(true)
        expect(logic.values.featureFlags['new-editor' as never]).toBeUndefined()
    })

    it('says so when the door answers without an evaluator behind it', async () => {
        // 200, well-formed, and nothing evaluated it. It grants the same nothing as
        // a 502, so the only thing separating it from a verdict is this signal.
        await mountFlags({ featureFlags: {}, featureFlagPayloads: {}, evaluated: false })
        await expectLogic(logic).toDispatchActions(['setFlagsUnavailable'])

        expect(logic.values.flagsUnavailable).toBe(true)
    })

    it('does not cry outage when the evaluator ran and turned nothing on', async () => {
        // The live state this had to distinguish: cloud evaluates cleanly and holds
        // no definitions, so an empty verdict is correct and entirely trustworthy.
        await mountFlags({ featureFlags: {}, featureFlagPayloads: {}, evaluated: true })

        expect(logic.values.flagsUnavailable).toBe(false)
        expect(logic.values.receivedFeatureFlags).toBe(true)
    })

    it('does not ask for a verdict when there is no session to evaluate', async () => {
        // The shared-dashboard and exporter views render this app anonymously.
        const get = await mountFlags(REAL_VERDICT, ['a-default'], true)

        expect(flagRequests(get)).toEqual([])
        // Still unblocks, still keeps the defaults, still grants nothing else.
        expect(logic.values.receivedFeatureFlags).toBe(true)
        expect(logic.values.featureFlags['a-default' as never]).toBe(true)
        expect(logic.values.featureFlags['new-editor' as never]).toBeUndefined()
    })

    it('still accepts a two-argument setFeatureFlags, which every other test uses', async () => {
        await mountFlags(REAL_VERDICT)

        logic.actions.setFeatureFlags([], { injected: true })

        expect(logic.values.featureFlags['injected' as never]).toBe(true)
    })
})
