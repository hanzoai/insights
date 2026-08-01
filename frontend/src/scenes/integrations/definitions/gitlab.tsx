import { ICONS } from 'lib/integrations/utils'

import { GitLabIntegration } from '../components/Integrations'
import { defineIntegration } from '../integrationDefinition'

export const GitLab = defineIntegration(
    {
        slug: 'gitlab',
        kind: 'gitlab',
        name: 'GitLab',
        logo: ICONS.gitlab,
        subtitle: 'Connect your GitLab projects to Insights',
        description: 'Connect GitLab to create and link issues directly from Insights error tracking and replays.',
        capabilities: [
            'Create GitLab issues from error tracking',
            'Link existing GitLab issues to Insights',
            'Keep engineering work connected to product signals',
        ],
        docsUrl: 'https://hanzo.ai/docs/error-tracking/integrations',
    },
    GitLabIntegration
)
