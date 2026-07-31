import { useValues } from 'kea'

import { Banner } from 'lib/elements/Banner'
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
        <Banner type="warning" className={className}>
            This flag cannot be locally evaluated by server-side SDKs due to unsupported features: {warning}. The flag
            will still evaluate correctly when not using local evaluation.{' '}
            <Link to="https://hanzo.ai/docs/feature-flags/local-evaluation#restriction-on-local-evaluation">
                Learn more
            </Link>
        </Banner>
    )
}
