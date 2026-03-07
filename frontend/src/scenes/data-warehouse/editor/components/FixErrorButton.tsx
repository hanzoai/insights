import { useActions, useValues } from 'kea'
import insights from '@hanzo/insights'
import { useMemo } from 'react'

import { IconSparkles, IconWarning } from '@hanzo/icons'
import { Spinner } from '@hanzo/lemon-ui'

import { LemonButton, LemonButtonProps } from 'lib/lemon-ui/LemonButton'

import { dataNodeLogic } from '~/queries/nodes/DataNode/dataNodeLogic'

import { fixSQLErrorsLogic } from '../fixSQLErrorsLogic'
import { sqlEditorLogic } from '../sqlEditorLogic'

interface FixErrorButtonProps {
    type: LemonButtonProps['type']
    size?: LemonButtonProps['size']
    contentOverride?: string
    source: 'action-bar' | 'query-error'
}

export function FixErrorButton({ type, size, contentOverride, source }: FixErrorButtonProps): JSX.Element {
    const { queryInput, fixErrorsError, metadata } = useValues(sqlEditorLogic)
    const { fixErrors: fixInsightsQLErrors } = useActions(sqlEditorLogic)
    const { responseError } = useValues(dataNodeLogic)
    const { responseLoading: fixInsightsQLErrorsLoading } = useValues(fixSQLErrorsLogic)

    const queryError = responseError || metadata?.errors?.map((n) => n.message)?.join('. ') || undefined

    const icon = useMemo(() => {
        if (fixInsightsQLErrorsLoading) {
            return <Spinner />
        }

        if (fixErrorsError) {
            return <IconWarning className="text-warning" />
        }

        return <IconSparkles />
    }, [fixInsightsQLErrorsLoading, fixErrorsError])

    const disabledReason = useMemo(() => {
        if (!queryError) {
            return 'No query error to fix'
        }

        if (fixErrorsError) {
            return fixErrorsError
        }

        return false
    }, [queryError, fixErrorsError])

    const content = useMemo(() => {
        if (fixInsightsQLErrorsLoading) {
            return 'Fixing...'
        }

        if (fixErrorsError) {
            return "Can't fix"
        }

        return contentOverride ?? 'Fix errors with AI'
    }, [fixErrorsError, fixInsightsQLErrorsLoading, contentOverride])

    return (
        <LemonButton
            type={type}
            size={size}
            disabledReason={disabledReason}
            icon={icon}
            onClick={() => {
                fixInsightsQLErrors(queryInput ?? '', queryError)
                insights.capture(`sql-editor-fix-error-click`, { source })
            }}
        >
            {content}
        </LemonButton>
    )
}
