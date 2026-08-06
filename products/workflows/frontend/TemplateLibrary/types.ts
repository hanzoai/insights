import type { EmailTemplate } from 'scenes/insights-functions/email-templater/types'

import type { UserBasicType } from '~/types'

export interface MessageTemplate {
    id: string
    name: string
    description: string
    content: {
        templating: 'liquid' | 'script'
        email: EmailTemplate
    }
    created_at: string | null
    updated_at: string | null
    created_by: UserBasicType | null
}
