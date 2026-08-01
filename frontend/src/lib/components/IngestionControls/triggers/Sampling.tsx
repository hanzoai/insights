import { useState } from 'react'

import { Button, Input, toast } from '@hanzo/elements'

import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { TeamMembershipLevel } from 'lib/constants'

export function SamplingTrigger({
    initialSampleRate,
    onChange,
}: {
    initialSampleRate: number
    onChange: (value: number) => void
}): JSX.Element {
    const [value, setValue] = useState<number | undefined>(initialSampleRate)
    const restrictedReason = useRestrictedArea({
        scope: RestrictionScope.Project,
        minimumAccessLevel: TeamMembershipLevel.Admin,
    })

    const updateSampling = (): void => {
        const returnRate = typeof value == 'number' ? value / 100 : 0
        if (returnRate > 1) {
            toast.error('Session recording sample rate must be between 0 to 100')
        } else {
            onChange(returnRate)
        }
    }

    return (
        <div className="flex flex-row gap-x-2">
            <Input
                type="number"
                className="[&>input::-webkit-inner-spin-button]:appearance-none"
                onChange={(value) => setValue(value)}
                min={0}
                max={100}
                suffix={<>%</>}
                value={value}
                onPressEnter={updateSampling}
                data-attr="sampling-setting-input"
                disabledReason={restrictedReason}
            />
            <Button
                type="primary"
                disabledReason={
                    initialSampleRate === value ? 'Update the sample rate to save changes' : restrictedReason
                }
                onClick={updateSampling}
                data-attr="sampling-setting-update"
            >
                Update
            </Button>
        </div>
    )
}
