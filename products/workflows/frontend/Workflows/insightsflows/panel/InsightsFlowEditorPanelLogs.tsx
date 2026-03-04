import { useValues } from 'kea'

import { LemonButton } from '@hanzo/lemon-ui'

import { IconOpenInApp } from 'lib/lemon-ui/icons'
import { LogsViewer } from 'scenes/insights-functions/logs/LogsViewer'
import { urls } from 'scenes/urls'

import { renderWorkflowLogMessage } from '../../logs/log-utils'
import { insightsFlowEditorLogic } from '../insightsFlowEditorLogic'

export function InsightsFlowEditorPanelLogs(): JSX.Element | null {
    const { workflow, selectedNode } = useValues(insightsFlowEditorLogic)

    const actionId = selectedNode?.data.id

    const shouldShowActionLevelLogs = workflow.trigger?.type !== 'batch'

    return (
        <>
            <div className="border-b">
                <LemonButton to={urls.workflow(workflow.id, 'logs')} size="xsmall" sideIcon={<IconOpenInApp />}>
                    {shouldShowActionLevelLogs
                        ? 'Click here to open in full log viewer'
                        : 'Click here to open batch workflow invocations tab'}
                </LemonButton>
            </div>
            {shouldShowActionLevelLogs && (
                <div className="p-2 flex flex-col gap-2 overflow-y-auto">
                    <LogsViewer
                        logicKey={`fn-flow-editor-panel-${actionId || 'all'}`}
                        instanceLabel="workflow run"
                        sourceType="insights_flow"
                        sourceId={workflow.id}
                        groupByInstanceId={!selectedNode}
                        searchGroups={actionId ? [`[Action:${actionId}]`] : undefined}
                        renderMessage={(m) => renderWorkflowLogMessage(workflow, m)}
                    />
                </div>
            )}
        </>
    )
}
