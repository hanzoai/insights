import { Tag } from '@hanzo/elements'

import { capitalizeFirstLetter } from 'lib/utils/strings'

import { InsightsFunctionTemplateStatus } from '~/types'

export interface InsightsFunctionStatusTagProps {
    status: InsightsFunctionTemplateStatus
}

export function InsightsFunctionStatusTag({ status }: InsightsFunctionStatusTagProps): JSX.Element | null {
    switch (status) {
        case 'alpha':
            return <Tag type="danger">Experimental</Tag>
        case 'beta':
            return <Tag type="completion">Beta</Tag>
        case 'stable':
            return null
        case 'coming_soon':
            return <Tag type="muted">Roadmap</Tag>
        case 'hidden':
            return <Tag type="muted">Hidden</Tag>
        default:
            return status ? <Tag type="highlight">{capitalizeFirstLetter(status)}</Tag> : null
    }
}
