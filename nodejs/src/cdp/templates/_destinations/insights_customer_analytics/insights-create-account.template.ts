import { InsightsFunctionTemplate } from '~/cdp/types'

import { hogApiErrorMessageFn } from './api-error'

export const template: InsightsFunctionTemplate = {
    free: true,
    status: 'hidden',
    type: 'destination',
    id: 'template-insights-create-account',
    name: 'Create account',
    description:
        'Create a Customer analytics account for the triggering event’s group, if one does not exist. The account name comes from the group’s name property.',
    icon_url: '/static/insights-icon.svg',
    category: ['Custom'],
    code_language: 'script',
    code: `
${hogApiErrorMessageFn}

if (empty(inputs.external_id)) {
  throw Error('Account external ID is required — the triggering event has no group of the configured account group type')
}

let response := insightsCreateAccount({
  'external_id': inputs.external_id
})

if (response.status >= 400) {
  throw Error(f'Failed to create account ({response.status}): {apiErrorMessage(response)}')
}

if (response.status == 200) {
  print(f'Account {inputs.external_id} already exists — skipped creation')
} else {
  print(f'Created account {inputs.external_id}')
}
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
                'The external ID for the account — the group key the account is linked to. Defaults to the triggering event’s group of the configured account group type.',
        },
    ],
}
