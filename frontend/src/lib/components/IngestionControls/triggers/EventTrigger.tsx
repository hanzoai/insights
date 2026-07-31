import { useValues } from 'kea'
import { useState } from 'react'

import { IconPlus } from '@hanzo/icons'
import { Button, Snack, Popover } from '@hanzo/elements'

import { AccessControlAction } from 'lib/components/AccessControlAction'
import { TaxonomicFilter } from 'lib/components/TaxonomicFilter/TaxonomicFilter'
import { TaxonomicFilterGroupType } from 'lib/components/TaxonomicFilter/types'
import { isStringWithLength } from 'scenes/settings/environment/replayTriggersLogic'

import { AccessControlLevel } from '~/types'

import { ingestionControlsLogic } from '../ingestionControlsLogic'

export function EventTriggerSelect({
    events,
    onChange,
}: {
    events: string[] | null
    onChange: (eventTriggerConfig: string[]) => void
}): JSX.Element {
    const { resourceType } = useValues(ingestionControlsLogic)

    const [open, setOpen] = useState<boolean>(false)

    return (
        <AccessControlAction resourceType={resourceType} minAccessLevel={AccessControlLevel.Editor}>
            <Popover
                visible={open}
                onClickOutside={() => setOpen(false)}
                overlay={
                    <TaxonomicFilter
                        onChange={(_, value) => {
                            if (isStringWithLength(value)) {
                                onChange(Array.from(new Set(events?.concat([value]))))
                            }
                            setOpen(false)
                        }}
                        excludedProperties={{
                            [TaxonomicFilterGroupType.Events]: [null], // This will hide "All events"
                        }}
                        taxonomicGroupTypes={[TaxonomicFilterGroupType.Events]}
                    />
                }
            >
                <Button
                    size="small"
                    type="secondary"
                    icon={<IconPlus />}
                    sideIcon={null}
                    onClick={() => setOpen(!open)}
                >
                    Add event
                </Button>
            </Popover>
        </AccessControlAction>
    )
}

export function EventTrigger({ trigger, onClose }: { trigger: string; onClose: () => void }): JSX.Element {
    const { resourceType } = useValues(ingestionControlsLogic)

    return (
        <AccessControlAction resourceType={resourceType} minAccessLevel={AccessControlLevel.Editor}>
            {({ disabledReason }) => (
                <Snack onClose={!disabledReason ? () => onClose() : undefined}>{trigger}</Snack>
            )}
        </AccessControlAction>
    )
}
