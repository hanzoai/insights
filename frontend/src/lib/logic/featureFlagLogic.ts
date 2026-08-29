import insights from 'insights-js'
import { MakeLogicType, actions, afterMount, kea, listeners, path, reducers } from 'kea'

import api from 'lib/api'
import { FeatureFlagKey } from 'lib/constants'
import { getAppContext } from 'lib/utils/getAppContext'

import { AppContext } from '~/types'

export type FeatureFlagsSet = {
    [flag in FeatureFlagKey]?: boolean | string
}

/** A flag's payload is whatever JSON the definition carries. */
export type FeatureFlagPayloads = Record<string, any>

/** The verdict, exactly as the evaluator names it. */
interface FeatureFlagVerdict {
    featureFlags?: FeatureFlagsSet
    featureFlagPayloads?: FeatureFlagPayloads
    /** Did an evaluator actually decide this? False when the door answered without one. */
    evaluated?: boolean
}

const eventsNotified: Record<string, boolean> = {}
function notifyFlagIfNeeded(flag: string, flagState: string | boolean | undefined): void {
    if (!eventsNotified[flag]) {
        insights.capture('$feature_flag_called', {
            $feature_flag: flag,
            $feature_flag_response: flagState === undefined ? false : flagState,
        })
        eventsNotified[flag] = true
    }
}

function getPersistedFeatureFlags(appContext: AppContext | undefined = getAppContext()): FeatureFlagsSet {
    const persistedFeatureFlags = appContext?.persisted_feature_flags || []
    // The server sends a list of enabled flag keys (each maps to `true`). Storybook can
    // instead supply a record so a story can pin a multivariate variant (e.g. an
    // experiment arm) — those values ride this always-merged baseline and survive the
    // empty `onFeatureFlags` callback that insights-js fires on load.
    if (!Array.isArray(persistedFeatureFlags)) {
        return { ...persistedFeatureFlags }
    }
    return Object.fromEntries(persistedFeatureFlags.map((f) => [f, true]))
}

let cachedFlagsSerialized: string | null = null
let cachedFlagsProxy: FeatureFlagsSet | null = null

function spyOnFeatureFlags(featureFlags: FeatureFlagsSet): FeatureFlagsSet {
    // An evaluated verdict always wins over the deployment's own defaults.
    //
    // There used to be a `preflight.cloud || preflight.is_debug` gate here that
    // dropped the verdict entirely, which left PERSISTED_FEATURE_FLAGS -- a
    // comma-separated env var -- as the only lever that could turn a flag on.
    // `cloud` is an upstream multi-region SaaS concept this deployment does not
    // have, so it reads FALSE on our own hosted install: the same trap that once
    // advertised "Move to Insights Cloud" to our own paying users. Whether a
    // verdict is trustworthy is decided by who delivers it, not by a flag about
    // somebody else's hosting model, and the deliverer here is this deployment's
    // own session-authenticated door.
    const availableFlags = { ...getPersistedFeatureFlags(), ...featureFlags }

    const serialized = JSON.stringify(availableFlags)
    if (serialized === cachedFlagsSerialized && cachedFlagsProxy) {
        return cachedFlagsProxy
    }
    cachedFlagsSerialized = serialized

    if (typeof window.Proxy !== 'undefined') {
        cachedFlagsProxy = new Proxy(
            {},
            {
                get(_, flag) {
                    if (flag === 'toJSON') {
                        return () => availableFlags
                    }
                    const flagString = flag.toString()
                    const flagState = availableFlags[flagString as FeatureFlagKey]
                    notifyFlagIfNeeded(flagString, flagState)
                    return flagState
                },
            }
        )
        return cachedFlagsProxy
    }
    // Fallback for IE11. Won't track "false" results. ¯\_(ツ)_/¯
    const flags: FeatureFlagsSet = {}
    for (const flag of Object.keys(availableFlags)) {
        Object.defineProperty(flags, flag, {
            get: function () {
                if (flag === 'toJSON') {
                    return () => availableFlags
                }
                notifyFlagIfNeeded(flag, true)
                return true
            },
        })
    }
    cachedFlagsProxy = flags
    return flags
}

/** This user's verdict, from this deployment's own door.
 *
 * `/v1/flags/` is answered by Django over the session the browser already has;
 * it relays what Hanzo cloud's native evaluator decided for the signed-in user.
 * The browser holds no flag credential and this asks for no identity -- the
 * server evaluates whoever the session says is asking.
 *
 * Deliberately NOT the analytics SDK. The SDK is initialised with a stub token
 * and opted out of capturing on purpose, and routing flags through it would mean
 * standing its keyed, cross-origin protocol back up.
 */
function fetchVerdict(): Promise<FeatureFlagVerdict> {
    return api.get<FeatureFlagVerdict>('v1/flags/')
}

/** Is there a session for the server to evaluate?
 *
 * The shared-dashboard and exporter views render this app anonymously, and so
 * does every test that mounts it without saying otherwise.
 */
function hasSession(): boolean {
    return getAppContext()?.anonymous === false
}

export function getFeatureFlagPayload(flag: FeatureFlagKey): any {
    return featureFlagLogic.findMounted()?.values.featureFlagPayloads?.[flag]
}

// Generated by kea-typegen. Update if you're an agent, ignore if you're human.
export interface featureFlagLogicValues {
    featureFlagPayloads: FeatureFlagPayloads
    featureFlags: FeatureFlagsSet
    flagsUnavailable: boolean
    receivedFeatureFlags: boolean
}

// Generated by kea-typegen. Update if you're an agent, ignore if you're human.
export interface featureFlagLogicActions {
    setFeatureFlags: (
        flags: string[],
        variants: Record<string, boolean | string>,
        payloads?: FeatureFlagPayloads
    ) => {
        flags: string[]
        payloads: FeatureFlagPayloads
        variants: Record<string, boolean | string>
    }
    setFlagsUnavailable: (reason: string) => {
        reason: string
    }
}

export type featureFlagLogicType = MakeLogicType<featureFlagLogicValues, featureFlagLogicActions>

export const featureFlagLogic = kea<featureFlagLogicType>([
    path(['lib', 'logic', 'featureFlagLogic']),
    actions({
        // `payloads` is optional so that a caller who only cares which flags are
        // on -- every test that drives this logic -- keeps working unchanged.
        setFeatureFlags: (
            flags: string[],
            variants: Record<string, string | boolean>,
            payloads: FeatureFlagPayloads = {}
        ) => ({
            flags,
            variants,
            payloads,
        }),
        // Orthogonal to the flags themselves: "which flags are on" and "was anything
        // able to decide that" are different facts, and only one of them is a fault.
        setFlagsUnavailable: (reason: string) => ({ reason }),
    }),
    reducers({
        featureFlags: [
            getPersistedFeatureFlags(),
            { persist: true },
            {
                setFeatureFlags: (_, { variants }) => spyOnFeatureFlags(variants),
            },
        ],
        featureFlagPayloads: [
            {} as FeatureFlagPayloads,
            { persist: true },
            {
                setFeatureFlags: (_, { payloads }) => payloads,
            },
        ],
        receivedFeatureFlags: [
            false,
            {
                setFeatureFlags: () => true,
            },
        ],
        // Deliberately NOT persisted: this describes this page load's evaluation,
        // not the user. A stale `true` would accuse a healthy evaluator.
        flagsUnavailable: [
            false,
            {
                setFlagsUnavailable: () => true,
            },
        ],
    }),
    listeners(() => ({
        setFlagsUnavailable: ({ reason }) => {
            // Loud on purpose. Every flag-gated surface is absent while this is
            // true, and without a log line that absence is silent, so a reader
            // concludes the feature is switched off or that a change removing it
            // landed.
            console.error(
                `Feature flags could not be evaluated, so every flag reads as off: ${reason}. ` +
                    'A gated surface missing right now is not evidence that it was removed.'
            )
        },
    })),
    afterMount(({ actions }) => {
        // ALWAYS delivers, including on failure and including when there is
        // nothing to ask. The app blocks on `receivedFeatureFlags` for up to
        // three seconds before it renders, so silence here is a stalled product.
        // A failed evaluation grants nothing and leaves the deployment's defaults
        // standing -- fail closed, not fail slow.
        if (!hasSession()) {
            // Answered NOW, not on a microtask: a verdict that lands later would
            // overwrite whatever the caller set in the meantime, and "nothing to
            // evaluate" is already known here.
            actions.setFeatureFlags([], {}, {})
            return
        }
        void fetchVerdict()
            .then((verdict) => {
                actions.setFeatureFlags([], verdict.featureFlags ?? {}, verdict.featureFlagPayloads ?? {})
                // A door that answers without an evaluator behind it grants nothing,
                // which is indistinguishable from a deployment that turned nothing
                // on, so it has to record which of the two happened.
                if (verdict.evaluated === false) {
                    actions.setFlagsUnavailable('the door answered without an evaluated verdict')
                }
            })
            .catch((error) => {
                // Still grants nothing and still unblocks the render. The failure is
                // also recorded, because a surface missing due to a broken
                // evaluation looks exactly like one that is deliberately off.
                actions.setFeatureFlags([], {}, {})
                actions.setFlagsUnavailable(String(error?.message ?? error))
            })
    }),
])
