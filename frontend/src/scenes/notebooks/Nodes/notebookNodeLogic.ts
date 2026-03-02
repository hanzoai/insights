import {
    BuiltLogic,
    actions,
    afterMount,
    beforeUnmount,
    connect,
    kea,
    key,
    listeners,
    path,
    props,
    reducers,
    selectors,
} from 'kea'
import posthog from 'posthog-js'

import { LemonMenuItems } from '@posthog/lemon-ui'

import api from 'lib/api'
import { JSONContent, RichContentNode } from 'lib/components/RichContentEditor/types'
import { hashCodeForString } from 'lib/utils'

import { isInsightsQLQuery, isNodeWithSource } from '~/queries/utils'

import { notebookLogicType } from '../Notebook/notebookLogicType'
import {
    CustomNotebookNodeAttributes,
    NotebookNodeAction,
    NotebookNodeAttributeProperties,
    NotebookNodeAttributes,
    NotebookNodeResource,
    NotebookNodeSettings,
    NotebookNodeSettingsPlacement,
    NotebookNodeType,
} from '../types'
import { NotebookNodeMessages, NotebookNodeMessagesListeners } from './messaging/notebook-node-messages'
import {
    type DuckSqlNodeSummary,
    type InsightsqlSqlNodeSummary,
    type NotebookDependencyGraph,
    type NotebookDependencyNode,
    type NotebookDependencyUsage,
    extractInsightsqlPlaceholders,
    getUniqueDuckSqlReturnVariable,
    getUniqueInsightsqlReturnVariable,
    resolveDuckSqlReturnVariable,
    resolveInsightsqlReturnVariable,
} from './notebookNodeContent'
import type { notebookNodeLogicType } from './notebookNodeLogicType'
import {
    NotebookDataframeResult,
    PythonExecutionResult,
    PythonExecutionVariable,
    PythonKernelExecuteResponse,
    PythonKernelVariableResponse,
    buildPythonExecutionError,
    buildPythonExecutionResult,
    buildPythonExecutionRunning,
    mergeExecutionVariables,
} from './pythonExecution'

export type PythonRunMode = 'auto' | 'cell_upstream' | 'cell' | 'cell_downstream'
export type DuckSqlRunMode = 'auto' | 'cell_upstream' | 'cell' | 'cell_downstream'
export type InsightsqlSqlRunMode = 'auto' | 'cell_upstream' | 'cell' | 'cell_downstream'

type RunPythonCellParams = {
    notebookId: string
    code: string
    exportedGlobals: { name: string; type: string }[]
    updateAttributes: (attributes: Partial<NotebookNodeAttributes<any>>) => void
    setPythonRunLoading: (loading: boolean) => void
    executionSandboxId: string | null
}

type RunDuckSqlCellParams = {
    notebookId: string
    code: string
    returnVariable: string
    pageSize: number
    updateAttributes: (attributes: Partial<NotebookNodeAttributes<any>>) => void
    setDuckSqlRunLoading: (loading: boolean) => void
    executionSandboxId: string | null
}

type RunInsightsqlSqlCellParams = {
    notebookId: string
    code: string
    placeholders: string[]
    returnVariable: string
    pageSize: number
    updateAttributes: (attributes: Partial<NotebookNodeAttributes<any>>) => void
    setInsightsqlSqlRunLoading: (loading: boolean) => void
    executionSandboxId: string | null
}

const isSqlQueryNode = (nodeAttributes: NotebookNodeAttributes<any>): boolean => {
    const query = nodeAttributes?.query
    if (!query) {
        return false
    }
    if (isNodeWithSource(query)) {
        return isInsightsQLQuery(query.source)
    }
    return false
}

const DEFAULT_DATAFRAME_PAGE_SIZE = 10

const buildDuckSqlCode = (code: string, returnVariable: string, pageSize: number): string => {
    const resolvedReturnVariable = resolveDuckSqlReturnVariable(returnVariable)
    const sqlLiteral = JSON.stringify(code ?? '')
    const tableNameLiteral = JSON.stringify(resolvedReturnVariable)
    const previewPageSize = Math.max(1, pageSize || DEFAULT_DATAFRAME_PAGE_SIZE)
    return (
        `import json\n` +
        `${resolvedReturnVariable} = duck_execute(${sqlLiteral})\n` +
        `duck_save_table(${tableNameLiteral}, ${resolvedReturnVariable})\n` +
        `json.dumps(notebook_dataframe_page(${resolvedReturnVariable}, offset=0, limit=${previewPageSize}))`
    )
}

type InsightsqlExecuteResponse = {
    results?: any[]
    columns?: string[]
    error?: string
}

const buildInsightsqlSqlAssignmentCode = (code: string, returnVariable: string): string => {
    const resolvedReturnVariable = resolveInsightsqlReturnVariable(returnVariable)
    const sqlLiteral = JSON.stringify(code ?? '')
    return `${resolvedReturnVariable} = insightsql_execute(${sqlLiteral})`
}

const buildInsightsqlSqlExecutionCode = (
    code: string,
    returnVariable: string,
    pageSize: number,
    placeholders: string[]
): string => {
    const resolvedReturnVariable = resolveInsightsqlReturnVariable(returnVariable)
    const sqlLiteral = JSON.stringify(code ?? '')
    const placeholdersLiteral = JSON.stringify(placeholders)
    const previewPageSize = Math.max(1, pageSize || DEFAULT_DATAFRAME_PAGE_SIZE)
    return (
        `import json\n` +
        `${resolvedReturnVariable} = insightsql_execute(${sqlLiteral}, placeholders=${placeholdersLiteral})\n` +
        `json.dumps(notebook_dataframe_page(${resolvedReturnVariable}, offset=0, limit=${previewPageSize}))`
    )
}

const buildInsightsqlDataframeResult = (
    response: InsightsqlExecuteResponse,
    pageSize: number
): NotebookDataframeResult | null => {
    const columns = Array.isArray(response.columns) ? response.columns : []
    const results = Array.isArray(response.results) ? response.results : []
    const resolvedPageSize = Math.max(1, pageSize || DEFAULT_DATAFRAME_PAGE_SIZE)
    const limitedResults = results.slice(0, resolvedPageSize)
    const rows = limitedResults.map((row) => {
        if (row && typeof row === 'object' && !Array.isArray(row)) {
            return row as Record<string, any>
        }
        if (Array.isArray(row)) {
            const rowObject: Record<string, any> = {}
            if (columns.length > 0) {
                columns.forEach((column, index) => {
                    rowObject[column] = row[index]
                })
            } else {
                row.forEach((value, index) => {
                    rowObject[`column_${index + 1}`] = value
                })
            }
            return rowObject
        }
        if (columns.length === 1) {
            return { [columns[0]]: row }
        }
        return { value: row }
    })
    const resolvedColumns = columns.length > 0 ? columns : rows.length > 0 ? Object.keys(rows[0]) : []
    return {
        columns: resolvedColumns,
        rows,
        rowCount: results.length,
    }
}

const buildInsightsqlExecutionResult = ({
    response,
    exportedGlobals,
    returnVariable,
    query,
    pageSize,
}: {
    response: InsightsqlExecuteResponse
    exportedGlobals: { name: string; type: string }[]
    returnVariable: string
    query: string
    pageSize: number
}): PythonExecutionResult => {
    const isError = Boolean(response.error)
    const dataframeResult = isError ? null : buildInsightsqlDataframeResult(response, pageSize)
    const variableResponse: PythonKernelVariableResponse = isError
        ? {
              status: 'error',
              type: 'DataFrame',
              ename: 'InsightsQLQueryError',
              evalue: response.error,
              traceback: response.error ? [response.error] : [],
          }
        : {
              status: 'ok',
              type: 'DataFrame',
              insightsql_query: query,
          }
    return {
        status: isError ? 'error' : 'ok',
        stdout: '',
        stderr: isError ? (response.error ?? 'Failed to run InsightsQL query.') : '',
        result: dataframeResult ? JSON.stringify(dataframeResult) : undefined,
        errorName: isError ? 'InsightsQLQueryError' : null,
        traceback: isError && response.error ? [response.error] : [],
        variables: mergeExecutionVariables(exportedGlobals, {
            [returnVariable]: variableResponse,
        }),
    }
}

type DependencyRunDirection = 'upstream' | 'downstream'

const collectDependencyNodeIds = (
    dependencyGraph: NotebookDependencyGraph,
    startNodeId: string,
    direction: DependencyRunDirection
): Set<string> => {
    const visited = new Set<string>()
    if (!startNodeId || !dependencyGraph.nodesById[startNodeId]) {
        return visited
    }

    const stack = [startNodeId]

    while (stack.length > 0) {
        const currentId = stack.pop()
        if (!currentId || visited.has(currentId)) {
            continue
        }
        visited.add(currentId)

        if (direction === 'upstream') {
            const sources = Object.values(dependencyGraph.upstreamSourcesByNode[currentId] ?? {})
            sources.forEach((source) => {
                if (source.nodeId && !visited.has(source.nodeId)) {
                    stack.push(source.nodeId)
                }
            })
        } else {
            const downstreamGroups = Object.values(dependencyGraph.downstreamUsageByNode[currentId] ?? {})
            downstreamGroups.flat().forEach((usage) => {
                if (usage.nodeId && !visited.has(usage.nodeId)) {
                    stack.push(usage.nodeId)
                }
            })
        }
    }

    return visited
}

const getDependencyNodesForRun = (
    dependencyGraph: NotebookDependencyGraph,
    startNodeId: string,
    direction: DependencyRunDirection
): NotebookDependencyNode[] => {
    const nodeIds = collectDependencyNodeIds(dependencyGraph, startNodeId, direction)
    if (nodeIds.size === 0) {
        return []
    }

    return dependencyGraph.nodes.filter((node) => nodeIds.has(node.nodeId))
}

const getDependencyEntriesWithLogic = ({
    dependencyGraph,
    nodeId,
    direction,
    notebookLogic,
}: {
    dependencyGraph: NotebookDependencyGraph
    nodeId: string
    direction: DependencyRunDirection
    notebookLogic: BuiltLogic<notebookLogicType>
}): { node: NotebookDependencyNode; nodeLogic: BuiltLogic<notebookNodeLogicType> }[] => {
    const nodesToRun = getDependencyNodesForRun(dependencyGraph, nodeId, direction)
    if (nodesToRun.length === 0) {
        return []
    }

    return nodesToRun
        .map((node) => ({
            node,
            nodeLogic: notebookLogic.values.findNodeLogicById(node.nodeId),
        }))
        .filter(
            (
                entry
            ): entry is {
                node: (typeof nodesToRun)[number]
                nodeLogic: BuiltLogic<notebookNodeLogicType>
            } => !!entry.nodeLogic
        )
}

const isPythonExecutionFresh = (nodeLogic: BuiltLogic<notebookNodeLogicType>, code: string): boolean => {
    const { pythonExecutionCodeHash, pythonExecution, pythonExecutionSandboxId } = nodeLogic.values.nodeAttributes
    const codeHash = hashCodeForString(code)
    const kernelSandboxId = nodeLogic.values.kernelInfo?.sandbox_id ?? null
    const kernelIsRunning = nodeLogic.values.kernelInfo?.status === 'running'
    const sandboxMatches =
        pythonExecutionSandboxId && kernelSandboxId !== null && pythonExecutionSandboxId === kernelSandboxId
    return (
        pythonExecutionCodeHash &&
        pythonExecutionCodeHash === codeHash &&
        pythonExecution?.status === 'ok' &&
        sandboxMatches &&
        kernelIsRunning
    )
}

const isDuckSqlExecutionFresh = (
    nodeLogic: BuiltLogic<notebookNodeLogicType>,
    code: string,
    returnVariable: string
): boolean => {
    const { duckExecutionCodeHash, duckExecution, duckExecutionSandboxId } = nodeLogic.values.nodeAttributes
    const codeHash = hashCodeForString(`${code}\n${returnVariable}`)
    const kernelSandboxId = nodeLogic.values.kernelInfo?.sandbox_id ?? null
    const kernelIsRunning = nodeLogic.values.kernelInfo?.status === 'running'
    const sandboxMatches =
        duckExecutionSandboxId && kernelSandboxId !== null && duckExecutionSandboxId === kernelSandboxId
    return (
        duckExecutionCodeHash &&
        duckExecutionCodeHash === codeHash &&
        duckExecution?.status === 'ok' &&
        sandboxMatches &&
        kernelIsRunning
    )
}

const isInsightsqlSqlExecutionFresh = (
    nodeLogic: BuiltLogic<notebookNodeLogicType>,
    code: string,
    returnVariable: string
): boolean => {
    const { insightsqlExecutionCodeHash, insightsqlExecution, insightsqlExecutionSandboxId } = nodeLogic.values.nodeAttributes
    const codeHash = hashCodeForString(`${code}\n${returnVariable}`)
    const kernelSandboxId = nodeLogic.values.kernelInfo?.sandbox_id ?? null
    const kernelIsRunning = nodeLogic.values.kernelInfo?.status === 'running'
    const sandboxMatches =
        insightsqlExecutionSandboxId && kernelSandboxId !== null && insightsqlExecutionSandboxId === kernelSandboxId
    return (
        insightsqlExecutionCodeHash &&
        insightsqlExecutionCodeHash === codeHash &&
        insightsqlExecution?.status === 'ok' &&
        sandboxMatches &&
        kernelIsRunning
    )
}

const setDependencyNodeQueued = (
    nodeLogic: BuiltLogic<notebookNodeLogicType>,
    nodeType: NotebookNodeType,
    queued: boolean
): void => {
    if (nodeType === NotebookNodeType.Python) {
        nodeLogic.actions.setPythonRunQueued(queued)
        return
    }
    if (nodeType === NotebookNodeType.DuckSQL) {
        nodeLogic.actions.setDuckSqlRunQueued(queued)
        return
    }
    if (nodeType === NotebookNodeType.InsightsQLSQL) {
        nodeLogic.actions.setInsightsqlSqlRunQueued(queued)
    }
}

const runDependencyNodes = async ({
    entries,
    notebookId,
    mode,
    duckSqlNodeSummaries,
    insightsqlSqlNodeSummaries,
    currentNodeId,
    skipDataframeVariableUpdateForNodeId,
}: {
    entries: { node: NotebookDependencyNode; nodeLogic: BuiltLogic<notebookNodeLogicType> }[]
    notebookId: string
    mode: PythonRunMode | DuckSqlRunMode | InsightsqlSqlRunMode
    duckSqlNodeSummaries: DuckSqlNodeSummary[]
    insightsqlSqlNodeSummaries: InsightsqlSqlNodeSummary[]
    currentNodeId: string
    skipDataframeVariableUpdateForNodeId?: string
}): Promise<void> => {
    entries.forEach(({ node, nodeLogic }) => setDependencyNodeQueued(nodeLogic, node.nodeType, true))

    try {
        for (const { node, nodeLogic } of entries) {
            setDependencyNodeQueued(nodeLogic, node.nodeType, false)
            if (node.nodeType === NotebookNodeType.Python) {
                const nodeAttributes = nodeLogic.values.nodeAttributes as {
                    code?: string
                    pythonExecutionSandboxId?: string | null
                }
                const nodeCode = nodeAttributes.code ?? node.code ?? ''
                const executionSandboxId =
                    nodeLogic.values.kernelInfo?.sandbox_id ?? nodeAttributes.pythonExecutionSandboxId ?? null
                if (mode === 'auto' && node.nodeId !== currentNodeId && isPythonExecutionFresh(nodeLogic, nodeCode)) {
                    continue
                }
                const { executed, execution } = await runPythonCell({
                    notebookId,
                    code: nodeCode,
                    exportedGlobals: nodeLogic.values.exportedGlobals,
                    updateAttributes: nodeLogic.actions.updateAttributes,
                    setPythonRunLoading: nodeLogic.actions.setPythonRunLoading,
                    executionSandboxId,
                })

                const isSuccess = executed && execution?.status === 'ok'
                if (isSuccess) {
                    const dataframeVariable = findDataframeVariable(execution?.variables)
                    nodeLogic.actions.setDataframeVariableName(dataframeVariable)
                } else {
                    nodeLogic.actions.setDataframeVariableName(null)
                }
                if (!isSuccess) {
                    break
                }
                continue
            }

            if (node.nodeType === NotebookNodeType.DuckSQL) {
                const nodeAttributes = nodeLogic.values.nodeAttributes as {
                    code?: string
                    returnVariable?: string
                    duckExecutionSandboxId?: string | null
                }
                const nodeCode = nodeAttributes.code ?? node.code ?? ''
                const nodeReturnVariable = getUniqueDuckSqlReturnVariable(
                    duckSqlNodeSummaries,
                    node.nodeId,
                    nodeAttributes.returnVariable ?? node.returnVariable ?? 'duck_df'
                )
                const executionSandboxId =
                    nodeLogic.values.kernelInfo?.sandbox_id ?? nodeAttributes.duckExecutionSandboxId ?? null
                if (
                    mode === 'auto' &&
                    node.nodeId !== currentNodeId &&
                    isDuckSqlExecutionFresh(nodeLogic, nodeCode, nodeReturnVariable)
                ) {
                    continue
                }
                const { executed, execution } = await runDuckSqlCell({
                    notebookId,
                    code: nodeCode,
                    returnVariable: nodeReturnVariable,
                    pageSize: nodeLogic.values.dataframePageSize,
                    updateAttributes: nodeLogic.actions.updateAttributes,
                    setDuckSqlRunLoading: nodeLogic.actions.setDuckSqlRunLoading,
                    executionSandboxId,
                })

                const isSuccess = executed && execution?.status === 'ok'
                if (isSuccess) {
                    const previewResult = parseDataframePreview(execution?.result)
                    const shouldUpdateDataframeVariable =
                        node.nodeId !== skipDataframeVariableUpdateForNodeId || !nodeLogic.values.dataframeVariableName
                    if (shouldUpdateDataframeVariable) {
                        nodeLogic.actions.setDataframeVariableName(
                            nodeLogic.values.duckSqlReturnVariable,
                            previewResult
                        )
                    }
                } else {
                    nodeLogic.actions.setDataframeVariableName(null)
                }
                if (!isSuccess) {
                    break
                }
            }

            if (node.nodeType === NotebookNodeType.InsightsQLSQL) {
                const nodeAttributes = nodeLogic.values.nodeAttributes as {
                    code?: string
                    returnVariable?: string
                    insightsqlExecutionSandboxId?: string | null
                }
                const nodeCode = nodeAttributes.code ?? node.code ?? ''
                const nodeReturnVariable = getUniqueInsightsqlReturnVariable(
                    insightsqlSqlNodeSummaries,
                    node.nodeId,
                    nodeAttributes.returnVariable ?? node.returnVariable ?? 'insightsql_df'
                )
                const placeholders = extractInsightsqlPlaceholders(nodeCode)
                const executionSandboxId =
                    nodeLogic.values.kernelInfo?.sandbox_id ?? nodeAttributes.insightsqlExecutionSandboxId ?? null
                if (
                    mode === 'auto' &&
                    node.nodeId !== currentNodeId &&
                    isInsightsqlSqlExecutionFresh(nodeLogic, nodeCode, nodeReturnVariable)
                ) {
                    continue
                }
                const { executed, execution } = await runInsightsqlSqlCell({
                    notebookId,
                    code: nodeCode,
                    placeholders,
                    returnVariable: nodeReturnVariable,
                    pageSize: nodeLogic.values.dataframePageSize,
                    updateAttributes: nodeLogic.actions.updateAttributes,
                    setInsightsqlSqlRunLoading: nodeLogic.actions.setInsightsqlSqlRunLoading,
                    executionSandboxId,
                })

                const isSuccess = executed && execution?.status === 'ok'
                if (isSuccess) {
                    const previewResult = parseDataframePreview(execution?.result)
                    const shouldUpdateDataframeVariable =
                        node.nodeId !== skipDataframeVariableUpdateForNodeId || !nodeLogic.values.dataframeVariableName
                    if (shouldUpdateDataframeVariable) {
                        nodeLogic.actions.setDataframeVariableName(
                            nodeLogic.values.insightsqlSqlReturnVariable,
                            previewResult
                        )
                    }
                } else {
                    nodeLogic.actions.setDataframeVariableName(null)
                }
                if (!isSuccess) {
                    break
                }
            }
        }
    } finally {
        entries.forEach(({ node, nodeLogic }) => setDependencyNodeQueued(nodeLogic, node.nodeType, false))
    }
}

const runPythonCell = async ({
    notebookId,
    code,
    exportedGlobals,
    updateAttributes,
    setPythonRunLoading,
    executionSandboxId,
}: RunPythonCellParams): Promise<{ executed: boolean; execution: PythonExecutionResult | null }> => {
    setPythonRunLoading(true)
    try {
        let stdout = ''
        let stderr = ''
        let executionResult: PythonExecutionResult | null = null
        let kernelResponse: PythonKernelExecuteResponse | null = null
        let didFail = false
        const codeHash = hashCodeForString(code)

        updateAttributes({
            pythonExecution: buildPythonExecutionRunning(exportedGlobals),
            pythonExecutionCodeHash: codeHash,
            pythonExecutionSandboxId: executionSandboxId,
        })

        await api.notebooks.kernelExecuteStream(
            notebookId,
            {
                code,
                return_variables: exportedGlobals.length > 0,
            },
            {
                onMessage: (event) => {
                    if (event.event === 'stdout') {
                        const payload = JSON.parse(event.data) as { text?: string }
                        stdout = `${stdout}${payload.text ?? ''}`
                        updateAttributes({
                            pythonExecution: buildPythonExecutionRunning(exportedGlobals, stdout, stderr),
                        })
                        return
                    }
                    if (event.event === 'stderr') {
                        const payload = JSON.parse(event.data) as { text?: string }
                        stderr = `${stderr}${payload.text ?? ''}`
                        updateAttributes({
                            pythonExecution: buildPythonExecutionRunning(exportedGlobals, stdout, stderr),
                        })
                        return
                    }
                    if (event.event === 'error') {
                        const payload = JSON.parse(event.data) as { error?: string }
                        const message = payload.error ?? 'Failed to run Python cell.'
                        executionResult = buildPythonExecutionError(message, exportedGlobals)
                        didFail = true
                        updateAttributes({
                            pythonExecution: executionResult,
                            pythonExecutionCodeHash: codeHash,
                            pythonExecutionSandboxId: executionSandboxId,
                        })
                        return
                    }
                    if (event.event === 'result') {
                        kernelResponse = JSON.parse(event.data) as PythonKernelExecuteResponse
                        executionResult = buildPythonExecutionResult(kernelResponse, exportedGlobals)
                        const runtimeSandboxId = kernelResponse.kernel_runtime?.sandbox_id ?? executionSandboxId
                        updateAttributes({
                            pythonExecution: executionResult,
                            pythonExecutionCodeHash: codeHash,
                            pythonExecutionSandboxId: runtimeSandboxId,
                        })
                    }
                },
                onError: (error) => {
                    const message = error instanceof Error ? error.message : 'Failed to run Python cell.'
                    executionResult = buildPythonExecutionError(message, exportedGlobals)
                    didFail = true
                    updateAttributes({
                        pythonExecution: executionResult,
                        pythonExecutionCodeHash: codeHash,
                        pythonExecutionSandboxId: executionSandboxId,
                    })
                    throw error
                },
            }
        )

        if (!executionResult && kernelResponse) {
            executionResult = buildPythonExecutionResult(kernelResponse, exportedGlobals)
        }

        if (!executionResult) {
            throw new Error('Python execution did not return a result.')
        }

        return { executed: !didFail, execution: executionResult }
    } catch (error) {
        if (error instanceof Error && error.message === 'Python execution did not return a result.') {
            const executionResult = buildPythonExecutionError(error.message, exportedGlobals)
            updateAttributes({
                pythonExecution: executionResult,
                pythonExecutionCodeHash: hashCodeForString(code),
                pythonExecutionSandboxId: executionSandboxId,
            })
            return { executed: false, execution: executionResult }
        }
        const message = error instanceof Error ? error.message : 'Failed to run Python cell.'
        const executionResult = buildPythonExecutionError(message, exportedGlobals)
        updateAttributes({
            pythonExecution: executionResult,
            pythonExecutionCodeHash: hashCodeForString(code),
            pythonExecutionSandboxId: executionSandboxId,
        })
        return { executed: false, execution: executionResult }
    } finally {
        setPythonRunLoading(false)
    }
}

const runDuckSqlCell = async ({
    notebookId,
    code,
    returnVariable,
    pageSize,
    updateAttributes,
    setDuckSqlRunLoading,
    executionSandboxId,
}: RunDuckSqlCellParams): Promise<{ executed: boolean; execution: PythonExecutionResult | null }> => {
    setDuckSqlRunLoading(true)
    const resolvedReturnVariable = resolveDuckSqlReturnVariable(returnVariable)
    const executionCode = buildDuckSqlCode(code, returnVariable, pageSize)
    try {
        let executionResult: PythonExecutionResult | null = null
        let kernelResponse: PythonKernelExecuteResponse | null = null
        const codeHash = hashCodeForString(`${code}\n${resolvedReturnVariable}`)
        const exportedGlobals = [{ name: resolvedReturnVariable, type: 'DataFrame' }]

        updateAttributes({
            duckExecution: buildPythonExecutionRunning(exportedGlobals),
            duckExecutionCodeHash: codeHash,
            duckExecutionSandboxId: executionSandboxId,
        })

        kernelResponse = (await api.notebooks.kernelExecute(notebookId, {
            code: executionCode,
            return_variables: true,
        })) as PythonKernelExecuteResponse
        executionResult = buildPythonExecutionResult(kernelResponse, exportedGlobals)
        const runtimeSandboxId = kernelResponse.kernel_runtime?.sandbox_id ?? executionSandboxId
        updateAttributes({
            duckExecution: executionResult,
            duckExecutionCodeHash: codeHash,
            duckExecutionSandboxId: runtimeSandboxId,
        })

        if (!executionResult && kernelResponse) {
            executionResult = buildPythonExecutionResult(kernelResponse, exportedGlobals)
        }

        if (!executionResult) {
            throw new Error('DuckDB execution did not return a result.')
        }

        return { executed: true, execution: executionResult }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to run SQL (DuckDB) query.'
        const executionResult = buildPythonExecutionError(message, [
            { name: resolvedReturnVariable, type: 'DataFrame' },
        ])
        updateAttributes({
            duckExecution: executionResult,
            duckExecutionCodeHash: hashCodeForString(`${code}\n${resolvedReturnVariable}`),
            duckExecutionSandboxId: executionSandboxId,
        })
        return { executed: false, execution: executionResult }
    } finally {
        setDuckSqlRunLoading(false)
    }
}

const runInsightsqlSqlCell = async ({
    notebookId,
    code,
    placeholders,
    returnVariable,
    pageSize,
    updateAttributes,
    setInsightsqlSqlRunLoading,
    executionSandboxId,
}: RunInsightsqlSqlCellParams): Promise<{ executed: boolean; execution: PythonExecutionResult | null }> => {
    setInsightsqlSqlRunLoading(true)
    const resolvedReturnVariable = resolveInsightsqlReturnVariable(returnVariable)
    const placeholderNames = placeholders.filter((placeholder) => placeholder.trim().length > 0)
    const shouldExecuteInKernel = placeholderNames.length > 0
    const executionCode = shouldExecuteInKernel
        ? buildInsightsqlSqlExecutionCode(code, returnVariable, pageSize, placeholderNames)
        : buildInsightsqlSqlAssignmentCode(code, returnVariable)
    let runtimeSandboxId = executionSandboxId
    try {
        let executionResult: PythonExecutionResult | null = null
        let kernelResponse: PythonKernelExecuteResponse | null = null
        const codeHash = hashCodeForString(`${code}\n${resolvedReturnVariable}`)
        const exportedGlobals = [{ name: resolvedReturnVariable, type: 'DataFrame' }]

        updateAttributes({
            insightsqlExecution: buildPythonExecutionRunning(exportedGlobals),
            insightsqlExecutionCodeHash: codeHash,
            insightsqlExecutionSandboxId: executionSandboxId,
        })

        kernelResponse = (await api.notebooks.kernelExecute(notebookId, {
            code: executionCode,
            return_variables: shouldExecuteInKernel,
        })) as PythonKernelExecuteResponse
        runtimeSandboxId = kernelResponse.kernel_runtime?.sandbox_id ?? executionSandboxId

        if (kernelResponse.status === 'error') {
            executionResult = buildPythonExecutionResult(kernelResponse, exportedGlobals)
            updateAttributes({
                insightsqlExecution: executionResult,
                insightsqlExecutionCodeHash: codeHash,
                insightsqlExecutionSandboxId: runtimeSandboxId,
            })
            return { executed: true, execution: executionResult }
        }

        if (shouldExecuteInKernel) {
            executionResult = buildPythonExecutionResult(kernelResponse, exportedGlobals)
            updateAttributes({
                insightsqlExecution: executionResult,
                insightsqlExecutionCodeHash: codeHash,
                insightsqlExecutionSandboxId: runtimeSandboxId,
            })
            return { executed: true, execution: executionResult }
        }

        const queryResponse = await api.notebooks.insightsqlExecute(notebookId, {
            query: code,
        })
        executionResult = buildInsightsqlExecutionResult({
            response: queryResponse,
            exportedGlobals,
            returnVariable: resolvedReturnVariable,
            query: code,
            pageSize,
        })
        updateAttributes({
            insightsqlExecution: executionResult,
            insightsqlExecutionCodeHash: codeHash,
            insightsqlExecutionSandboxId: runtimeSandboxId,
        })

        if (executionResult.status === 'error') {
            return { executed: true, execution: executionResult }
        }

        return { executed: true, execution: executionResult }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to run SQL (InsightsQL) query.'
        const executionResult = buildPythonExecutionError(message, [
            { name: resolvedReturnVariable, type: 'DataFrame' },
        ])
        updateAttributes({
            insightsqlExecution: executionResult,
            insightsqlExecutionCodeHash: hashCodeForString(`${code}\n${resolvedReturnVariable}`),
            insightsqlExecutionSandboxId: runtimeSandboxId,
        })
        return { executed: false, execution: executionResult }
    } finally {
        setInsightsqlSqlRunLoading(false)
    }
}

const findDataframeVariable = (variables?: PythonExecutionVariable[]): string | null => {
    if (!variables) {
        return null
    }
    const match = variables.find((variable) => variable.type?.toLowerCase() === 'dataframe')
    return match?.name ?? null
}

const parseDataframePreview = (preview?: string | null): NotebookDataframeResult | null => {
    if (!preview) {
        return null
    }
    const trimmed = preview.trim()
    if (!trimmed) {
        return null
    }
    const candidates = [trimmed]
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
        try {
            candidates.push(JSON.parse(trimmed))
        } catch {
            // oh well, not for us
        }
    } else if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
        // we can't JSON.escape single quoted strings, so we'll have to do this manually
        const stripped = trimmed.slice(1, -1)
        const unescaped = stripped.replace(/\\'/g, "'").replace(/\\\\/g, '\\')
        candidates.push(unescaped)
    }

    for (const candidate of candidates) {
        try {
            const parsed = JSON.parse(candidate) as {
                columns?: string[]
                rows?: Record<string, any>[]
                rowCount?: number
                row_count?: number
            }
            if (!parsed || typeof parsed !== 'object') {
                continue
            }
            const columns = Array.isArray(parsed.columns) ? parsed.columns : []
            const rows = Array.isArray(parsed.rows) ? parsed.rows : []
            const rowCount = parsed.rowCount || parsed.row_count || rows.length
            return {
                columns,
                rows,
                rowCount,
            }
        } catch {}
    }
    return null
}

export type NotebookNodeLogicProps = {
    nodeType: NotebookNodeType
    notebookLogic: BuiltLogic<notebookLogicType>
    getPos?: () => number | undefined
    resizeable?: boolean | ((attributes: CustomNotebookNodeAttributes) => boolean)
    Settings?: NotebookNodeSettings
    messageListeners?: NotebookNodeMessagesListeners
    startExpanded?: boolean
    titlePlaceholder: string
    settingsPlacement?: NotebookNodeSettingsPlacement
} & NotebookNodeAttributeProperties<any>

export const notebookNodeLogic = kea<notebookNodeLogicType>([
    props({} as NotebookNodeLogicProps),
    path((key) => ['scenes', 'notebooks', 'Notebook', 'Nodes', 'notebookNodeLogic', key]),
    key(({ attributes }) => attributes.nodeId || 'no-node-id-set'),
    actions({
        setExpanded: (expanded: boolean) => ({ expanded }),
        setResizeable: (resizeable: boolean) => ({ resizeable }),
        setActions: (actions: (NotebookNodeAction | undefined)[]) => ({ actions }),
        setMenuItems: (menuItems: LemonMenuItems | null) => ({ menuItems }),
        insertAfter: (content: JSONContent) => ({ content }),
        insertAfterLastNodeOfType: (nodeType: string, content: JSONContent) => ({ content, nodeType }),
        updateAttributes: (attributes: Partial<NotebookNodeAttributes<any>>) => ({ attributes }),
        insertOrSelectNextLine: true,
        setPreviousNode: (node: RichContentNode | null) => ({ node }),
        setNextNode: (node: RichContentNode | null) => ({ node }),
        deleteNode: true,
        selectNode: (scroll?: boolean) => ({ scroll }),
        toggleEditing: (visible?: boolean) => ({ visible }),
        scrollIntoView: true,
        initializeNode: true,
        setMessageListeners: (listeners: NotebookNodeMessagesListeners) => ({ listeners }),
        setTitlePlaceholder: (titlePlaceholder: string) => ({ titlePlaceholder }),
        setRef: (ref: HTMLElement | null) => ({ ref }),
        toggleEditingTitle: (editing?: boolean) => ({ editing }),
        copyToClipboard: true,
        convertToBacklink: (href: string) => ({ href }),
        navigateToNode: (nodeId: string) => ({ nodeId }),
        runPythonNode: (payload: { code: string }) => payload,
        runPythonNodeWithMode: (payload: { mode: PythonRunMode }) => payload,
        setPythonRunLoading: (loading: boolean) => ({ loading }),
        setPythonRunQueued: (queued: boolean) => ({ queued }),
        runDuckSqlNode: true,
        runDuckSqlNodeWithMode: (payload: { mode: DuckSqlRunMode }) => payload,
        setDuckSqlRunLoading: (loading: boolean) => ({ loading }),
        setDuckSqlRunQueued: (queued: boolean) => ({ queued }),
        runInsightsqlSqlNode: true,
        runInsightsqlSqlNodeWithMode: (payload: { mode: InsightsqlSqlRunMode }) => payload,
        setInsightsqlSqlRunLoading: (loading: boolean) => ({ loading }),
        setInsightsqlSqlRunQueued: (queued: boolean) => ({ queued }),
        setDataframeVariableName: (variableName: string | null, initialResult?: NotebookDataframeResult | null) => ({
            variableName,
            initialResult,
        }),
        setDataframePage: (page: number) => ({ page }),
        setDataframePageSize: (pageSize: number) => ({ pageSize }),
        loadDataframePage: (payload: { variableName: string; pageSize?: number }) => payload,
        setDataframeResult: (result: NotebookDataframeResult | null) => ({ result }),
        setDataframeLoading: (loading: boolean) => ({ loading }),
        setDataframeError: (error: string | null) => ({ error }),
        resetDataframeResults: true,
    }),

    connect((props: NotebookNodeLogicProps) => ({
        actions: [props.notebookLogic, ['onUpdateEditor', 'setTextSelection']],
        values: [
            props.notebookLogic,
            [
                'editor',
                'isEditable',
                'comments',
                'pythonNodeSummaries',
                'duckSqlNodeSummaries',
                'insightsqlSqlNodeSummaries',
                'dependencyGraph',
                'notebook',
                'kernelInfo',
            ],
        ],
    })),

    reducers(({ props }) => ({
        ref: [
            null as HTMLElement | null,
            {
                setRef: (_, { ref }) => ref,
            },
        ],
        expanded: [
            props.startExpanded ?? true,
            {
                setExpanded: (_, { expanded }) => expanded,
            },
        ],
        resizeable: [
            false,
            {
                setResizeable: (_, { resizeable }) => resizeable,
            },
        ],
        previousNode: [
            null as RichContentNode | null,
            {
                setPreviousNode: (_, { node }) => node,
            },
        ],
        nextNode: [
            null as RichContentNode | null,
            {
                setNextNode: (_, { node }) => node,
            },
        ],
        actions: [
            [] as NotebookNodeAction[],
            {
                setActions: (_, { actions }) => actions.filter((x) => !!x) as NotebookNodeAction[],
            },
        ],
        customMenuItems: [
            null as LemonMenuItems | null,
            {
                setMenuItems: (_, { menuItems }) => menuItems,
            },
        ],
        messageListeners: [
            props.messageListeners as NotebookNodeMessagesListeners,
            {
                setMessageListeners: (_, { listeners }) => listeners,
            },
        ],
        titlePlaceholder: [
            props.titlePlaceholder,
            {
                setTitlePlaceholder: (_, { titlePlaceholder }) => titlePlaceholder,
            },
        ],
        isEditingTitle: [
            false,
            {
                toggleEditingTitle: (state, { editing }) => (typeof editing === 'boolean' ? editing : !state),
            },
        ],
        pythonRunLoading: [
            false,
            {
                setPythonRunLoading: (_, { loading }) => loading,
            },
        ],
        pythonRunQueued: [
            false,
            {
                setPythonRunQueued: (_, { queued }) => queued,
            },
        ],
        duckSqlRunLoading: [
            false,
            {
                setDuckSqlRunLoading: (_, { loading }) => loading,
            },
        ],
        duckSqlRunQueued: [
            false,
            {
                setDuckSqlRunQueued: (_, { queued }) => queued,
            },
        ],
        insightsqlSqlRunLoading: [
            false,
            {
                setInsightsqlSqlRunLoading: (_, { loading }) => loading,
            },
        ],
        insightsqlSqlRunQueued: [
            false,
            {
                setInsightsqlSqlRunQueued: (_, { queued }) => queued,
            },
        ],
        dataframeVariableName: [
            null as string | null,
            {
                setDataframeVariableName: (_, { variableName }) => variableName,
            },
        ],
        dataframePage: [
            1,
            {
                setDataframePage: (_, { page }) => page,
                setDataframePageSize: () => 1,
                resetDataframeResults: () => 1,
            },
        ],
        dataframePageSize: [
            DEFAULT_DATAFRAME_PAGE_SIZE as number,
            {
                setDataframePageSize: (_, { pageSize }) => pageSize,
            },
        ],
        dataframeResult: [
            null as NotebookDataframeResult | null,
            {
                setDataframeResult: (_, { result }) => result,
                resetDataframeResults: () => null,
            },
        ],
        dataframeLoading: [
            false,
            {
                setDataframeLoading: (_, { loading }) => loading,
                resetDataframeResults: () => false,
            },
        ],
        dataframeError: [
            null as string | null,
            {
                setDataframeError: (_, { error }) => error,
                resetDataframeResults: () => null,
            },
        ],
    })),

    selectors({
        notebookLogic: [(_, p) => [p.notebookLogic], (notebookLogic): BuiltLogic<notebookLogicType> => notebookLogic],
        nodeAttributes: [(_, p) => [p.attributes], (nodeAttributes): NotebookNodeAttributes<any> => nodeAttributes],
        nodeId: [
            (_, p) => [p.attributes],
            (nodeAttributes: NotebookNodeAttributes<any>): string => nodeAttributes.nodeId,
        ],
        nodeType: [(_, p) => [p.nodeType], (nodeType) => nodeType],
        Settings: [() => [(_, props) => props], (props): NotebookNodeSettings | null => props.Settings ?? null],
        settingsPlacement: [
            () => [(_, props) => props],
            (props): NotebookNodeSettingsPlacement => props.settingsPlacement ?? 'left',
        ],

        title: [
            (s) => [s.titlePlaceholder, s.nodeAttributes],
            (titlePlaceholder, nodeAttributes) => nodeAttributes.title || titlePlaceholder,
        ],
        // TODO: Fix the typing of nodeAttributes
        children: [(s) => [s.nodeAttributes], (nodeAttributes): NotebookNodeResource[] => nodeAttributes.children],

        exportedGlobals: [
            (s) => [s.nodeAttributes],
            (nodeAttributes): { name: string; type: string }[] => nodeAttributes.globalsExportedWithTypes ?? [],
        ],
        pythonExecution: [
            (s) => [s.nodeAttributes],
            (nodeAttributes): PythonExecutionResult | null => nodeAttributes.pythonExecution ?? null,
        ],
        displayedGlobals: [
            (s) => [s.exportedGlobals, s.pythonExecution],
            (exportedGlobals, pythonExecution): { name: string; type: string; insightsqlQuery?: string }[] => {
                if (!pythonExecution?.variables?.length) {
                    return exportedGlobals
                }

                const detailsByName = new Map<string, { type: string; insightsqlQuery?: string }>(
                    pythonExecution.variables.map((variable: PythonExecutionVariable) => [
                        variable.name,
                        { type: variable.type, insightsqlQuery: variable.insightsqlQuery },
                    ])
                )
                return exportedGlobals.map(({ name, type }) => ({
                    name,
                    type: detailsByName.get(name)?.type ?? type,
                    insightsqlQuery: detailsByName.get(name)?.insightsqlQuery,
                }))
            },
        ],

        pythonNodeIndex: [
            (s) => [s.pythonNodeSummaries, s.nodeId],
            (pythonNodeSummaries, nodeId) => pythonNodeSummaries.findIndex((node) => node.nodeId === nodeId),
        ],
        duckSqlNodeIndex: [
            (s) => [s.duckSqlNodeSummaries, s.nodeId],
            (duckSqlNodeSummaries, nodeId) => duckSqlNodeSummaries.findIndex((node) => node.nodeId === nodeId),
        ],
        duckSqlReturnVariable: [
            (s) => [s.duckSqlNodeSummaries, s.nodeId, s.nodeAttributes],
            (duckSqlNodeSummaries, nodeId, nodeAttributes): string =>
                getUniqueDuckSqlReturnVariable(duckSqlNodeSummaries, nodeId, nodeAttributes.returnVariable ?? ''),
        ],
        insightsqlSqlNodeIndex: [
            (s) => [s.insightsqlSqlNodeSummaries, s.nodeId],
            (insightsqlSqlNodeSummaries, nodeId) => insightsqlSqlNodeSummaries.findIndex((node) => node.nodeId === nodeId),
        ],
        insightsqlSqlReturnVariable: [
            (s) => [s.insightsqlSqlNodeSummaries, s.nodeId, s.nodeAttributes],
            (insightsqlSqlNodeSummaries, nodeId, nodeAttributes): string =>
                getUniqueInsightsqlReturnVariable(insightsqlSqlNodeSummaries, nodeId, nodeAttributes.returnVariable ?? ''),
        ],
        dataframeRowCount: [(s) => [s.dataframeResult], (dataframeResult): number => dataframeResult?.rowCount ?? 0],
        duckSqlTablesUsed: [
            (s) => [s.dependencyGraph, s.nodeId],
            (dependencyGraph, nodeId): string[] => dependencyGraph.nodesById[nodeId]?.uses ?? [],
        ],
        duckSqlUpstreamTableSources: [
            (s) => [s.dependencyGraph, s.nodeId],
            (dependencyGraph, nodeId): Record<string, NotebookDependencyUsage> =>
                dependencyGraph.upstreamSourcesByNode[nodeId] ?? {},
        ],
        duckSqlReturnVariableUsage: [
            (s) => [s.dependencyGraph, s.nodeId, s.duckSqlReturnVariable],
            (dependencyGraph, nodeId, duckSqlReturnVariable): NotebookDependencyUsage[] =>
                dependencyGraph.downstreamUsageByNode[nodeId]?.[duckSqlReturnVariable] ?? [],
        ],
        insightsqlReturnVariableUsage: [
            (s) => [s.dependencyGraph, s.nodeId, s.insightsqlSqlReturnVariable],
            (dependencyGraph, nodeId, insightsqlSqlReturnVariable): NotebookDependencyUsage[] =>
                dependencyGraph.downstreamUsageByNode[nodeId]?.[insightsqlSqlReturnVariable] ?? [],
        ],

        usageByVariable: [
            (s) => [s.dependencyGraph, s.exportedGlobals, s.nodeId],
            (dependencyGraph, exportedGlobals, nodeId): Record<string, NotebookDependencyUsage[]> => {
                const usageMap: Record<string, NotebookDependencyUsage[]> = {}

                exportedGlobals.forEach(({ name }) => {
                    const usages = dependencyGraph.downstreamUsageByNode[nodeId]?.[name] ?? []
                    usageMap[name] = usages.filter((usage) => usage.nodeType === NotebookNodeType.Python)
                })

                return usageMap
            },
        ],

        sendMessage: [
            (s) => [s.messageListeners],
            (messageListeners) => {
                return <T extends keyof NotebookNodeMessages>(
                    message: T,
                    payload: NotebookNodeMessages[T]
                ): boolean => {
                    if (!messageListeners[message]) {
                        return false
                    }

                    messageListeners[message]?.(payload)
                    return true
                }
            },
        ],

        sourceComment: [
            (s) => [s.comments, s.nodeId],
            (comments, nodeId) =>
                comments &&
                comments.find(
                    (comment) => comment.item_context?.type === 'node' && comment.item_context?.id === nodeId
                ),
        ],
    }),

    listeners(({ actions, values, props }) => ({
        onUpdateEditor: async () => {
            if (!props.getPos) {
                return
            }
            const editor = values.notebookLogic.values.editor
            const pos = props.getPos()
            if (editor && pos) {
                const { previous, next } = editor.getAdjacentNodes(pos)
                actions.setPreviousNode(previous)
                actions.setNextNode(next)
            }
        },

        insertAfter: ({ content }) => {
            const pos = props.getPos?.()
            if (!pos) {
                return
            }
            const logic = values.notebookLogic
            logic.values.editor?.insertContentAfterNode(pos, content)
        },

        deleteNode: () => {
            const pos = props.getPos?.()
            if (!pos) {
                // TODO: somehow make this delete from the parent
                return
            }

            const logic = values.notebookLogic
            logic.values.editor?.deleteRange({ from: pos, to: pos + 1 }).run()
            if (values.notebookLogic.values.editingNodeIds[values.nodeId]) {
                values.notebookLogic.actions.setEditingNodeEditing(values.nodeId, false)
            }
        },

        selectNode: ({ scroll }) => {
            const pos = props.getPos?.()
            if (!pos) {
                return
            }
            const editor = values.notebookLogic.values.editor

            if (editor) {
                editor.setSelection(pos)
                if (scroll ?? true) {
                    editor.scrollToSelection()
                }
            }
        },

        navigateToNode: ({ nodeId }) => {
            const targetLogic = values.notebookLogic.values.findNodeLogicById(nodeId)
            targetLogic?.actions.selectNode()
        },

        scrollIntoView: () => {
            const pos = props.getPos?.()
            if (!pos) {
                return
            }
            values.editor?.scrollToPosition(pos)
        },

        insertAfterLastNodeOfType: ({ nodeType, content }) => {
            const insertionPosition = props.getPos?.()
            if (!insertionPosition) {
                return
            }
            values.notebookLogic.actions.insertAfterLastNodeOfType(nodeType, content, insertionPosition)
        },
        insertOrSelectNextLine: () => {
            const pos = props.getPos?.()
            if (!pos || !values.isEditable) {
                return
            }

            if (!values.nextNode || !values.nextNode.isTextblock) {
                actions.insertAfter({
                    type: 'paragraph',
                })
            } else {
                actions.setTextSelection(pos + 1)
            }
        },

        setExpanded: ({ expanded }) => {
            if (expanded) {
                posthog.capture('notebook node expanded', {
                    node_type: props.nodeType,
                    short_id: props.notebookLogic.props.shortId,
                })
            }
        },

        updateAttributes: ({ attributes }) => {
            props.updateAttributes(attributes)
        },
        toggleEditing: ({ visible }) => {
            const isEditing = values.notebookLogic.values.editingNodeIds[values.nodeId]
            const shouldShowThis = typeof visible === 'boolean' ? visible : !isEditing

            props.notebookLogic.actions.setEditingNodeEditing(values.nodeId, shouldShowThis)
            if (
                props.nodeType === NotebookNodeType.Python ||
                (props.nodeType === NotebookNodeType.Query && isSqlQueryNode(values.nodeAttributes)) ||
                props.nodeType === NotebookNodeType.DuckSQL ||
                props.nodeType === NotebookNodeType.InsightsQLSQL
            ) {
                actions.updateAttributes({ showSettings: shouldShowThis })
            }
        },
        initializeNode: () => {
            const { __init } = values.nodeAttributes

            if (__init) {
                if (__init.expanded) {
                    actions.setExpanded(true)
                }
                if (__init.showSettings) {
                    actions.toggleEditing(true)
                }
                if (
                    (props.nodeType === NotebookNodeType.Python ||
                        (props.nodeType === NotebookNodeType.Query && isSqlQueryNode(values.nodeAttributes)) ||
                        props.nodeType === NotebookNodeType.DuckSQL ||
                        props.nodeType === NotebookNodeType.InsightsQLSQL) &&
                    __init.showSettings
                ) {
                    actions.updateAttributes({ showSettings: true })
                }
                props.updateAttributes({ __init: null })
            }
            if (
                props.nodeType === NotebookNodeType.Python ||
                (props.nodeType === NotebookNodeType.Query && isSqlQueryNode(values.nodeAttributes)) ||
                props.nodeType === NotebookNodeType.DuckSQL ||
                props.nodeType === NotebookNodeType.InsightsQLSQL
            ) {
                const shouldShowSettings = __init?.showSettings ?? values.nodeAttributes.showSettings
                if (typeof shouldShowSettings === 'boolean') {
                    props.notebookLogic.actions.setEditingNodeEditing(values.nodeId, shouldShowSettings)
                }
            }
            if (props.nodeType === NotebookNodeType.DuckSQL) {
                const currentReturnVariable =
                    typeof values.nodeAttributes.returnVariable === 'string'
                        ? values.nodeAttributes.returnVariable
                        : 'duck_df'
                const uniqueReturnVariable = getUniqueDuckSqlReturnVariable(
                    values.duckSqlNodeSummaries,
                    values.nodeId,
                    currentReturnVariable
                )
                if (uniqueReturnVariable !== resolveDuckSqlReturnVariable(currentReturnVariable)) {
                    actions.updateAttributes({ returnVariable: uniqueReturnVariable })
                }
                const cachedExecution = values.nodeAttributes.duckExecution
                if (
                    !values.dataframeVariableName &&
                    cachedExecution?.status === 'ok' &&
                    typeof cachedExecution.result === 'string'
                ) {
                    const previewResult = parseDataframePreview(cachedExecution.result)
                    if (previewResult) {
                        actions.setDataframeVariableName(values.duckSqlReturnVariable, previewResult)
                    }
                }
            }
            if (props.nodeType === NotebookNodeType.InsightsQLSQL) {
                const currentReturnVariable =
                    typeof values.nodeAttributes.returnVariable === 'string'
                        ? values.nodeAttributes.returnVariable
                        : 'insightsql_df'
                const uniqueReturnVariable = getUniqueInsightsqlReturnVariable(
                    values.insightsqlSqlNodeSummaries,
                    values.nodeId,
                    currentReturnVariable
                )
                if (uniqueReturnVariable !== resolveInsightsqlReturnVariable(currentReturnVariable)) {
                    actions.updateAttributes({ returnVariable: uniqueReturnVariable })
                }
                const cachedExecution = values.nodeAttributes.insightsqlExecution
                if (
                    !values.dataframeVariableName &&
                    cachedExecution?.status === 'ok' &&
                    typeof cachedExecution.result === 'string'
                ) {
                    const previewResult = parseDataframePreview(cachedExecution.result)
                    if (previewResult) {
                        actions.setDataframeVariableName(values.insightsqlSqlReturnVariable, previewResult)
                    }
                }
            }
        },

        copyToClipboard: async () => {
            const { nodeAttributes } = values

            const htmlAttributesString = Object.entries(nodeAttributes)
                .map(([key, value]) => {
                    if (key === 'nodeId' || key.startsWith('__')) {
                        return ''
                    }

                    if (value === null || value === undefined) {
                        return ''
                    }

                    if (key === 'title') {
                        return `title='${JSON.stringify(value)}'`
                    }

                    return `${key}='${btoa(JSON.stringify(value))}'`
                })
                .filter((x) => !!x)
                .join(' ')

            const html = `<${props.nodeType} ${htmlAttributesString} data-pm-slice="0 0 []"></${props.nodeType}>`

            const type = 'text/html'
            const blob = new Blob([html], { type })
            const data = [new ClipboardItem({ [type]: blob })]

            await window.navigator.clipboard.write(data)
        },
        convertToBacklink: ({ href }) => {
            const pos = props.getPos?.()
            const editor = values.notebookLogic.values.editor
            if (!pos || !editor) {
                return
            }

            editor.insertContentAfterNode(pos, {
                type: NotebookNodeType.Backlink,
                attrs: {
                    href,
                },
            })
            actions.deleteNode()
        },
        runPythonNode: async ({ code }) => {
            if (props.nodeType !== NotebookNodeType.Python) {
                return
            }
            const notebook = values.notebook
            if (!notebook) {
                return
            }
            const executionSandboxId =
                values.kernelInfo?.sandbox_id ??
                (values.nodeAttributes as { pythonExecutionSandboxId?: string | null }).pythonExecutionSandboxId ??
                null
            const { executed, execution } = await runPythonCell({
                notebookId: notebook.short_id,
                code,
                exportedGlobals: values.exportedGlobals,
                updateAttributes: actions.updateAttributes,
                setPythonRunLoading: actions.setPythonRunLoading,
                executionSandboxId,
            })
            if (!executed) {
                actions.setDataframeVariableName(null)
                return
            }
            const dataframeVariable = findDataframeVariable(execution?.variables)
            actions.setDataframeVariableName(dataframeVariable)
        },

        runDuckSqlNode: async () => {
            if (props.nodeType !== NotebookNodeType.DuckSQL) {
                return
            }
            const notebook = values.notebook
            if (!notebook) {
                return
            }
            const { code = '', returnVariable = 'duck_df' } = values.nodeAttributes as {
                code?: string
                returnVariable?: string
                duckExecutionSandboxId?: string | null
            }
            const executionSandboxId =
                values.kernelInfo?.sandbox_id ?? values.nodeAttributes.duckExecutionSandboxId ?? null
            const resolvedReturnVariable = getUniqueDuckSqlReturnVariable(
                values.duckSqlNodeSummaries,
                values.nodeId,
                returnVariable
            )
            const { executed, execution } = await runDuckSqlCell({
                notebookId: notebook.short_id,
                code,
                returnVariable: resolvedReturnVariable,
                pageSize: values.dataframePageSize,
                updateAttributes: actions.updateAttributes,
                setDuckSqlRunLoading: actions.setDuckSqlRunLoading,
                executionSandboxId,
            })
            if (!executed || execution?.status !== 'ok') {
                actions.setDataframeVariableName(null)
                return
            }
            const previewResult = parseDataframePreview(execution?.result)
            actions.setDataframeVariableName(values.duckSqlReturnVariable, previewResult)
        },
        runDuckSqlNodeWithMode: async ({ mode }) => {
            if (props.nodeType !== NotebookNodeType.DuckSQL) {
                return
            }
            const notebook = values.notebook
            if (!notebook) {
                return
            }

            if (mode === 'cell') {
                await actions.runDuckSqlNode()
                return
            }

            const direction: DependencyRunDirection = mode === 'cell_downstream' ? 'downstream' : 'upstream'
            const nodesToRunWithLogic = getDependencyEntriesWithLogic({
                dependencyGraph: values.dependencyGraph,
                nodeId: values.nodeId,
                direction,
                notebookLogic: values.notebookLogic,
            })
            if (nodesToRunWithLogic.length === 0) {
                await actions.runDuckSqlNode()
                return
            }

            await runDependencyNodes({
                entries: nodesToRunWithLogic,
                notebookId: notebook.short_id,
                mode,
                duckSqlNodeSummaries: values.duckSqlNodeSummaries,
                insightsqlSqlNodeSummaries: values.insightsqlSqlNodeSummaries,
                currentNodeId: values.nodeId,
            })
        },

        runInsightsqlSqlNode: async () => {
            if (props.nodeType !== NotebookNodeType.InsightsQLSQL) {
                return
            }
            const notebook = values.notebook
            if (!notebook) {
                return
            }
            const { code = '', returnVariable = 'insightsql_df' } = values.nodeAttributes as {
                code?: string
                returnVariable?: string
                insightsqlExecutionSandboxId?: string | null
            }
            const executionSandboxId =
                values.kernelInfo?.sandbox_id ?? values.nodeAttributes.insightsqlExecutionSandboxId ?? null
            const resolvedReturnVariable = getUniqueInsightsqlReturnVariable(
                values.insightsqlSqlNodeSummaries,
                values.nodeId,
                returnVariable
            )
            const placeholders = extractInsightsqlPlaceholders(code)
            const { executed, execution } = await runInsightsqlSqlCell({
                notebookId: notebook.short_id,
                code,
                placeholders,
                returnVariable: resolvedReturnVariable,
                pageSize: values.dataframePageSize,
                updateAttributes: actions.updateAttributes,
                setInsightsqlSqlRunLoading: actions.setInsightsqlSqlRunLoading,
                executionSandboxId,
            })
            if (!executed || execution?.status !== 'ok') {
                actions.setDataframeVariableName(null)
                return
            }
            const previewResult = parseDataframePreview(execution?.result)
            actions.setDataframeVariableName(values.insightsqlSqlReturnVariable, previewResult)
        },
        runInsightsqlSqlNodeWithMode: async ({ mode }) => {
            if (props.nodeType !== NotebookNodeType.InsightsQLSQL) {
                return
            }
            const notebook = values.notebook
            if (!notebook) {
                return
            }

            if (mode === 'cell') {
                await actions.runInsightsqlSqlNode()
                return
            }

            const direction: DependencyRunDirection = mode === 'cell_downstream' ? 'downstream' : 'upstream'
            const nodesToRunWithLogic = getDependencyEntriesWithLogic({
                dependencyGraph: values.dependencyGraph,
                nodeId: values.nodeId,
                direction,
                notebookLogic: values.notebookLogic,
            })
            if (nodesToRunWithLogic.length === 0) {
                await actions.runInsightsqlSqlNode()
                return
            }

            await runDependencyNodes({
                entries: nodesToRunWithLogic,
                notebookId: notebook.short_id,
                mode,
                duckSqlNodeSummaries: values.duckSqlNodeSummaries,
                insightsqlSqlNodeSummaries: values.insightsqlSqlNodeSummaries,
                currentNodeId: values.nodeId,
            })
        },

        runPythonNodeWithMode: async ({ mode }) => {
            if (props.nodeType !== NotebookNodeType.Python) {
                return
            }
            const notebook = values.notebook
            if (!notebook) {
                return
            }

            if (mode === 'cell') {
                await actions.runPythonNode({ code: (values.nodeAttributes as { code?: string }).code ?? '' })
                return
            }

            const direction: DependencyRunDirection = mode === 'cell_downstream' ? 'downstream' : 'upstream'
            const nodesToRunWithLogic = getDependencyEntriesWithLogic({
                dependencyGraph: values.dependencyGraph,
                nodeId: values.nodeId,
                direction,
                notebookLogic: values.notebookLogic,
            })
            if (nodesToRunWithLogic.length === 0) {
                await actions.runPythonNode({ code: (values.nodeAttributes as { code?: string }).code ?? '' })
                return
            }

            await runDependencyNodes({
                entries: nodesToRunWithLogic,
                notebookId: notebook.short_id,
                mode,
                duckSqlNodeSummaries: values.duckSqlNodeSummaries,
                insightsqlSqlNodeSummaries: values.insightsqlSqlNodeSummaries,
                currentNodeId: values.nodeId,
            })
        },
        setDataframeVariableName: ({ variableName, initialResult }) => {
            actions.resetDataframeResults()
            if (variableName) {
                if (initialResult) {
                    actions.setDataframeResult(initialResult)
                } else {
                    actions.loadDataframePage({ variableName })
                }
            }
        },
        setDataframePage: () => {
            if (!values.dataframeVariableName) {
                return
            }
            actions.loadDataframePage({ variableName: values.dataframeVariableName })
        },
        setDataframePageSize: ({ pageSize }) => {
            if (!values.dataframeVariableName) {
                return
            }
            actions.loadDataframePage({ variableName: values.dataframeVariableName, pageSize })
        },
        loadDataframePage: async ({ variableName, pageSize }) => {
            const notebook = values.notebook
            if (!notebook) {
                return
            }
            const nodeLogic = values.notebookLogic.values.findNodeLogicById(values.nodeId)
            if (
                props.nodeType === NotebookNodeType.DuckSQL &&
                nodeLogic &&
                !isDuckSqlExecutionFresh(
                    nodeLogic,
                    (values.nodeAttributes as { code?: string }).code ?? '',
                    values.duckSqlReturnVariable
                )
            ) {
                const nodesToRunWithLogic = getDependencyEntriesWithLogic({
                    dependencyGraph: values.dependencyGraph,
                    nodeId: values.nodeId,
                    direction: 'upstream',
                    notebookLogic: values.notebookLogic,
                })
                if (nodesToRunWithLogic.length > 0) {
                    await runDependencyNodes({
                        entries: nodesToRunWithLogic,
                        notebookId: notebook.short_id,
                        mode: 'cell_upstream',
                        duckSqlNodeSummaries: values.duckSqlNodeSummaries,
                        insightsqlSqlNodeSummaries: values.insightsqlSqlNodeSummaries,
                        currentNodeId: values.nodeId,
                        skipDataframeVariableUpdateForNodeId: values.nodeId,
                    })
                }
            }
            if (
                props.nodeType === NotebookNodeType.InsightsQLSQL &&
                nodeLogic &&
                !isInsightsqlSqlExecutionFresh(
                    nodeLogic,
                    (values.nodeAttributes as { code?: string }).code ?? '',
                    values.insightsqlSqlReturnVariable
                )
            ) {
                const nodesToRunWithLogic = getDependencyEntriesWithLogic({
                    dependencyGraph: values.dependencyGraph,
                    nodeId: values.nodeId,
                    direction: 'upstream',
                    notebookLogic: values.notebookLogic,
                })
                if (nodesToRunWithLogic.length > 0) {
                    await runDependencyNodes({
                        entries: nodesToRunWithLogic,
                        notebookId: notebook.short_id,
                        mode: 'cell_upstream',
                        duckSqlNodeSummaries: values.duckSqlNodeSummaries,
                        insightsqlSqlNodeSummaries: values.insightsqlSqlNodeSummaries,
                        currentNodeId: values.nodeId,
                        skipDataframeVariableUpdateForNodeId: values.nodeId,
                    })
                }
            }
            actions.setDataframeLoading(true)
            actions.setDataframeError(null)
            const resolvedPageSize = pageSize ?? values.dataframePageSize
            const offset = (values.dataframePage - 1) * resolvedPageSize
            try {
                const response = await api.notebooks.kernelDataframe(notebook.short_id, {
                    variable_name: variableName,
                    offset,
                    limit: resolvedPageSize,
                })
                actions.setDataframeResult(response)
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to load dataframe results.'
                actions.setDataframeError(message)
                actions.setDataframeResult(null)
            } finally {
                actions.setDataframeLoading(false)
            }
        },
    })),

    afterMount((logic) => {
        const { props, actions, values } = logic

        // The node logic is mounted after the editor is mounted, so we need to wait a tick before we can register it
        queueMicrotask(() => {
            props.notebookLogic.actions.registerNodeLogic(values.nodeId, logic as any)
        })

        const isResizeable =
            typeof props.resizeable === 'function' ? props.resizeable(props.attributes) : (props.resizeable ?? true)

        actions.setResizeable(isResizeable)
        actions.initializeNode()
    }),

    beforeUnmount(({ props, values }) => {
        // Note this doesn't work as there may be other places where this is used. The NodeWrapper should be in charge of somehow unmounting this
        props.notebookLogic.actions.unregisterNodeLogic(values.nodeId)
    }),
])
