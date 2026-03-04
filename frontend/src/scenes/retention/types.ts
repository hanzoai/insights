import { Dayjs } from 'lib/dayjs'

import { ActorType } from '~/types'

export const NO_BREAKDOWN_VALUE = '$$__insights_...__$$'

export interface ProcessedRetentionValue {
    count: number
    label: string
    percentage: number
    cellDate: Dayjs
    isCurrentPeriod: boolean
    isFuture: boolean
}

export interface ProcessedRetentionPayload {
    date: Dayjs
    label: string
    people_url: string
    values: ProcessedRetentionValue[]
    breakdown_value?: string | number | null
}

export interface RetentionTableRow {
    label: string
    cohortSize: number
    values: ProcessedRetentionValue[]
    breakdown_value?: string | number | null
}

export interface RetentionTrendPayload {
    count: number
    data: number[]
    days: string[]
    labels: string[]
    index: number
    breakdown_value?: string | number | null
}

export interface RetentionTablePeoplePayload {
    next?: string // Legacy support
    offset?: number // Offset for InsightsQL queries
    result?: RetentionTableAppearanceType[] // TODO: Rename to plural responses to match InsightsQL responses
    missing_persons?: number
}

export interface RetentionTableAppearanceType {
    person: ActorType
    appearances: number[]
}
