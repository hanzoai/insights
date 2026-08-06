import type { InsightsQLParser } from '@hanzo/insightsql-parser'

let parserPromise: Promise<InsightsQLParser> | null = null

function getParser(): Promise<InsightsQLParser> {
    if (!parserPromise) {
        parserPromise = import('@hanzo/insightsql-parser')
            .then((mod) => mod.default())
            .catch((error) => {
                // Reset so next call retries initialization
                parserPromise = null
                throw error
            })
    }
    return parserPromise
}

export async function parseSelect(input: string, isInternal?: boolean): Promise<string> {
    const parser = await getParser()
    return parser.parseSelect(input, isInternal)
}

export async function parseExpr(input: string, isInternal?: boolean): Promise<string> {
    const parser = await getParser()
    return parser.parseExpr(input, isInternal)
}

export async function parseOrderExpr(input: string, isInternal?: boolean): Promise<string> {
    const parser = await getParser()
    return parser.parseOrderExpr(input, isInternal)
}

export async function parseProgram(input: string, isInternal?: boolean): Promise<string> {
    const parser = await getParser()
    return parser.parseProgram(input, isInternal)
}

export async function parseFullTemplateString(input: string, isInternal?: boolean): Promise<string> {
    const parser = await getParser()
    return parser.parseFullTemplateString(input, isInternal)
}

export async function parseStringLiteralText(input: string): Promise<string> {
    const parser = await getParser()
    return parser.parseStringLiteralText(input)
}
