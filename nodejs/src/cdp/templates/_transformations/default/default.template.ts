import { InsightsFunctionTemplate } from '~/cdp/types'

export const template: InsightsFunctionTemplate = {
    free: true,
    status: 'stable',
    type: 'transformation',
    id: 'template-blank-transformation',
    name: 'Custom transformation',
    description: 'This is a starter template for custom transformations',
    icon_url: '',
    category: ['Custom'],
    code_language: 'fn',
    code: `
// This is a blank template for custom transformations
// The function receives 'event' as a global object and expects it to be returned
// If you return null the event will be dropped and not ingested into your insights instance
// Check out our docs: https://hanzo.ai/docs/cdp/transformations/customizing-transformations
let returnEvent := event
returnEvent.properties.$example_added_property := 'example'
return returnEvent
    `,
    inputs_schema: [],
}
