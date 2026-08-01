import { InsightsFunctionTemplate } from '~/cdp/types'

import { hogApiErrorMessageFn } from './api-error'

export const template: InsightsFunctionTemplate = {
    free: true,
    status: 'hidden',
    type: 'destination',
    id: 'template-insights-get-account',
    name: 'Get account',
    description: 'Fetch a Customer analytics account into a workflow variable.',
    icon_url: '/static/insights-icon.svg',
    category: ['Custom'],
    code_language: 'script',
    code: `
${hogApiErrorMessageFn}

if (empty(inputs.external_id)) {
  throw Error('Account external ID is required')
}

let response := insightsGetAccount({'external_id': inputs.external_id})

if (response.status == 404) {
  throw Error(f'Account not found: {inputs.external_id}')
}

if (response.status != 200) {
  throw Error(f'Failed to fetch account ({response.status}): {apiErrorMessage(response)}')
}

print(f'Fetched account {inputs.external_id}')
return response.body
`,
    inputs_schema: [
        {
            key: 'external_id',
            type: 'string',
            label: 'Account external ID',
            secret: false,
            required: true,
            description:
                'The external ID of the account to fetch — the group key the account is linked to. Available from trigger event or group properties.',
        },
    ],
}
