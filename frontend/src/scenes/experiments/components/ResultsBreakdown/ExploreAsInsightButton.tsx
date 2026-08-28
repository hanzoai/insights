import { Button } from 'lib/elements/Button'
import { IconAreaChart } from 'lib/elements/icons'
import { urls } from 'scenes/urls'

import type { ResultBreakdownRenderProps } from './types'

/**
 * make the props non-nullable
 */
type SafeResultBreakdownRenderProps = {
    [K in keyof Pick<ResultBreakdownRenderProps, 'query'>]: NonNullable<ResultBreakdownRenderProps[K]>
}

export function ExploreAsInsightButton({ query }: SafeResultBreakdownRenderProps): JSX.Element {
    return (
        <Button
            className="ml-auto -translate-y-2"
            size="xsmall"
            type="primary"
            icon={<IconAreaChart />}
            to={urls.insightNew({ query })}
            targetBlank
        >
            Explore as Insight
        </Button>
    )
}
