import { useActions, useValues } from 'kea'

import { Button, ButtonWithDropdown } from 'lib/elements/Button'
import { Checkbox } from 'lib/elements/Checkbox'
import { capitalizeFirstLetter } from 'lib/utils/strings'
import { pathsDataLogic } from 'scenes/paths/pathsDataLogic'

import { PathsFilter } from '~/queries/schema/schema-general'
import { EditorFilterProps, PathType } from '~/types'

import { humanizePathsEventTypes } from '../utils'

export function PathsEventsTypes({ insightProps }: EditorFilterProps): JSX.Element {
    const { pathsFilter } = useValues(pathsDataLogic(insightProps))
    const { updateInsightFilter } = useActions(pathsDataLogic(insightProps))

    const includeEventTypes = pathsFilter?.includeEventTypes
    const setIncludeEventTypes = (includeEventTypes: PathsFilter['includeEventTypes']): void => {
        updateInsightFilter({ includeEventTypes: includeEventTypes })
    }

    const options = [
        {
            type: PathType.PageView,
            label: 'Page views',
            selected: includeEventTypes?.includes(PathType.PageView),
        },
        {
            type: PathType.Screen,
            label: 'Screen views',
            selected: includeEventTypes?.includes(PathType.Screen),
        },
        {
            type: PathType.CustomEvent,
            label: 'Custom event',
            selected: includeEventTypes?.includes(PathType.CustomEvent),
        },
        {
            type: PathType.InsightsQL,
            label: 'SQL expression',
            selected: includeEventTypes?.includes(PathType.InsightsQL),
        },
    ]

    const onClickPathtype = (pathType: PathType): void => {
        if (includeEventTypes) {
            if (includeEventTypes.includes(pathType)) {
                setIncludeEventTypes(includeEventTypes.filter((types) => types !== pathType))
            } else {
                setIncludeEventTypes(includeEventTypes ? [...includeEventTypes, pathType] : [pathType])
            }
        } else {
            setIncludeEventTypes([pathType])
        }
    }

    const summary = capitalizeFirstLetter(humanizePathsEventTypes(includeEventTypes).join(' & '))

    return (
        <ButtonWithDropdown
            fullWidth
            type="secondary"
            dropdown={{
                matchWidth: true,
                closeOnClickInside: false,
                overlay: options.map((option) => (
                    <Button
                        key={option.type}
                        data-attr={`path-type-${option.type}`}
                        onClick={() => onClickPathtype(option.type)}
                        disabledReason={
                            option.selected && includeEventTypes?.length === 1
                                ? 'At least one event type must be selected'
                                : undefined
                        }
                        fullWidth
                    >
                        <span className="pointer-events-none mr-2">
                            <Checkbox checked={option.selected} />
                        </span>
                        {option.label}
                    </Button>
                )),
                actionable: true,
            }}
        >
            {summary}
        </ButtonWithDropdown>
    )
}
