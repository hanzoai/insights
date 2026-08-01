import '@testing-library/jest-dom'

import { cleanup, fireEvent, render, screen } from '@testing-library/react'

import type { ToolCallMessage } from 'products/insights_ai/frontend/types/toolTypes'

import { resolveToolCall } from '../../utils/toolResolver'
import { InsightsCodeToolRenderer, POSTFN_CODE_TOOLS_SERVER } from './insightsCodeToolRenderers'
import { lookupToolRenderer } from './toolRegistry'

function textBlock(text: string): unknown {
    return { type: 'content', content: { type: 'text', text } }
}

function qualified(tool: string): string {
    return `mcp__${POSTFN_CODE_TOOLS_SERVER}__${tool}`
}

function makeMessage(overrides: Partial<ToolCallMessage> = {}): ToolCallMessage {
    return {
        id: 'tc-1',
        resolvedKey: qualified('git_signed_commit'),
        rawServerName: 'insights',
        rawToolName: '',
        rawInput: {},
        content: [],
        status: 'completed',
        ...overrides,
    }
}

describe('insights-code tool renderers', () => {
    afterEach(() => cleanup())

    it('renders each signed commit as a GitHub link to its commit URL', () => {
        render(
            <InsightsCodeToolRenderer
                isLastInGroup
                message={makeMessage({
                    resolvedKey: qualified('git_signed_commit'),
                    rawInput: { message: 'fix(api): handle null series' },
                    content: [
                        textBlock(
                            'Created 2 signed commit(s) on insights-code/foo:\n' +
                                '- a1b2c3d https://github.com/insights/insights/commit/a1b2c3dabcdef\n' +
                                '- e4f5a6b https://github.com/insights/insights/commit/e4f5a6babcdef'
                        ),
                    ],
                })}
            />
        )
        expect(screen.getByText('Signed commits · 2 commits')).toBeInTheDocument()
        expect(screen.getByText('fix(api): handle null series')).toBeInTheDocument()
        // The commit links live in the collapsed accordion, not always-visible — reveal them first.
        expect(screen.queryByText(/a1b2c3d/)).not.toBeInTheDocument()
        fireEvent.click(screen.getByRole('button'))
        expect(screen.getByText(/a1b2c3d/).closest('a')).toHaveAttribute(
            'href',
            'https://github.com/insights/insights/commit/a1b2c3dabcdef'
        )
        expect(screen.getByText(/e4f5a6b/).closest('a')).toHaveAttribute(
            'href',
            'https://github.com/insights/insights/commit/e4f5a6babcdef'
        )
    })

    it.each([
        ['git_signed_commit', { message: 'fix: x', branch: 'b' }, 'fix: x'],
        ['git_signed_merge', { base: 'master', branch: 'feature' }, 'master → feature'],
        ['git_signed_rewrite', { branch: 'feature' }, 'feature'],
    ])('derives the %s subtitle from its inputs', (tool, rawInput, expected) => {
        render(
            <InsightsCodeToolRenderer isLastInGroup message={makeMessage({ resolvedKey: qualified(tool), rawInput })} />
        )
        expect(screen.getByText(expected)).toBeInTheDocument()
    })

    it('falls back to the raw text when a merge reports nothing to do', () => {
        render(
            <InsightsCodeToolRenderer
                isLastInGroup
                message={makeMessage({
                    resolvedKey: qualified('git_signed_merge'),
                    rawInput: { base: 'master', branch: 'feature' },
                    content: [textBlock('feature is already up to date with master; nothing to merge.')],
                })}
            />
        )
        expect(screen.getByText('Signed merge')).toBeInTheDocument()
        fireEvent.click(screen.getByRole('button'))
        expect(screen.getByText(/already up to date/)).toBeInTheDocument()
    })

    it('lists repositories as links to their GitHub pages', () => {
        render(
            <InsightsCodeToolRenderer
                isLastInGroup
                message={makeMessage({
                    resolvedKey: qualified('list_repos'),
                    content: [
                        textBlock('insights/insights: Product analytics platform\ninsights/insights-js: JavaScript SDK'),
                    ],
                })}
            />
        )
        expect(screen.getByText('List repositories · 2')).toBeInTheDocument()
        fireEvent.click(screen.getByRole('button'))
        expect(screen.getByText('Product analytics platform')).toBeInTheDocument()
        expect(screen.getByText(/insights-js/).closest('a')).toHaveAttribute(
            'href',
            'https://github.com/insights/insights-js'
        )
    })

    it('links the cloned repo and shows the target path', () => {
        render(
            <InsightsCodeToolRenderer
                isLastInGroup
                message={makeMessage({
                    resolvedKey: qualified('clone_repo'),
                    rawInput: { repo: 'insights/insights', branch: 'main' },
                    content: [
                        textBlock(
                            'Cloned insights/insights (insights) to /home/user/repos/insights/insights on branch main.'
                        ),
                    ],
                })}
            />
        )
        expect(screen.getByText('Clone repository')).toBeInTheDocument()
        expect(screen.getByText(/insights\/insights/).closest('a')).toHaveAttribute(
            'href',
            'https://github.com/insights/insights'
        )
        fireEvent.click(screen.getByRole('button'))
        expect(screen.getByText(/\/home\/user\/repos\/insights\/insights/)).toBeInTheDocument()
    })

    // The resolver yields the qualified key on the Claude-SDK wire path and the bare key on a native MCP
    // path; the registry must map both so neither adapter falls through to the generic wrench card.
    it.each([
        [
            'claude-sdk',
            {
                rawServerName: 'insights',
                rawToolName: '',
                input: {},
                meta: { claudeCode: { toolName: qualified('git_signed_commit') } },
            },
            qualified('git_signed_commit'),
        ],
        [
            'native-mcp',
            { rawServerName: POSTFN_CODE_TOOLS_SERVER, rawToolName: 'git_signed_commit', input: {}, meta: undefined },
            'git_signed_commit',
        ],
    ])('resolves the %s key shape to the signed-commit renderer', (_label, toolCall, expectedKey) => {
        const resolved = resolveToolCall(toolCall)
        expect(resolved.resolvedKey).toEqual(expectedKey)
        // The insights-code git tools aren't origin-gated, so they resolve for a non-exec call too.
        expect(lookupToolRenderer(resolved.resolvedKey, resolved.innerToolName != null).displayName).toEqual(
            'Signed commits'
        )
    })
})
