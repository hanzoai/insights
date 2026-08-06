import { IconNotebook } from '@hanzo/icons'
import { Button } from '@hanzo/elements'

import { IconOpenInNew } from 'lib/elements/icons'
import { urls } from 'scenes/urls'

import { MessageTemplate } from '../../../messages/MessageTemplate'
import { DataToolRow } from '../DataToolRow'
import { GenericMcpToolRenderer } from '../GenericMcpToolRenderer'
import type { ToolRendererProps } from '../toolRegistry'
import { parseToolOutputRecord } from './extractors'

/** The notebook fields the widget renders, pulled from the REST payload. */
export interface NotebookExtraction {
    shortId: string
    title?: string
    url?: string
}

/**
 * Pulls the rendered fields out of a notebook tool's `rawOutput` — the REST notebook payload
 * (`short_id`, `title`, ProseMirror `content`, …) plus the MCP server's `_insightsUrl` enrichment.
 * `short_id` is required: outputs without it aren't a notebook payload and fall back to the
 * generic card.
 */
export function extractNotebook(message: ToolRendererProps['message']): NotebookExtraction | null {
    const output = parseToolOutputRecord(message)
    if (!output) {
        return null
    }

    const { short_id, title, _insightsUrl } = output as { short_id?: unknown; title?: unknown; _insightsUrl?: unknown }
    if (typeof short_id !== 'string') {
        return null
    }

    const inputTitle = message.innerInput?.title
    return {
        shortId: short_id,
        title: typeof title === 'string' ? title : typeof inputTitle === 'string' ? inputTitle : undefined,
        url: typeof _insightsUrl === 'string' ? _insightsUrl : undefined,
    }
}

/**
 * Notebook create / update / get tool calls. The tool already persisted the notebook server-side,
 * so v1 is a status line + "Open notebook" CTA — no inline preview, since the REST `content` is a
 * ProseMirror document, not the assistant block format `NotebookArtifactAnswer` renders.
 * Pre-completion or malformed output falls back to the generic card.
 */
export function CreateNotebookWidget(props: ToolRendererProps): JSX.Element {
    const { message } = props
    const notebook = message.status === 'completed' ? extractNotebook(message) : null

    if (!notebook) {
        return <GenericMcpToolRenderer {...props} />
    }

    return (
        <DataToolRow {...props}>
            <MessageTemplate type="ai" wrapperClassName="w-full">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                        <IconNotebook className="text-base" />
                        <span className="font-medium">{notebook.title || 'Notebook ready'}</span>
                    </div>
                    <Button
                        to={notebook.url ?? urls.notebook(notebook.shortId)}
                        targetBlank
                        icon={<IconOpenInNew />}
                        size="xsmall"
                        tooltip="Open notebook"
                    >
                        Open notebook
                    </Button>
                </div>
            </MessageTemplate>
        </DataToolRow>
    )
}
