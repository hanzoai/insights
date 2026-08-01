import { InsightsFunctionTemplate } from '~/cdp/types'

export const template: InsightsFunctionTemplate = {
    status: 'stable',
    free: false,
    type: 'destination',
    id: 'template-github',
    name: 'GitHub',
    description: 'Creates an issue in a GitHub repository',
    icon_url: '/static/services/github.png',
    category: ['Error tracking'],
    code_language: 'script',
    code: `let owner := inputs.github_installation.account.name
let repo := inputs.repository

if (not owner) {
    throw Error('Owner is required')
}

if (not repo) {
    throw Error('Repository is required')
}

let insights_issue_url := inputs.insights_issue_url
if (empty(insights_issue_url)) {
    insights_issue_url := f'{project.url}/error_tracking/{inputs.insights_issue_id}'
}
let payload := {
    'method': 'POST',
    'headers': {
        'Authorization': f'Bearer {inputs.github_installation.access_token}',
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Insights Github App'
    },
    'body': {
        'title': inputs.title,
        'body': f'{inputs.description}\n\n[View in Insights]({insights_issue_url})'
    }
}

let res := fetch(f'https://api.github.com/repos/{owner}/{repo}/issues', payload)
if (res.status < 200 or res.status >= 300) {
    throw Error(f'Failed to create GitHub issue: {res.status}: {res.body}')
}`,
    inputs_schema: [
        {
            key: 'github_installation',
            type: 'integration',
            integration: 'github',
            label: 'GitHub installation',
            secret: false,
            hidden: false,
            required: true,
        },
        {
            key: 'repository',
            type: 'integration_field',
            integration_key: 'github_installation',
            integration_field: 'github_repository',
            label: 'Repository',
            secret: false,
            hidden: false,
            required: true,
        },
        {
            key: 'title',
            type: 'string',
            label: 'Title',
            secret: false,
            hidden: false,
            required: true,
            default: '{event.properties.$exception_types[1]}',
        },
        {
            key: 'description',
            type: 'string',
            label: 'Description',
            secret: false,
            hidden: false,
            required: true,
            default: '{event.properties.$exception_values[1]}',
        },
        {
            key: 'insights_issue_id',
            type: 'string',
            label: 'Insights issue ID',
            secret: false,
            hidden: true,
            required: true,
            default: '{event.properties.$exception_issue_id}',
        },
        {
            key: 'insights_issue_url',
            type: 'string',
            label: 'Insights issue URL',
            description:
                'Link back to the Insights issue. When empty, a link is built from the Insights issue ID instead.',
            secret: false,
            hidden: true,
            required: false,
        },
    ],
}
