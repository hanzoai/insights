import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import { describe, expect, it } from 'vitest'

import { AGENTS_MD_SNIPPET, installAgentsMdSnippet } from '@/cli/agents-md'

describe('CLI AGENTS.md installer', () => {
    it('wraps the installed snippet in a <insights> block', () => {
        expect(AGENTS_MD_SNIPPET.startsWith('<insights>\n')).toBe(true)
        expect(AGENTS_MD_SNIPPET.endsWith('\n</insights>')).toBe(true)
    })

    it('installs the snippet idempotently', async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'insights-agents-md-'))
        const target = path.join(dir, 'AGENTS.md')
        await fs.writeFile(target, '# Project\n\nExisting instructions.\n')

        await installAgentsMdSnippet({ filePath: target })
        await installAgentsMdSnippet({ filePath: target })

        const content = await fs.readFile(target, 'utf-8')
        expect(content.match(/<insights>/g)?.length).toBe(1)
        expect(content).toContain('Existing instructions.')
    })

    it('replaces a stale <insights> block in place', async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'insights-agents-md-'))
        const target = path.join(dir, 'AGENTS.md')
        await fs.writeFile(
            target,
            '# Project\n\n<insights>\nOutdated Insights guidance.\n</insights>\n\nTrailing instructions.\n'
        )

        await installAgentsMdSnippet({ filePath: target })

        const content = await fs.readFile(target, 'utf-8')
        expect(content).not.toContain('Outdated Insights guidance.')
        expect(content.match(/<insights>/g)?.length).toBe(1)
        expect(content.indexOf('# Project')).toBeLessThan(content.indexOf('<insights>'))
        expect(content.indexOf('</insights>')).toBeLessThan(content.indexOf('Trailing instructions.'))
    })
})
