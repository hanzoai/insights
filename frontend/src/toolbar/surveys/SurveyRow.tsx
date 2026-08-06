import { useActions, useValues } from 'kea'

import { IconPencil } from '@hanzo/icons'
import { Badge } from '@hanzo/elements'

import { IconOpenInNew } from 'lib/elements/icons'
import { Button } from 'lib/elements/Button'
import { Link } from 'lib/elements/Link'

import { toolbarConfigLogic } from '~/toolbar/toolbarConfigLogic'
import { urls } from '~/toolbar/urls'
import { joinWithUiHost } from '~/toolbar/utils'
import { Survey } from '~/types'

import { STATUS_COLORS, SURVEY_TYPE_LABELS } from './constants'
import { getSurveyStatus, isQuickEditable, surveysToolbarLogic } from './surveysToolbarLogic'

export function SurveyRow({ survey }: { survey: Survey }): JSX.Element {
    const { uiHost } = useValues(toolbarConfigLogic)
    const { startQuickEdit } = useActions(surveysToolbarLogic)
    const status = getSurveyStatus(survey)
    const typeLabel = SURVEY_TYPE_LABELS[survey.type] ?? survey.type
    const canEdit = isQuickEditable(survey)

    return (
        <div className="flex items-center gap-2 py-1.5 px-1 -mx-1 rounded hover:bg-fill-primary-hover">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <Link
                        className="font-medium truncate"
                        to={joinWithUiHost(uiHost, urls.survey(survey.id))}
                        subtle
                        target="_blank"
                    >
                        {survey.name}
                        <IconOpenInNew className="ml-0.5" />
                    </Link>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs text-muted">{typeLabel}</span>
                    <span className="text-xs text-muted">·</span>
                    <Badge size="small" status={STATUS_COLORS[status] ?? 'muted'} content={status} />
                    {survey.questions.length > 0 && (
                        <>
                            <span className="text-xs text-muted">·</span>
                            <span className="text-xs text-muted">
                                {survey.questions.length} {survey.questions.length === 1 ? 'question' : 'questions'}
                            </span>
                        </>
                    )}
                </div>
            </div>
            {canEdit && (
                <Button
                    size="xsmall"
                    type="secondary"
                    icon={<IconPencil />}
                    onClick={() => startQuickEdit(survey)}
                    tooltip="Edit in toolbar"
                    className="shrink-0"
                />
            )}
        </div>
    )
}
