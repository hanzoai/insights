import { useValues } from 'kea'

import { Tag } from '@hanzo/elements'

import { TZLabel } from 'lib/components/TZLabel'

import { NODE_TYPE_TAG_SETTINGS } from './nodeDetailConstants'
import { nodeDetailSceneLogic } from './nodeDetailSceneLogic'

export function NodeDetailDetails({ id }: { id: string }): JSX.Element | null {
    const { node, effectiveLastRunAt } = useValues(nodeDetailSceneLogic({ id }))

    if (!node) {
        return null
    }

    const tagSettings = NODE_TYPE_TAG_SETTINGS[node.type]

    return (
        <div className="bg-bg-light border rounded p-4 space-y-2">
            <div className="flex items-center gap-2">
                <span className="text-muted text-sm">Type:</span>
                <Tag type={tagSettings.type}>{tagSettings.label}</Tag>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-muted text-sm">Created:</span>
                {node.created_at ? <TZLabel time={node.created_at} /> : <span className="text-muted">-</span>}
            </div>
            <div className="flex items-center gap-2">
                <span className="text-muted text-sm">Last refreshed:</span>
                {effectiveLastRunAt ? <TZLabel time={effectiveLastRunAt} /> : <span className="text-muted">Never</span>}
            </div>
            {node.dag && (
                <div className="flex items-center gap-2">
                    <span className="text-muted text-sm">DAG:</span>
                    <span className="text-muted">{node.dag_name ?? node.dag}</span>
                </div>
            )}
        </div>
    )
}
