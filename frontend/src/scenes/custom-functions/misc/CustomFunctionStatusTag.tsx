import { LemonTag } from '@posthog/lemon-ui'

import { capitalizeFirstLetter } from 'lib/utils'

import { CustomFunctionTemplateStatus } from '~/types'

export interface CustomFunctionStatusTagProps {
    status: CustomFunctionTemplateStatus
}

export function CustomFunctionStatusTag({ status }: CustomFunctionStatusTagProps): JSX.Element | null {
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
