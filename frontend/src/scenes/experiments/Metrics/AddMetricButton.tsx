import { useActions } from 'kea'

import { IconPlus } from '@hanzo/icons'

import { Button } from 'lib/elements/Button'

import type { MetricContext } from './experimentMetricModalLogic'
import { metricSourceModalLogic } from './metricSourceModalLogic'

export const AddMetricButton = ({ metricContext }: { metricContext: MetricContext }): JSX.Element => {
    const { openMetricSourceModal } = useActions(metricSourceModalLogic)

    return (
        <Button
            icon={<IconPlus />}
            type="secondary"
            size="xsmall"
            onClick={() => {
                openMetricSourceModal(metricContext)
            }}
        >
            Add {metricContext.type} metric
        </Button>
    )
}
