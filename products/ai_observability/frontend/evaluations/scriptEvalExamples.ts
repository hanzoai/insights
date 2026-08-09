import examples from './scriptEvalExamples.json'

export interface ScriptEvalExample {
    key: string
    label: string
    source: string
}

export const INSIGHTS_EVAL_EXAMPLES: readonly ScriptEvalExample[] = examples

export function getScriptEvalExample(key: string): ScriptEvalExample {
    const example = INSIGHTS_EVAL_EXAMPLES.find((candidate) => candidate.key === key)
    if (!example) {
        throw new Error(`Unknown Script evaluation example: ${key}`)
    }
    return example
}
