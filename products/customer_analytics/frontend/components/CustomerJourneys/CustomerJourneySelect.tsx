import { useActions, useValues } from 'kea'

import { Select, SelectProps } from '@hanzo/elements'

import { customerJourneysLogic } from './customerJourneysLogic'

type CustomerJourneySelectProps = Pick<SelectProps<string>, 'type'>

export function CustomerJourneySelect({ type = 'tertiary' }: CustomerJourneySelectProps): JSX.Element | null {
    const { activeJourneyId, journeyOptions } = useValues(customerJourneysLogic)
    const { setActiveJourneyId } = useActions(customerJourneysLogic)

    if (journeyOptions.length === 0) {
        return null
    }

    return (
        <Select
            className="border-0"
            value={activeJourneyId}
            onChange={setActiveJourneyId}
            options={journeyOptions}
            size="small"
            type={type}
            truncateText={{ maxWidthClass: 'max-w-60' }}
        />
    )
}
