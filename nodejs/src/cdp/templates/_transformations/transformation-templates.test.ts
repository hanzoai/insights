import { InsightsFunctionTemplate } from '~/cdp/types'

import {
    FN_FUNCTION_TEMPLATES_TRANSFORMATIONS,
    FN_FUNCTION_TEMPLATES_TRANSFORMATIONS_DEPRECATED,
    FN_FUNCTION_TEMPLATES_TRANSFORMATIONS_LOG,
} from '../index'

describe('Transformation templates', () => {
    const allTransformationTemplates: InsightsFunctionTemplate[] = [
        ...FN_FUNCTION_TEMPLATES_TRANSFORMATIONS,
        ...FN_FUNCTION_TEMPLATES_TRANSFORMATIONS_DEPRECATED,
        ...FN_FUNCTION_TEMPLATES_TRANSFORMATIONS_LOG,
    ]

    it('should have free property set to true for all transformation templates', () => {
        for (const template of allTransformationTemplates) {
            expect(template.free).toBe(true)
        }
    })
})
