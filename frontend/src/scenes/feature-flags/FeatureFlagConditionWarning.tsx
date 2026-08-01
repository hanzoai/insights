import { useValues } from 'kea'

import { IconInfo } from '@hanzo/icons'

import { Link } from 'lib/elements/Link'

import { AnyPropertyFilter, FeatureFlagEvaluationRuntime } from '~/types'

import { featureFlagConditionWarningLogic } from './featureFlagConditionWarningLogic'

export interface FeatureFlagConditionWarningProps {
    evaluationRuntime?: FeatureFlagEvaluationRuntime
    properties: AnyPropertyFilter[]
    className?: string
}

export function FeatureFlagConditionWarning({
    properties,
    className,
    evaluationRuntime = FeatureFlagEvaluationRuntime.ALL,
}: FeatureFlagConditionWarningProps): JSX.Element | null {
    const { warning } = useValues(featureFlagConditionWarningLogic({ properties, evaluationRuntime }))

    if (!warning) {
        return null
    }

    return (
        <div
            className={`flex items-center gap-2 text-xs p-2 rounded border border-warning-dark bg-warning-highlight${className ? ` ${className}` : ''}`}
        >
            <IconInfo className="text-base shrink-0 text-warning-dark" />
            <span>
                Local evaluation unavailable ({warning}).{' '}
                <Link to="https://hanzo.ai/docs/feature-flags/local-evaluation#restriction-on-local-evaluation">
                    Learn more
                </Link>
            </span>
        </div>
    )
}
