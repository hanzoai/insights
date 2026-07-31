import { Tag, TagType } from '@hanzo/elements'

import { getSurveyStatus } from 'scenes/surveys/surveysLogic'

import { ProgressStatus, Survey } from '~/types'

export function SurveyStatusTag({ survey }: { survey: Pick<Survey, 'start_date' | 'end_date'> }): JSX.Element {
    const statusColors = {
        running: 'success',
        draft: 'default',
        complete: 'completion',
    } as Record<ProgressStatus, TagType>
    const status = getSurveyStatus(survey)
    return (
        <Tag type={statusColors[status]} className="font-semibold" data-attr="status">
            {status.toUpperCase()}
        </Tag>
    )
}
