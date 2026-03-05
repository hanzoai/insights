import '@xyflow/react/dist/style.css'

import {
    Background,
    BackgroundVariant,
    Controls,
    EdgeTypes,
    NodeTypes,
    ReactFlow,
    ReactFlowProvider,
    useReactFlow,
} from '@xyflow/react'
import { BindLogic, useActions, useValues } from 'kea'
import { useEffect, useRef } from 'react'

import { themeLogic } from '~/layout/navigation-3000/themeLogic'

import { workflowLogic } from '../workflowLogic'
import { customFlowEditorLogic } from './customFlowEditorLogic'
import { CustomFlowEditorPanel } from './panel/CustomFlowEditorPanel'
import { REACT_FLOW_EDGE_TYPES } from './react_flow_utils/SmartEdge'
import { REACT_FLOW_NODE_TYPES } from './steps/Nodes'
import { CustomFlowActionEdge, CustomFlowActionNode } from './types'

// Inner component that encapsulates React Flow
function CustomFlowEditorContent(): JSX.Element {
    const { isDarkModeOn } = useValues(themeLogic)

    const { nodes, edges, dropzoneNodes } = useValues(customFlowEditorLogic)
    const {
        onEdgesChange,
        onNodesChange,
        setSelectedNodeId,
        setReactFlowInstance,
        onNodesDelete,
        showDropzones,
        onDragOver,
        onDrop,
        setReactFlowWrapper,
        handlePaneClick,
    } = useActions(customFlowEditorLogic)

    const reactFlowWrapper = useRef<HTMLDivElement>(null)
    const reactFlowInstance = useReactFlow()

    useEffect(() => {
        setReactFlowInstance(reactFlowInstance)
    }, [reactFlowInstance, setReactFlowInstance])

    useEffect(() => {
        setReactFlowWrapper(reactFlowWrapper)
    }, [setReactFlowWrapper])

    return (
        <div ref={reactFlowWrapper} className="flex flex-col grow w-full" data-attr="workflow-editor">
            <ReactFlow<CustomFlowActionNode, CustomFlowActionEdge>
                className="grow"
                fitView
                nodes={[...nodes, ...(dropzoneNodes as unknown as CustomFlowActionNode[])]}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodesDelete={onNodesDelete}
                onDragStart={showDropzones}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onNodeClick={(_, node) => node.selectable && setSelectedNodeId(node.id)}
                nodeTypes={REACT_FLOW_NODE_TYPES as NodeTypes}
                edgeTypes={REACT_FLOW_EDGE_TYPES as EdgeTypes}
                nodesDraggable={false}
                colorMode={isDarkModeOn ? 'dark' : 'light'}
                onPaneClick={handlePaneClick}
            >
                <Background gap={36} variant={BackgroundVariant.Dots} />

                <Controls showInteractive={false} />

                <CustomFlowEditorPanel />
            </ReactFlow>
        </div>
    )
}

export function CustomFlowEditor(): JSX.Element {
    const { logicProps } = useValues(workflowLogic)
    return (
        <ReactFlowProvider>
            <BindLogic logic={customFlowEditorLogic} props={logicProps}>
                <CustomFlowEditorContent />
            </BindLogic>
        </ReactFlowProvider>
    )
}
