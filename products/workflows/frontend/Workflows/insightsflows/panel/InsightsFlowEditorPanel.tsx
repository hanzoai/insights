import { useReactFlow } from '@xyflow/react'
import clsx from 'clsx'
import { useActions, useValues } from 'kea'

import { IconArrowLeft, IconTrash } from '@hanzo/icons'
import { Badge, Button, Tab, Tabs, Tooltip } from '@hanzo/elements'

import { capitalizeFirstLetter } from 'lib/utils/strings'

import { workflowLogic } from '../../workflowLogic'
import { FN_FLOW_EDITOR_MODES, InsightsFlowEditorMode, hogFlowEditorLogic } from '../hogFlowEditorLogic'
import { useInsightsFlowStep } from '../steps/InsightsFlowSteps'
import { InsightsFlowEditorPanelBuild } from './InsightsFlowEditorPanelBuild'
import { InsightsFlowEditorPanelBuildDetail } from './InsightsFlowEditorPanelBuildDetail'
import { InsightsFlowEditorPanelLogs } from './InsightsFlowEditorPanelLogs'
import { InsightsFlowEditorPanelMetrics } from './InsightsFlowEditorPanelMetrics'
import { InsightsFlowEditorPanelVariables } from './InsightsFlowEditorPanelVariables'
import { EmailActionTestContent } from './testing/InsightsFlowEditorNotificationPanelTest'
import { InsightsFlowEditorPanelTest } from './testing/InsightsFlowEditorPanelTest'

export function InsightsFlowEditorPanel(): JSX.Element | null {
    const { selectedNode, mode, selectedNodeCanBeDeleted, workflow } = useValues(hogFlowEditorLogic)
    const { setMode, setSelectedNodeId } = useActions(hogFlowEditorLogic)
    const { deleteElements } = useReactFlow()

    const variablesCount = workflow?.variables?.length || 0

    const tabs: Tab<InsightsFlowEditorMode>[] = FN_FLOW_EDITOR_MODES.map((mode) => ({
        label: (
            <>
                {capitalizeFirstLetter(mode)}
                {mode === 'variables' && variablesCount > 0 && (
                    <span className="ml-1 text-muted">({variablesCount})</span>
                )}
            </>
        ),
        key: mode,
    }))

    const width = mode !== 'build' ? '37rem' : selectedNode ? '37rem' : '25rem'

    const Step = useInsightsFlowStep(selectedNode?.data)
    const { actionValidationErrorsById } = useValues(workflowLogic)
    const validationResult = actionValidationErrorsById[selectedNode?.id ?? '']

    return (
        <div
            className="absolute flex flex-col m-0 p-2 overflow-hidden transition-[width] max-h-full right-0 justify-end"
            style={{ width }}
        >
            <div
                className="relative flex flex-col rounded-md overflow-hidden bg-surface-primary max-h-full z-10"
                style={{
                    border: '1px solid var(--border)',
                    boxShadow: '0 3px 0 var(--border)',
                }}
            >
                <div className="flex gap-2 border-b items-center">
                    <div
                        className={clsx(
                            'transition-all overflow-hidden flex p-1',
                            !selectedNode ? 'w-2 opacity-0' : 'w-10 opacity-100'
                        )}
                    >
                        <Button
                            size="small"
                            icon={<IconArrowLeft />}
                            onClick={() => setSelectedNodeId(null)}
                            disabled={!selectedNode}
                        />
                    </div>

                    <div className="flex-1">
                        <Tabs
                            activeKey={mode}
                            onChange={(key) => setMode(key)}
                            tabs={tabs}
                            barClassName="-mb-px "
                        />
                    </div>

                    {selectedNode && (
                        <span className="flex gap-1 items-center font-medium rounded-md mr-3 min-w-0">
                            <span className="text-lg">{Step?.icon}</span>
                            <Tooltip title={selectedNode.data.name}>
                                <span className="font-semibold truncate">{selectedNode.data.name}</span>
                            </Tooltip>
                            {validationResult?.valid === false && (
                                <Tooltip title="Some fields need attention">
                                    <div>
                                        <Badge status="warning" size="small" content="!" />
                                    </div>
                                </Tooltip>
                            )}
                            {selectedNode.deletable && (
                                <Button
                                    size="small"
                                    status="danger"
                                    icon={<IconTrash />}
                                    onClick={() => {
                                        void deleteElements({ nodes: [selectedNode] })
                                        setSelectedNodeId(null)
                                    }}
                                    disabledReason={
                                        selectedNodeCanBeDeleted ? undefined : 'Clean up branching steps first'
                                    }
                                />
                            )}
                        </span>
                    )}
                </div>

                {mode === 'build' && (
                    <>{!selectedNode ? <InsightsFlowEditorPanelBuild /> : <InsightsFlowEditorPanelBuildDetail />}</>
                )}
                {mode === 'variables' && <InsightsFlowEditorPanelVariables />}
                {mode === 'test' &&
                    (selectedNode?.data?.type === 'function_email' ? (
                        <EmailActionTestContent />
                    ) : (
                        <InsightsFlowEditorPanelTest />
                    ))}
                {mode === 'metrics' && <InsightsFlowEditorPanelMetrics />}
                {mode === 'logs' && <InsightsFlowEditorPanelLogs />}
            </div>
        </div>
    )
}
