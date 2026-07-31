import { kea, path, props } from 'kea'
import { forms } from 'kea-forms'

import type { dialogLogicType } from './dialogLogicType'

export type DialogFormPropsType = {
    errors?: Record<string, (value: string) => string | undefined>
}

export const dialogLogic = kea<dialogLogicType>([
    path(['components', 'dialog', 'dialogLogic']),
    props({} as DialogFormPropsType),
    forms(({ props }) => ({
        form: {
            defaults: {},
            errors: (values) => {
                const entries = Object.entries(props.errors || []).map(([key, valueOf]) => {
                    const result = valueOf(values[key])
                    return [key, result]
                })
                return Object.fromEntries(entries)
            },
        },
    })),
])
