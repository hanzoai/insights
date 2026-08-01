import { useActions, useValues } from 'kea'

import { TaxonomicFilterGroupType } from 'lib/components/TaxonomicFilter/types'
import { TaxonomicPopover } from 'lib/components/TaxonomicPopover/TaxonomicPopover'
import { pathsDataLogic } from 'scenes/paths/pathsDataLogic'

import { taxonomicEventFilterToInsightsQL } from '~/queries/utils'
import { EditorFilterProps } from '~/types'

export function PathsInsightsQL({ insightProps }: EditorFilterProps): JSX.Element {
    const { pathsFilter } = useValues(pathsDataLogic(insightProps))
    const { updateInsightFilter } = useActions(pathsDataLogic(insightProps))

    return (
        <TaxonomicPopover
            groupType={TaxonomicFilterGroupType.InsightsQLExpression}
            value={pathsFilter?.pathsInsightsQLExpression || 'event'}
            data-attr="paths-insightsql-expression"
            fullWidth
            onChange={(v, g) => {
                const hogQl = taxonomicEventFilterToInsightsQL(g, v)
                if (hogQl) {
                    updateInsightFilter({ pathsInsightsQLExpression: hogQl })
                }
            }}
            groupTypes={[TaxonomicFilterGroupType.InsightsQLExpression]}
        />
    )
}
