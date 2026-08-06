import { InsightsFunctionTemplate } from '~/cdp/types'

import {
    INSIGHTS_FUNCTION_TEMPLATES_TRANSFORMATIONS,
    INSIGHTS_FUNCTION_TEMPLATES_TRANSFORMATIONS_DEPRECATED,
    INSIGHTS_FUNCTION_TEMPLATES_TRANSFORMATIONS_LOG,
} from '../index'

describe('Transformation templates', () => {
    const allTransformationTemplates: InsightsFunctionTemplate[] = [
        ...INSIGHTS_FUNCTION_TEMPLATES_TRANSFORMATIONS,
        ...INSIGHTS_FUNCTION_TEMPLATES_TRANSFORMATIONS_DEPRECATED,
        ...INSIGHTS_FUNCTION_TEMPLATES_TRANSFORMATIONS_LOG,
    ]

    it('should have free property set to true for all transformation templates', () => {
        for (const template of allTransformationTemplates) {
            expect(template.free).toBe(true)
        }
    })
})
