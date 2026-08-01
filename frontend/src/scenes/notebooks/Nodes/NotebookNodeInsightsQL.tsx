import clsx from 'clsx'
import { useActions, useMountedLogic, useValues } from 'kea'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useDebouncedCallback } from 'use-debounce'

import { IconCornerDownRight } from '@hanzo/icons'

import { createInsightsWidgetNode } from 'scenes/notebooks/Nodes/NodeWrapper'

import { NotebookNodeAttributeProperties, NotebookNodeProps, NotebookNodeType } from '../types'
import { NotebookDataframeTable } from './components/NotebookDataframeTable'
import { getCellLabel } from './components/NotebookNodeTitle'
import { NotebookCodeSQLEditorSettings } from './components/NotebookSQLEditor'
import { notebookNodeLogic } from './notebookNodeLogic'
import { PythonExecutionMedia, PythonExecutionResult } from './pythonExecution'
import { buildMediaSource, renderAnsiText } from './utils'

export type NotebookNodeInsightsQLAttributes = {
    code: string
    returnVariable: string
    insightsqlExecution?: PythonExecutionResult | null
    insightsqlExecutionCodeHash?: number | null
    insightsqlExecutionSandboxId?: string | null
    showSettings?: boolean
}

const OutputBlock = ({
    title,
    className,
    toneClassName,
    value,
}: {
    title: string
    className: string
    toneClassName: string
    value: string
}): JSX.Element => {
    const content = useMemo(() => renderAnsiText(value), [value])

    return (
        <div className={className}>
            <div className="text-[10px] uppercase tracking-wide text-muted">{title}</div>
            <pre
                className={clsx('text-xs font-mono whitespace-pre-wrap mt-1 select-text cursor-text', toneClassName)}
                contentEditable={false}
            >
                {content}
            </pre>
        </div>
    )
}

const MediaBlock = ({ media }: { media: PythonExecutionMedia }): JSX.Element | null => {
    const source = buildMediaSource(media)
    if (!source) {
        return null
    }

    return (
        <div>
            <div className="text-[10px] uppercase tracking-wide text-muted">Image</div>
            <img
                src={source}
                alt="SQL (InsightsQL) output"
                className="mt-2 max-w-full border border-border rounded bg-bg-light"
            />
        </div>
    )
}

const DEFAULT_INSIGHTSQL_SQL_NODE_HEIGHT = 100

const Component = ({
    attributes,
    updateAttributes,
}: NotebookNodeProps<NotebookNodeInsightsQLAttributes>): JSX.Element | null => {
    const nodeLogic = useMountedLogic(notebookNodeLogic)
    const {
        dataframePage,
        dataframePageSize,
        dataframeLoading,
        dataframeResult,
        dataframeVariableName,
        insightsqlReturnVariableUsage,
        expanded,
    } = useValues(nodeLogic)
    const { navigateToNode, setDataframePage, setDataframePageSize } = useActions(nodeLogic)
    const outputRef = useRef<HTMLDivElement | null>(null)
    const footerRef = useRef<HTMLDivElement | null>(null)
    const lastAutoHeightRef = useRef<number | null>(null)
    const lastExecutionCodeHashRef = useRef<number | null>(null)

    const insightsqlExecution = attributes.insightsqlExecution ?? null
    const hasResult = insightsqlExecution?.result !== undefined && insightsqlExecution?.result !== null
    const hasExecution =
        insightsqlExecution &&
        (insightsqlExecution.stdout ||
            insightsqlExecution.stderr ||
            hasResult ||
            insightsqlExecution.media?.length ||
            insightsqlExecution.traceback?.length)
    const executionCodeHash = attributes.insightsqlExecutionCodeHash ?? null

    const debouncedUpdateHeight = useDebouncedCallback((height: number) => {
        updateAttributes({ height })
        lastAutoHeightRef.current = height
    }, 150)

    useEffect(() => {
        return () => {
            debouncedUpdateHeight.cancel()
        }
    }, [debouncedUpdateHeight])

    useLayoutEffect(() => {
        if (!hasExecution) {
            return
        }
        const output = outputRef.current
        if (!output) {
            return
        }
        const footerHeight = footerRef.current?.offsetHeight ?? 0
        const desiredHeight = output.scrollHeight + footerHeight + 8
        const currentHeight = typeof attributes.height === 'number' ? attributes.height : DEFAULT_INSIGHTSQL_SQL_NODE_HEIGHT
        const lastExecutionCodeHash = lastExecutionCodeHashRef.current
        const executionChanged = executionCodeHash !== lastExecutionCodeHash

        if (executionChanged) {
            lastExecutionCodeHashRef.current = executionCodeHash
            lastAutoHeightRef.current = currentHeight
        }

        const lastAutoHeight = lastAutoHeightRef.current
        const hasManualResize =
            !executionChanged &&
            lastAutoHeight !== null &&
            typeof currentHeight === 'number' &&
            currentHeight < lastAutoHeight

        if (hasManualResize) {
            return
        }

        if (desiredHeight !== currentHeight) {
            debouncedUpdateHeight(desiredHeight)
        }
    }, [
        attributes.height,
        dataframeLoading,
        dataframePageSize,
        dataframeResult,
        executionCodeHash,
        hasExecution,
        debouncedUpdateHeight,
        insightsqlExecution?.media?.length,
        insightsqlExecution?.result,
        insightsqlExecution?.stderr,
        insightsqlExecution?.stdout,
        insightsqlExecution?.traceback?.length,
    ])

    const isSettingsVisible = attributes.showSettings ?? false
    const showReturnVariableRow = expanded || isSettingsVisible
    const showDataframeTable = !!dataframeVariableName

    const usageLabel = (nodeType: NotebookNodeType, nodeIndex: number | undefined, title: string): string => {
        const trimmedTitle = title.trim()
        if (trimmedTitle) {
            return trimmedTitle
        }
        return getCellLabel(nodeIndex, nodeType) ?? 'SQL'
    }

    if (!expanded && !showReturnVariableRow) {
        return null
    }

    return (
        <div data-attr="notebook-node-insightsql-sql" className="flex h-full flex-col">
            {expanded ? (
                <div
                    ref={outputRef}
                    className="space-y-3"
                    onMouseDown={(event) => event.stopPropagation()}
                    onDragStart={(event) => event.stopPropagation()}
                >
                    {hasExecution ? (
                        <>
                            {insightsqlExecution?.stdout ? (
                                <OutputBlock
                                    title="Output"
                                    className="p-2"
                                    toneClassName="text-default"
                                    value={insightsqlExecution.stdout ?? ''}
                                />
                            ) : null}
                            {insightsqlExecution?.stderr ? (
                                <OutputBlock
                                    title="stderr"
                                    className="p-2"
                                    toneClassName="text-danger"
                                    value={insightsqlExecution.stderr ?? ''}
                                />
                            ) : null}
                            {hasResult && !showDataframeTable ? (
                                <OutputBlock
                                    title="Result"
                                    className="p-2"
                                    toneClassName="text-default"
                                    value={insightsqlExecution.result ?? ''}
                                />
                            ) : null}
                            {showDataframeTable ? (
                                <NotebookDataframeTable
                                    result={dataframeResult}
                                    loading={dataframeLoading}
                                    page={dataframePage}
                                    pageSize={dataframePageSize}
                                    onNextPage={() => setDataframePage(dataframePage + 1)}
                                    onPreviousPage={() => setDataframePage(Math.max(1, dataframePage - 1))}
                                    onPageSizeChange={setDataframePageSize}
                                />
                            ) : null}
                            {insightsqlExecution?.media?.map((media, index) => (
                                <MediaBlock key={`insightsql-sql-media-${index}`} media={media} />
                            ))}
                            {insightsqlExecution?.status === 'error' && insightsqlExecution.traceback?.length ? (
                                <OutputBlock
                                    title="Error"
                                    className="p-2"
                                    toneClassName="text-danger"
                                    value={insightsqlExecution.traceback.join('\n')}
                                />
                            ) : null}
                        </>
                    ) : (
                        <div className="text-xs text-muted font-mono p-2">Run the query to see execution results.</div>
                    )}
                </div>
            ) : null}
            {showReturnVariableRow ? (
                <div
                    ref={footerRef}
                    className="flex flex-col gap-2 text-xs text-muted border-t p-2"
                    onClick={(event) => event.stopPropagation()}
                    onMouseDown={(event) => event.stopPropagation()}
                >
                    <div className="flex items-center gap-2">
                        <span className="font-mono mt-0.5">
                            <IconCornerDownRight />
                        </span>
                        <input
                            type="text"
                            className="rounded border border-border px-1.5 py-0.5 text-xs font-mono bg-bg-light text-default focus:outline-none focus:ring-1 focus:ring-primary"
                            value={attributes.returnVariable ?? ''}
                            onChange={(event) => updateAttributes({ returnVariable: event.target.value })}
                            spellCheck={false}
                        />
                        {insightsqlReturnVariableUsage.length > 0 ? (
                            <span className="text-muted">
                                Used in{' '}
                                {insightsqlReturnVariableUsage.map((usage) => (
                                    <button
                                        key={usage.nodeId}
                                        type="button"
                                        className="text-muted hover:text-default underline underline-offset-2 ml-1"
                                        onClick={() => navigateToNode(usage.nodeId)}
                                    >
                                        {usageLabel(usage.nodeType, usage.nodeIndex, usage.title)}
                                    </button>
                                ))}
                            </span>
                        ) : null}
                    </div>
                </div>
            ) : null}
        </div>
    )
}

const Settings = ({
    attributes,
    updateAttributes,
}: NotebookNodeAttributeProperties<NotebookNodeInsightsQLAttributes>): JSX.Element => {
    const nodeLogic = useMountedLogic(notebookNodeLogic)
    const { runHogqlSqlNodeWithMode } = useActions(nodeLogic)
    const { insightsqlSqlRunLoading, insightsqlSqlRunQueued } = useValues(nodeLogic)

    return (
        <NotebookCodeSQLEditorSettings
            attributes={attributes}
            updateAttributes={updateAttributes}
            tabIdSuffix="insightsql"
            onRunQuery={() => {
                void runHogqlSqlNodeWithMode({ mode: 'auto' })
            }}
            runQueryLoading={insightsqlSqlRunLoading || insightsqlSqlRunQueued}
            runQueryTooltip="Run SQL (InsightsQL) query"
        />
    )
}

export const NotebookNodeInsightsQL = createInsightsWidgetNode<NotebookNodeInsightsQLAttributes>({
    nodeType: NotebookNodeType.InsightsQLSQL,
    titlePlaceholder: 'SQL (InsightsQL)',
    Component,
    heightEstimate: 120,
    minHeight: 80,
    resizeable: true,
    startExpanded: true,
    attributes: {
        code: {
            default: '',
        },
        returnVariable: {
            default: 'insightsql_df',
        },
        insightsqlExecution: {
            default: null,
        },
        insightsqlExecutionCodeHash: {
            default: null,
        },
        insightsqlExecutionSandboxId: {
            default: null,
        },
        showSettings: {
            default: false,
        },
    },
    Settings,
    settingsPlacement: 'inline',
    serializedText: (attrs) => attrs.code,
})
