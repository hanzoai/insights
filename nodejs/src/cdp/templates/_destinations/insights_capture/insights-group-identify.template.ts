import { CustomFunctionTemplate } from '~/cdp/types'

export const template: CustomFunctionTemplate = {
    free: true,
    status: 'hidden',
    type: 'destination',
    id: 'template-insights-group-identify',
    name: 'Update group properties',
    description: 'Updates properties of a Insights group (requires Group Analytics addon)',
    icon_url: '/static/insights-icon.svg',
    category: ['Custom', 'Analytics'],
    code_language: 'custom_script',
    code: `
if (empty(inputs.group_key)) {
  throw Error('Group key is required')
}

if (empty(inputs.group_type)) {
  throw Error('Group type is required')
}

insightsCapture({
  'event': '$groupidentify',
  'distinct_id': f'{inputs.group_type}_{inputs.group_key}',
  'properties': {
    '$group_type': inputs.group_type,
    '$group_key': inputs.group_key,
    '$group_set': inputs.group_properties
  }
})
`,
    inputs_schema: [
        {
            type: 'string',
            key: 'group_type',
            label: 'Group type',
            required: true,
            secret: false,
            hidden: false,
            description: 'The key of the group (e.g organization, project)',
        },
        {
            type: 'string',
            key: 'group_key',
            label: 'Group ID',
            required: true,
            secret: false,
            hidden: false,
            description: "The ID of this group such as a database identifier (e.g. 1234-5678 or 'hanzo.ai')",
        },
        {
            type: 'dictionary',
            key: 'group_properties',
            label: 'Group properties',
            required: false,
            default: { id: '{inputs.group_key}' },
            secret: false,
            hidden: false,
            description: 'The properties to update on the group.',
        },
    ],
}
