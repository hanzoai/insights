import { processEvent } from '.'

import { LegacyTransformationPlugin } from '../../types'

export const insightsUrlNormalizerPlugin: LegacyTransformationPlugin = {
    processEvent,
    template: {
        free: true,
        status: 'deprecated',
        type: 'transformation',
        id: 'plugin-insights-url-normalizer-plugin',
        name: 'URL Normalizer',
        description:
            'Normalize the format of urls in your application allowing you to more easily compare them in insights.',
        icon_url: 'https://raw.githubusercontent.com/hanzoai/insights-url-normalizer-plugin/main/logo.png',
        category: ['Transformation'],
        code_language: 'javascript',
        code: `return event`,
        inputs_schema: [],
    },
}
