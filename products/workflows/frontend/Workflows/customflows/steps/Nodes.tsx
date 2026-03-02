import { Handle, useUpdateNodeInternals } from '@xyflow/react'
import clsx from 'clsx'
import { useActions, useValues } from 'kea'
import { useEffect, useState } from 'react'

import { IconCopy, IconDrag, IconPlus } from '@posthog/icons'

import { customFlowEditorLogic } from '../customFlowEditorLogic'
import { NODE_HEIGHT, NODE_WIDTH } from '../react_flow_utils/constants'
import type { CustomFlowActionNode } from '../types'
import { StepView } from './components/StepView'
import { CustomFlowStepNodeProps } from './types'

export type ReactFlowNodeType = 'action' | 'dropzone'

export const REACT_FLOW_NODE_TYPES: Record<ReactFlowNodeType, React.ComponentType<CustomFlowStepNodeProps>> = {
    dropzone: DropzoneNode,
    action: CustomFlowActionNode,
}

function DropzoneNode({ id }: CustomFlowStepNodeProps): JSX.Element {
    const [isHighlighted, setIsHighlighted] = useState(false)
    const { isCopyingNode, isMovingNode } = useValues(customFlowEditorLogic)
    const { setHighlightedDropzoneNodeId, copyNodeToHighlightedDropzone, moveNodeToHighlightedDropzone } =
        useActions(customFlowEditorLogic)

    useEffect(() => {
        setHighlightedDropzoneNodeId(isHighlighted ? id : null)
    }, [id, isHighlighted, setHighlightedDropzoneNodeId])

    const handleClick = (): void => {
        if (isCopyingNode) {
            copyNodeToHighlightedDropzone()
        } else if (isMovingNode) {
            moveNodeToHighlightedDropzone()
        }
    }

    return (
        <div
            onDragOver={() => setIsHighlighted(true)}
            onDragLeave={() => setIsHighlighted(false)}
            onMouseOver={() => setIsHighlighted(true)}
            onMouseOut={() => setIsHighlighted(false)}
            onClick={isCopyingNode || isMovingNode ? handleClick : undefined}
            className={clsx(
                'flex justify-center items-center p-2 rounded border border-dashed transition-all cursor-pointer hover:border-primary hover:bg-surface-primary',
                isHighlighted ? 'border-primary bg-surface-primary' : 'border-transparent'
            )}
            // eslint-disable-next-line react/forbid-dom-props
            style={{
                width: NODE_WIDTH,
                height: NODE_HEIGHT,
            }}
        >
            <div className="flex flex-col justify-center items-center w-4 h-4 rounded-full border bg-surface-primary">
                {isCopyingNode ? (
                    <IconCopy className="text-sm text-primary" />
                ) : isMovingNode ? (
                    <IconDrag className="text-sm text-primary" />
                ) : (
                    <IconPlus className="text-sm text-primary" />
                )}
            </div>
        </div>
    )
}

function CustomFlowActionNode(props: CustomFlowStepNodeProps): JSX.Element | null {
    const updateNodeInternals = useUpdateNodeInternals()

    const { nodesById, isCopyingNode, isMovingNode, nodeToBeAdded, movingNodeId } = useValues(customFlowEditorLogic)

    useEffect(() => {
        updateNodeInternals(props.id)
    }, [props.id, updateNodeInternals])

    const node = nodesById[props.id]

    const shouldWiggleCopyingNode =
        isCopyingNode && nodeToBeAdded && 'id' in nodeToBeAdded && (nodeToBeAdded as CustomFlowActionNode).id === props.id
    const shouldWiggleMovingNode = isMovingNode && movingNodeId === props.id

    return (
        <div
            className={clsx(
                'transition-all hover:translate-y-[-2px]',
                (shouldWiggleCopyingNode || shouldWiggleMovingNode) && 'animate-bounce'
            )}
        >
            {node?.handles?.map((handle) => (
                // isConnectable={false} prevents edges from being manually added
                <Handle key={handle.id} className="opacity-0" {...handle} isConnectable={false} />
            ))}
            <StepView action={props.data} />
        </div>
    )
}
