import { CustomFunctionTemplate } from '~/cdp/types'

export const template: CustomFunctionTemplate = {
    free: true,
    status: 'stable',
    type: 'transformation',
    id: 'template-drop-events',
    name: 'Drop Events',
    description: 'Drop events based on defined filters.',
    icon_url: '/static/mascot/builder-mascot-01.png',
    category: ['Custom'],
    code_language: 'custom_script',
    code: `
return null`,
    inputs_schema: [],
    filters: {
        events: [
            {
                id: 'CHANGE-ME',
                name: 'CHANGE-ME',
                type: 'events',
                order: 0,
            },
        ],
    },
}
