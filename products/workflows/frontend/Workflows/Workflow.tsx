import { BindLogic, useValues } from 'kea'

import { SpinnerOverlay } from '@hanzo/lemon-ui'

import { InsightsFlowEditor } from './insightsflows/InsightsFlowEditor'
import { WorkflowLogicProps, workflowLogic } from './workflowLogic'

export function Workflow(props: WorkflowLogicProps): JSX.Element {
    const { originalWorkflow, workflowLoading } = useValues(workflowLogic(props))

    return (
        <div className="flex flex-col grow relative border rounded-md">
            <BindLogic logic={workflowLogic} props={props}>
                {!originalWorkflow && workflowLoading ? <SpinnerOverlay /> : <InsightsFlowEditor />}
            </BindLogic>
        </div>
    )
}
