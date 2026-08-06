import { useActions, useValues } from 'kea'

import { IconChevronDown } from '@hanzo/icons'
import { Button, Checkbox, Divider, Dropdown } from '@hanzo/elements'

import { IconTuning } from 'lib/elements/icons'

import { isTicketColumnMandatory, offerableTicketColumns, ticketColumnLabel } from './ticketColumns'
import { ticketColumnsLogic } from './ticketColumnsLogic'

interface TicketColumnsDropdownProps {
    aiEnabled: boolean
    embedded?: boolean
}

export function TicketColumnsDropdown({ aiEnabled, embedded = false }: TicketColumnsDropdownProps): JSX.Element {
    const { visibleColumns } = useValues(ticketColumnsLogic)
    const { toggleColumn, setVisibleColumns } = useActions(ticketColumnsLogic)

    const offerable = offerableTicketColumns({ aiEnabled, embedded })
    const shownCount = offerable.filter((key) => visibleColumns.includes(key) || isTicketColumnMandatory(key)).length
    const allShown = shownCount === offerable.length

    return (
        <Dropdown
            closeOnClickInside={false}
            overlay={
                <div className="space-y-px p-1 min-w-48">
                    {offerable.map((key) => {
                        const mandatory = isTicketColumnMandatory(key)
                        return (
                            <Button
                                key={key}
                                type="tertiary"
                                size="small"
                                fullWidth
                                icon={
                                    <Checkbox
                                        checked={mandatory || visibleColumns.includes(key)}
                                        className="pointer-events-none"
                                    />
                                }
                                disabledReason={mandatory ? 'This column identifies the ticket' : undefined}
                                onClick={() => toggleColumn(key)}
                            >
                                {ticketColumnLabel(key)}
                            </Button>
                        )
                    })}
                    <Divider className="my-1" />
                    <Button
                        type="tertiary"
                        size="small"
                        fullWidth
                        disabledReason={allShown ? 'Every column is already shown' : undefined}
                        onClick={() => setVisibleColumns(offerable)}
                    >
                        Show all columns
                    </Button>
                </div>
            }
        >
            <Button
                type="secondary"
                size="small"
                icon={<IconTuning />}
                sideIcon={<IconChevronDown />}
                data-attr="support-tickets-column-selector"
            >
                {allShown ? 'All columns' : `${shownCount} of ${offerable.length} columns`}
            </Button>
        </Dropdown>
    )
}
