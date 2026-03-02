import { useReactFlow } from '@xyflow/react'
import clsx from 'clsx'
import { useActions, useValues } from 'kea'

import { IconArrowLeft, IconTrash } from '@posthog/icons'
import { LemonBadge, LemonButton, LemonTab, LemonTabs, Tooltip } from '@posthog/lemon-ui'

import { capitalizeFirstLetter } from 'lib/utils'

import { workflowLogic } from '../../workflowLogic'
import { CUSTOM_FLOW_EDITOR_MODES, CustomFlowEditorMode, customFlowEditorLogic } from '../customFlowEditorLogic'
import { useCustomFlowStep } from '../steps/CustomFlowSteps'
import { CustomFlowEditorPanelBuild } from './CustomFlowEditorPanelBuild'
import { CustomFlowEditorPanelBuildDetail } from './CustomFlowEditorPanelBuildDetail'
import { CustomFlowEditorPanelLogs } from './CustomFlowEditorPanelLogs'
import { CustomFlowEditorPanelMetrics } from './CustomFlowEditorPanelMetrics'
import { CustomFlowEditorPanelVariables } from './CustomFlowEditorPanelVariables'
import { EmailActionTestContent } from './testing/CustomFlowEditorNotificationPanelTest'
import { CustomFlowEditorPanelTest } from './testing/CustomFlowEditorPanelTest'

export function CustomFlowEditorPanel(): JSX.Element | null {
    const { selectedNode, mode, selectedNodeCanBeDeleted, workflow } = useValues(customFlowEditorLogic)
    const { setMode, setSelectedNodeId } = useActions(customFlowEditorLogic)
    const { deleteElements } = useReactFlow()

    const variablesCount = workflow?.variables?.length || 0

    const tabs: LemonTab<CustomFlowEditorMode>[] = CUSTOM_FLOW_EDITOR_MODES.map((mode) => ({
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

    const Step = useCustomFlowStep(selectedNode?.data)
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
                        <LemonButton
                            size="small"
                            icon={<IconArrowLeft />}
                            onClick={() => setSelectedNodeId(null)}
                            disabled={!selectedNode}
                        />
                    </div>

                    <div className="flex-1">
                        <LemonTabs
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
                                        <LemonBadge status="warning" size="small" content="!" />
                                    </div>
                                </Tooltip>
                            )}
                            {selectedNode.deletable && (
                                <LemonButton
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
                    <>{!selectedNode ? <CustomFlowEditorPanelBuild /> : <CustomFlowEditorPanelBuildDetail />}</>
                )}
                {mode === 'variables' && <CustomFlowEditorPanelVariables />}
                {mode === 'test' &&
                    (selectedNode?.data?.type === 'function_email' ? (
                        <EmailActionTestContent />
                    ) : (
                        <CustomFlowEditorPanelTest />
                    ))}
                {mode === 'metrics' && <CustomFlowEditorPanelMetrics />}
                {mode === 'logs' && <CustomFlowEditorPanelLogs />}
            </div>
        </div>
    )
}
