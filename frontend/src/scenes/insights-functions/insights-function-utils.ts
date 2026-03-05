import { InsightsFunctionTypeType } from '~/types'

export function humanizeInsightsFunctionType(type: InsightsFunctionTypeType, plural: boolean = false): string {
    if (type === 'source_webhook') {
        return 'source' + (plural ? 's' : '')
    }
    return type.replaceAll('_', ' ') + (plural ? 's' : '')
}
