import { useActions, useValues } from 'kea'

import { InputSelect } from 'lib/elements/InputSelect/InputSelect'
import { pathsDataLogic } from 'scenes/paths/pathsDataLogic'

import { EditorFilterProps } from '~/types'

export function PathsWildcardGroups({ insightProps }: EditorFilterProps): JSX.Element {
    const { pathsFilter } = useValues(pathsDataLogic(insightProps))
    const { updateInsightFilter } = useActions(pathsDataLogic(insightProps))

    return (
        <InputSelect
            onChange={(pathGroupings: string[]) => updateInsightFilter({ pathGroupings })}
            value={pathsFilter?.pathGroupings || []}
            disableFiltering
            mode="multiple"
            allowCustomValues
        />
    )
}
