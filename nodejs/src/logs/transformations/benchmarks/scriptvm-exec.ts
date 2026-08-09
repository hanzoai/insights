import { ExecResult, convertScriptToJS } from '@hanzo/scriptvm'

import { execScriptImmediate } from '~/cdp/utils/script-exec'

import type { BenchGlobals } from './fixtures'

// Thin wrapper over the production exec primitive so the benchmark measures the same
// VM + RE2 + crypto stack the per-record executor uses, including result conversion.
export function execBenchProgram(
    bytecode: unknown,
    globals: BenchGlobals,
    timeoutMs: number
): { execResult?: ExecResult; error?: unknown; durationMs: number } {
    const { execResult, error, durationMs } = execScriptImmediate(bytecode, {
        globals,
        timeout: timeoutMs,
        maxAsyncSteps: 0,
        functions: {
            print: () => {},
        },
    })

    if (execResult?.finished) {
        execResult.result = convertScriptToJS(execResult.result)
    }

    return { execResult, error, durationMs }
}
