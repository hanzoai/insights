import { useMemo, useState } from 'react'

import { Button } from '@hanzo/elements'

import { CyclotronJobFiltersType, InsightsFunctionSubTemplateIdType, InsightsFunctionTypeType } from '~/types'

import { FN_FUNCTION_SUB_TEMPLATE_COMMON_PROPERTIES } from '../sub-templates/sub-templates'
import { InsightsFunctionList } from './InsightsFunctionsList'
import { InsightsFunctionTemplateList } from './InsightsFunctionTemplateList'

export type LinkedInsightsFunctionsProps = {
    type: InsightsFunctionTypeType
    forceFilterGroups?: CyclotronJobFiltersType[]
    subTemplateIds?: InsightsFunctionSubTemplateIdType[]
    newDisabledReason?: string
    hideFeedback?: boolean
    emptyText?: string
    queryParams?: Record<string, string>
}

export const getFiltersFromSubTemplateId = (
    subTemplateId: InsightsFunctionSubTemplateIdType
): CyclotronJobFiltersType | undefined => {
    const commonProperties = FN_FUNCTION_SUB_TEMPLATE_COMMON_PROPERTIES[subTemplateId]
    return commonProperties.filters ?? undefined
}

export function LinkedInsightsFunctions({
    type,
    forceFilterGroups,
    subTemplateIds,
    newDisabledReason,
    hideFeedback,
    emptyText,
    queryParams,
}: LinkedInsightsFunctionsProps): JSX.Element | null {
    const [showNewDestination, setShowNewDestination] = useState(false)
    const logicKey = useMemo(() => {
        return JSON.stringify({ type, subTemplateIds, forceFilterGroups })
    }, [type, subTemplateIds, forceFilterGroups])

    // TRICKY: All templates are destinations - internal destinations are just a different source
    // and set by the subtemplate modifier
    const templateType = type === 'internal_destination' ? 'destination' : type

    const getConfigurationOverrides = (
        subTemplateId: InsightsFunctionSubTemplateIdType | undefined
    ): { filters: CyclotronJobFiltersType } | undefined => {
        if (forceFilterGroups && forceFilterGroups.length > 0) {
            return { filters: forceFilterGroups[0] }
        }
        if (subTemplateId) {
            const filters = getFiltersFromSubTemplateId(subTemplateId)
            return filters ? { filters } : undefined
        }
        return undefined
    }

    const insightsFunctionFilterList =
        forceFilterGroups ??
        (subTemplateIds?.map(getFiltersFromSubTemplateId).filter((filters) => !!filters) as
            | CyclotronJobFiltersType[]
            | undefined)

    return showNewDestination ? (
        <InsightsFunctionTemplateList
            type={templateType}
            subTemplateIds={subTemplateIds}
            getConfigurationOverrides={getConfigurationOverrides}
            queryParams={queryParams}
            extraControls={
                <>
                    <Button type="secondary" size="small" onClick={() => setShowNewDestination(false)}>
                        Cancel
                    </Button>
                </>
            }
        />
    ) : (
        <InsightsFunctionList
            key={logicKey}
            forceFilterGroups={insightsFunctionFilterList}
            type={type}
            returnTo={queryParams?.returnTo}
            hideFeedback={hideFeedback}
            emptyText={emptyText}
            extraControls={
                <>
                    <Button
                        type="primary"
                        size="small"
                        disabledReason={newDisabledReason}
                        onClick={() => setShowNewDestination(true)}
                    >
                        New notification
                    </Button>
                </>
            }
        />
    )
}
