import { useActions, useValues } from 'kea'
import insights from '@hanzo/insights'
import { KeyboardEvent, useEffect, useState } from 'react'

import { LemonInput, LemonTag, Tooltip } from '@hanzo/lemon-ui'

import { notebookLogic } from 'scenes/notebooks/Notebook/notebookLogic'

import { isInsightsQLQuery } from '~/queries/utils'

import { NotebookNodeType } from '../../types'
import { notebookNodeLogic } from '../notebookNodeLogic'

const getNodeIndex = ({
    isPythonNode,
    isDuckSqlNode,
    isInsightsqlSqlNode,
    isSqlNode,
    nodeId,
    pythonNodeIndices,
    duckSqlNodeIndices,
    insightsqlSqlNodeIndices,
    sqlNodeIndices,
}: {
    isPythonNode: boolean
    isDuckSqlNode: boolean
    isInsightsqlSqlNode: boolean
    isSqlNode: boolean
    nodeId: string
    pythonNodeIndices: Map<string, number>
    duckSqlNodeIndices: Map<string, number>
    insightsqlSqlNodeIndices: Map<string, number>
    sqlNodeIndices: Map<string, number>
}): number | undefined => {
    if (isPythonNode) {
        return pythonNodeIndices.get(nodeId)
    }
    if (isDuckSqlNode) {
        return duckSqlNodeIndices.get(nodeId)
    }
    if (isInsightsqlSqlNode) {
        return insightsqlSqlNodeIndices.get(nodeId)
    }
    if (isSqlNode) {
        return sqlNodeIndices.get(nodeId)
    }
    return undefined
}

export const getCellLabel = (nodeIndex: number | undefined, nodeType: NotebookNodeType): string | null => {
    if (!nodeIndex) {
        return null
    }

    if (nodeType === NotebookNodeType.Python) {
        return `Python ${nodeIndex}`
    }
    if (nodeType === NotebookNodeType.DuckSQL) {
        return `SQL (DuckDB) ${nodeIndex}`
    }
    if (nodeType === NotebookNodeType.InsightsQLSQL) {
        return `SQL (InsightsQL) ${nodeIndex}`
    }
    return `SQL ${nodeIndex}`
}

export function NotebookNodeTitle(): JSX.Element {
    const { isEditable, pythonNodeIndices, sqlNodeIndices, duckSqlNodeIndices, insightsqlSqlNodeIndices } =
        useValues(notebookLogic)
    const { nodeAttributes, title, titlePlaceholder, isEditingTitle, nodeType } = useValues(notebookNodeLogic)
    const { updateAttributes, toggleEditingTitle } = useActions(notebookNodeLogic)
    const [newValue, setNewValue] = useState('')

    const isPythonNode = nodeType === NotebookNodeType.Python
    const isDuckSqlNode = nodeType === NotebookNodeType.DuckSQL
    const isInsightsqlSqlNode = nodeType === NotebookNodeType.InsightsQLSQL
    const isSqlNode =
        nodeType === NotebookNodeType.Query &&
        (isInsightsQLQuery(nodeAttributes.query) ||
            (nodeAttributes.query.source && isInsightsQLQuery(nodeAttributes.query.source)))

    const nodeIndex = getNodeIndex({
        isPythonNode,
        isDuckSqlNode,
        isInsightsqlSqlNode,
        isSqlNode,
        nodeId: nodeAttributes.nodeId,
        pythonNodeIndices,
        duckSqlNodeIndices,
        insightsqlSqlNodeIndices,
        sqlNodeIndices,
    })
    const cellLabel = getCellLabel(nodeIndex, nodeType)
    const customTitle = nodeAttributes.title
    const cellTitle = cellLabel ? (customTitle ? `${cellLabel} • ${customTitle}` : cellLabel) : title

    useEffect(() => {
        setNewValue(nodeAttributes.title ?? '')
    }, [isEditingTitle]) // oxlint-disable-line react-hooks/exhaustive-deps

    const commitEdit = (): void => {
        updateAttributes({
            title: newValue ?? undefined,
        })

        if (title != newValue) {
            insights.capture('notebook node title updated')
        }

        toggleEditingTitle(false)
    }

    const onKeyUp = (e: KeyboardEvent<HTMLInputElement>): void => {
        // Esc cancels, enter commits
        if (e.key === 'Escape') {
            toggleEditingTitle(false)
        } else if (e.key === 'Enter') {
            commitEdit()
        }
    }

    const suggestedTaskTitle = (
        <span className="NotebookNodeTitle flex items-center gap-2" title={title}>
            <LemonTag type="warning" size="small">
                Suggested task
            </LemonTag>
            <span className="truncate">{title}</span>
        </span>
    )

    const cellTitleDisplay = cellLabel ? (
        <span title={cellTitle} className="NotebookNodeTitle flex items-center gap-2 truncate">
            <span className="font-semibold">{cellLabel}</span>
            {customTitle ? <span className="text-muted truncate">{customTitle}</span> : null}
        </span>
    ) : (
        <span title={title} className="NotebookNodeTitle">
            {title}
        </span>
    )

    return !isEditable ? (
        nodeType === NotebookNodeType.TaskCreate ? (
            suggestedTaskTitle
        ) : (
            cellTitleDisplay
        )
    ) : !isEditingTitle ? (
        <Tooltip title="Double click to edit title">
            {nodeType === NotebookNodeType.TaskCreate ? (
                <span
                    title={title}
                    className="NotebookNodeTitle NotebookNodeTitle--editable"
                    onDoubleClick={() => {
                        toggleEditingTitle(true)
                        insights.capture('notebook editing node title')
                    }}
                >
                    {suggestedTaskTitle}
                </span>
            ) : (
                <span
                    title={cellTitle}
                    className="NotebookNodeTitle NotebookNodeTitle--editable"
                    onDoubleClick={() => {
                        toggleEditingTitle(true)
                        insights.capture('notebook editing node title')
                    }}
                >
                    {cellLabel ? (
                        <span className="flex items-center gap-2 truncate">
                            <span className="font-semibold">{cellLabel}</span>
                            {customTitle ? <span className="text-muted truncate">{customTitle}</span> : null}
                        </span>
                    ) : (
                        title
                    )}
                </span>
            )}
        </Tooltip>
    ) : (
        <LemonInput
            autoFocus
            placeholder={titlePlaceholder}
            size="small"
            fullWidth
            value={newValue}
            onChange={(e) => setNewValue(e)}
            onBlur={commitEdit}
            onKeyUp={onKeyUp}
            onFocus={(e) => e.target.select()}
        />
    )
}
