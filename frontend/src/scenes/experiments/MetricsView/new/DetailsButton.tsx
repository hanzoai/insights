import { IconGraph } from '@hanzo/icons'
import { Button } from '@hanzo/elements'

import { ExperimentMetric } from '~/queries/schema/schema-general'

export function DetailsButton({
    setIsModalOpen,
}: {
    metric: ExperimentMetric
    setIsModalOpen: (isOpen: boolean) => void
}): JSX.Element {
    return (
        <>
            <Button type="secondary" size="xsmall" icon={<IconGraph />} onClick={() => setIsModalOpen(true)}>
                Details
            </Button>
        </>
    )
}
