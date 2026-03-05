import { useMemo, useState } from 'react'

import { LemonButton } from '@posthog/lemon-ui'

import { CyclotronJobFiltersType, InsightsFunctionSubTemplateIdType, InsightsFunctionTypeType } from '~/types'

import { INSIGHTS_FUNCTION_SUB_TEMPLATE_COMMON_PROPERTIES } from '../sub-templates/sub-templates'
import { InsightsFunctionTemplateList } from './InsightsFunctionTemplateList'
import { InsightsFunctionList } from './InsightsFunctionsList'

export type LinkedInsightsFunctionsProps = {
    type: InsightsFunctionTypeType
    forceFilterGroups?: CyclotronJobFiltersType[]
    subTemplateIds?: InsightsFunctionSubTemplateIdType[]
    newDisabledReason?: string
    hideFeedback?: boolean
    emptyText?: string
    queryParams?: Record<string, string>
}

const getFiltersFromSubTemplateId = (
    subTemplateId: InsightsFunctionSubTemplateIdType
): CyclotronJobFiltersType | undefined => {
    const commonProperties = INSIGHTS_FUNCTION_SUB_TEMPLATE_COMMON_PROPERTIES[subTemplateId]
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
        subTemplateId?: InsightsFunctionSubTemplateIdType
    ): CyclotronJobFiltersType | undefined => {
        if (forceFilterGroups && forceFilterGroups.length > 0) {
            return forceFilterGroups[0]
        }
        if (subTemplateId) {
            return getFiltersFromSubTemplateId(subTemplateId)
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
                    <LemonButton type="secondary" size="small" onClick={() => setShowNewDestination(false)}>
                        Cancel
                    </LemonButton>
                </>
            }
        />
    ) : (
        <InsightsFunctionList
            key={logicKey}
            forceFilterGroups={insightsFunctionFilterList}
            type={type}
            hideFeedback={hideFeedback}
            emptyText={emptyText}
            extraControls={
                <>
                    <LemonButton
                        type="primary"
                        size="small"
                        disabledReason={newDisabledReason}
                        onClick={() => setShowNewDestination(true)}
                    >
                        New notification
                    </LemonButton>
                </>
            }
        />
    )
}
