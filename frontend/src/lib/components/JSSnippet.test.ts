import { runInNewContext } from 'node:vm'

import { snippetFunctions } from '@hanzo/shared-onboarding/product-analytics'

type SnippetConfig = { api_host: string }
type InitQueueEntry = [token: string, config: SnippetConfig, name: string]

type SnippetStub = unknown[] & {
    _i: InitQueueEntry[]
    init: (token: string, config: SnippetConfig, name?: string) => void
}

type ScriptElement = {
    async?: boolean
    crossOrigin?: string
    onerror?: () => void
    src?: string
    type?: string
}

describe('JavaScript snippet', () => {
    it('queues every init while loading array.js once and retries after a load failure', () => {
        const insertedScripts: ScriptElement[] = []
        const snippetWindow: { insights?: SnippetStub } = {}
        const snippetDocument = {
            createElement: (): ScriptElement => ({}),
            getElementsByTagName: () => [
                {
                    parentNode: {
                        insertBefore: (script: ScriptElement): void => {
                            insertedScripts.push(script)
                        },
                    },
                },
            ],
        }

        runInNewContext(snippetFunctions(['capture']), { document: snippetDocument, window: snippetWindow })

        const insights = snippetWindow.insights
        expect(insights).not.toBeUndefined()
        if (!insights) {
            return
        }

        const config = { api_host: 'https://us.i.hanzo.ai' }
        insights.init('pk-first', config)
        insights.init('pk-second', config, 'project2')

        expect(insertedScripts).toHaveLength(1)
        expect(insights._i).toHaveLength(2)
        expect(insights._i[0][0]).toBe('pk-first')
        expect(insights._i[1][0]).toBe('pk-second')
        expect(insights._i[1][2]).toBe('project2')

        insertedScripts[0].onerror?.()
        insights.init('pk-third', config, 'project3')

        expect(insertedScripts).toHaveLength(2)
        expect(insights._i).toHaveLength(3)
    })
})
