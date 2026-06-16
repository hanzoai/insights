import { InsightsFunctionTemplate } from '~/cdp/types'

export const template: InsightsFunctionTemplate = {
    free: true,
    status: 'stable',
    type: 'transformation',
    id: 'template-drop-events',
    name: 'Drop Events',
    description: 'Drop events based on defined filters.',
    icon_url: '',
    category: ['Custom'],
    code_language: 'fn',
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
