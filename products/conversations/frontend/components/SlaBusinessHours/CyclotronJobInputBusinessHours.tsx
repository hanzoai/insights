import { useValues } from 'kea'

import { Divider, InputSelect, Label, Select } from '@hanzo/elements'

import type { CustomInputRendererProps } from 'lib/components/CyclotronJob/customInputRenderers'
import { timeZoneLabel } from 'lib/utils/timezones'
import { preflightLogic } from 'scenes/PreflightCheck/preflightLogic'
import { teamLogic } from 'scenes/teamLogic'

import { WeekdayType } from '~/types'

import {
    TIME_RANGE_OPTIONS,
    WEEKDAY_OPTIONS,
} from 'products/workflows/frontend/Workflows/insightsflows/steps/timeWindowConstants'

type TimeConfig = 'any' | [string, string]

type BusinessHoursValue = {
    days: WeekdayType[]
    time: TimeConfig
    timezone: string
}

const ALL_DAYS: WeekdayType[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DEFAULT_TIME_RANGE: [string, string] = ['09:00', '17:00']

const TIME_OPTIONS = [
    { value: 'any', label: 'Any time' },
    { value: 'custom', label: 'Specific time range' },
]

const isCustomTime = (time: TimeConfig): time is [string, string] => Array.isArray(time)

export default function CyclotronJobInputBusinessHours({ value, onChange }: CustomInputRendererProps): JSX.Element {
    const { preflight } = useValues(preflightLogic)
    const { currentTeam } = useValues(teamLogic)

    const config: BusinessHoursValue = {
        days: Array.isArray(value?.days) ? (value.days as WeekdayType[]) : ALL_DAYS,
        time: Array.isArray(value?.time)
            ? ([value.time[0], value.time[1]] as [string, string])
            : (value?.time ?? 'any'),
        timezone: typeof value?.timezone === 'string' ? value.timezone : currentTeam?.timezone || 'UTC',
    }

    const timezoneOptions = Object.entries(preflight?.available_timezones || {}).map(([tz, offset]) => ({
        key: tz,
        label: timeZoneLabel(tz, offset),
    }))

    const isCustomTimeRange = isCustomTime(config.time)

    const update = (patch: Partial<BusinessHoursValue>): void => {
        onChange({ ...config, ...patch })
    }

    return (
        <div className="flex flex-col gap-3 border rounded p-3">
            <div className="flex flex-wrap">
                <div className="flex-1 flex flex-col gap-2">
                    <Label>Working days</Label>
                    <InputSelect
                        value={config.days}
                        onChange={(newDays) => update({ days: newDays as WeekdayType[] })}
                        options={WEEKDAY_OPTIONS}
                        mode="multiple"
                        data-attr="sla-business-hours-days"
                    />
                </div>

                <Divider vertical />

                <div className="flex-1 flex flex-col gap-2">
                    <Label>Time of day</Label>
                    <Select
                        value={isCustomTimeRange ? 'custom' : (config.time as string)}
                        onChange={(v) => update({ time: v === 'custom' ? DEFAULT_TIME_RANGE : 'any' })}
                        options={TIME_OPTIONS}
                        data-attr="sla-business-hours-time-mode"
                    />
                    {isCustomTimeRange && Array.isArray(config.time) && (
                        <div className="flex flex-col gap-2">
                            <div>
                                <Label>Start time</Label>
                                <Select
                                    value={config.time[0]}
                                    onChange={(v) =>
                                        update({
                                            time: [v as string, (config.time as [string, string])[1]],
                                        })
                                    }
                                    options={TIME_RANGE_OPTIONS}
                                    data-attr="sla-business-hours-start-time"
                                />
                            </div>
                            <div>
                                <Label>End time</Label>
                                <Select
                                    value={config.time[1]}
                                    onChange={(v) =>
                                        update({
                                            time: [(config.time as [string, string])[0], v as string],
                                        })
                                    }
                                    options={TIME_RANGE_OPTIONS}
                                    data-attr="sla-business-hours-end-time"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div>
                <Label>Timezone</Label>
                <InputSelect
                    mode="single"
                    placeholder="Select a time zone"
                    value={[config.timezone]}
                    popoverClassName="z-[1000]"
                    onChange={(tz) => update({ timezone: tz[0] })}
                    options={timezoneOptions}
                    data-attr="sla-business-hours-timezone"
                />
            </div>
        </div>
    )
}
