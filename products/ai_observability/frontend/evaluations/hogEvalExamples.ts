import examples from './hogEvalExamples.json'

export interface HogEvalExample {
    key: string
    label: string
    source: string
}

export const FN_EVAL_EXAMPLES: readonly HogEvalExample[] = examples

export function getHogEvalExample(key: string): HogEvalExample {
    const example = FN_EVAL_EXAMPLES.find((candidate) => candidate.key === key)
    if (!example) {
        throw new Error(`Unknown Script evaluation example: ${key}`)
    }
    return example
}
