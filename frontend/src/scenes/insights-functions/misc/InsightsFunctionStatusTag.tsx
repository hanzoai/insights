import { LemonTag } from '@hanzo/lemon-ui'

import { capitalizeFirstLetter } from 'lib/utils'

import { InsightsFunctionTemplateStatus } from '~/types'

export interface InsightsFunctionStatusTagProps {
    status: InsightsFunctionTemplateStatus
}

export function InsightsFunctionStatusTag({ status }: InsightsFunctionStatusTagProps): JSX.Element | null {
    switch (status) {
        case 'alpha':
            return <LemonTag type="danger">Experimental</LemonTag>
        case 'beta':
            return <LemonTag type="completion">Beta</LemonTag>
        case 'stable':
            return null
        case 'coming_soon':
            return <LemonTag type="muted">Roadmap</LemonTag>
        case 'hidden':
            return <LemonTag type="muted">Hidden</LemonTag>
        default:
            return status ? <LemonTag type="highlight">{capitalizeFirstLetter(status)}</LemonTag> : null
    }
}
