import crypto from 'crypto'
import { Counter } from 'prom-client'

import { DEFAULT_TIMEOUT_MS, ExecOptions, ExecResult, exec } from '@posthog/scriptvm'

import { instrumentFn } from '~/common/tracing/tracing-utils'

import { createTrackedRE2 } from '../../utils/tracked-re2'
import { Semaphore } from './sempahore'

export const MAX_THREAD_WAIT_TIME_MS = 200

const scriptExecThreadReliefCounter = new Counter({
    name: 'cdp_insights_function_execution_thread_relief',
    help: 'Whether the custom function execution was blocked by the thread relief',
    // We have a timeout so we don't need to worry about much more than that
    labelNames: ['waited'],
})

const semaphore = new Semaphore(1)

let threadRelief: {
    startedAt: number
    promise: Promise<void>
} | null = null

const waitForThreadRelief = async (timeout: number = DEFAULT_TIMEOUT_MS): Promise<boolean> => {
    if (!threadRelief) {
        threadRelief = {
            startedAt: performance.now(),
            promise: new Promise((resolve) => {
                setTimeout(() => {
                    threadRelief = null
                    resolve()
                }, 0)
            }),
        }
    }

    if (performance.now() - threadRelief.startedAt < timeout) {
        return false
    }

    await threadRelief.promise

    return true
}

// NOTE: Script execution can be expensive and in really bad cases can block the event loop for a long time.
// To work around this we have a check when we run it to make sure that
export async function execFn(
    bytecode: any,
    options?: ExecOptions
): Promise<{
    execResult?: ExecResult
    error?: any
    durationMs: number
    waitedForThreadRelief: boolean
}> {
    return await semaphore.run(async () => {
        return await instrumentFn(`script-exec`, async () => {
            const waitedForInitialRelief = await waitForThreadRelief(options?.timeout)
            const result = execFnImmediate(bytecode, options)
            const waitedForFinalRelief = await waitForThreadRelief(options?.timeout)

            const waitedForThreadRelief = waitedForInitialRelief || waitedForFinalRelief
            scriptExecThreadReliefCounter.inc({ waited: waitedForThreadRelief ? 'true' : 'false' })

            return {
                ...result,
                waitedForThreadRelief,
            }
        })
    })
}

function execFnImmediate(
    bytecode: any,
    options?: ExecOptions
): {
    execResult?: ExecResult
    error?: any
    durationMs: number
} {
    const now = performance.now()
    let execResult: ExecResult | undefined
    let error: any

    try {
        execResult = exec(bytecode, {
            timeout: DEFAULT_TIMEOUT_MS,
            maxAsyncSteps: 0,
            ...options,
            external: {
                regex: { match: (regex: string, str: string) => createTrackedRE2(regex, undefined, 'script-exec:regex.match').test(str) },
                crypto,
                ...options?.external,
            },
        })
    } catch (e) {
        error = e
    }

    return {
        execResult,
        error,
        durationMs: performance.now() - now,
    }
}
