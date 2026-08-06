import { useActions, useValues } from 'kea'
import { useEffect, useState } from 'react'

import { IconChevronDown } from '@hanzo/icons'
import { Button, Dropdown } from '@hanzo/elements'

import type { CustomInputRendererProps } from 'lib/components/CyclotronJob/customInputRenderers'

import { AssigneeDropdown, AssigneeIconDisplay, AssigneeLabelDisplay, assigneeSelectLogic, TicketAssignee } from '.'

export default function CyclotronJobInputAssignee({ value, onChange }: CustomInputRendererProps): JSX.Element {
    const { ensureAssigneeTypesLoaded, setSearch } = useActions(assigneeSelectLogic)
    const { resolveAssignee } = useValues(assigneeSelectLogic)
    const [showPopover, setShowPopover] = useState(false)

    useEffect(() => {
        ensureAssigneeTypesLoaded()
    }, [ensureAssigneeTypesLoaded])

    const handleChange = (newValue: TicketAssignee): void => {
        setSearch('')
        setShowPopover(false)
        onChange(newValue)
    }

    const resolvedAssignee = resolveAssignee(value)

    return (
        <Dropdown
            closeOnClickInside={false}
            visible={showPopover}
            matchWidth={false}
            onVisibilityChange={(visible) => setShowPopover(visible)}
            overlay={<AssigneeDropdown assignee={value} onChange={handleChange} />}
        >
            <Button type="secondary" sideIcon={<IconChevronDown />} fullWidth>
                <span className="flex items-center gap-1">
                    <AssigneeIconDisplay assignee={resolvedAssignee} size="small" />
                    <AssigneeLabelDisplay assignee={resolvedAssignee} size="small" />
                </span>
            </Button>
        </Dropdown>
    )
}
