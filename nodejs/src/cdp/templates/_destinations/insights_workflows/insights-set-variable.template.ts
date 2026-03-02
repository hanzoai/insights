import { CustomFunctionTemplate } from '~/cdp/types'

export const template: CustomFunctionTemplate = {
    free: true,
    status: 'hidden',
    type: 'destination',
    id: 'template-insights-set-variable',
    name: 'Set workflow variable',
    description: 'Set a variable value in the workflow',
    icon_url: '/static/insights-icon.svg',
    category: ['Custom', 'Analytics'],
    code_language: 'custom_script',
    code: `
return inputs.variable_value
`,
    inputs_schema: [
        {
            key: 'variable_value',
            type: 'string',
            label: 'Value',
            secret: false,
            required: true,
            description:
                'The value to set for the variable. Configure which variable to set in the Output variable section below.',
        },
    ],
}
