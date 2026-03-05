import { CustomFunctionTypeType } from '~/types'

export function humanizeCustomFunctionType(type: CustomFunctionTypeType, plural: boolean = false): string {
    if (type === 'source_webhook') {
        return 'source' + (plural ? 's' : '')
    }
    return type.replaceAll('_', ' ') + (plural ? 's' : '')
}
