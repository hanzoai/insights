import { useActions } from 'kea'

import { IconPlus } from '@hanzo/icons'

import { Button } from 'lib/elements/Button'
import { modalsLogic } from 'scenes/experiments/modalsLogic'

export function AddPrimaryMetric(): JSX.Element {
    const { openPrimaryMetricSourceModal } = useActions(modalsLogic)

    return (
        <Button
            icon={<IconPlus />}
            type="secondary"
            size="xsmall"
            onClick={() => {
                openPrimaryMetricSourceModal()
            }}
        >
            Add primary metric
        </Button>
    )
}

export function AddSecondaryMetric(): JSX.Element {
    const { openSecondaryMetricSourceModal } = useActions(modalsLogic)

    return (
        <Button
            icon={<IconPlus />}
            type="secondary"
            size="xsmall"
            onClick={() => {
                openSecondaryMetricSourceModal()
            }}
        >
            Add secondary metric
        </Button>
    )
}
