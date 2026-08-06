import { IconFilter } from '@hanzo/icons'
import { Menu } from '@hanzo/elements'

import { Button } from 'lib/elements/Button'
import { capitalizeFirstLetter } from 'lib/utils/strings'
import { ALL_LOG_LEVELS } from 'scenes/insights-functions/logs/logsViewerLogic'

import { LogEntryLevel } from '~/types'

const humanReadableLevel = (level: LogEntryLevel): string => {
    return capitalizeFirstLetter(level.toLowerCase())
}

export function LogLevelsPicker({
    value,
    onChange,
}: {
    value: LogEntryLevel[]
    onChange: (levels: LogEntryLevel[]) => void
}): JSX.Element {
    const onClick = (level: LogEntryLevel): void => {
        const levels = [...value]

        const index = levels.indexOf(level)

        if (index > -1) {
            levels.splice(index, 1)
        } else {
            levels.push(level)
        }

        onChange(levels)
    }

    const displayLevels =
        value.length !== ALL_LOG_LEVELS.length && value.length > 0
            ? value.map((l) => humanReadableLevel(l)).join(', ')
            : 'All levels'

    return (
        <Menu
            closeOnClickInside={false}
            items={ALL_LOG_LEVELS.map((level) => ({
                label: humanReadableLevel(level),
                onClick: () => onClick(level),
                active: value.includes(level),
            }))}
        >
            <Button icon={<IconFilter />} size="small" type="secondary" className="whitespace-nowrap">
                {displayLevels}
            </Button>
        </Menu>
    )
}
