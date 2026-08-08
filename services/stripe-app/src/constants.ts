import type { ExtensionContextValue } from '@stripe/ui-extension-sdk/context'

import BrandIcon from './views/logomark.svg'

export const BRAND_COLOR = '#F7A501'

export interface AppConstants {
    INSIGHTS_US_BASE_URL: string
    INSIGHTS_EU_BASE_URL: string
    INSIGHTS_DASHBOARD_URL: string
    INSIGHTS_NEW_SOURCE_URL: string
}

const FALLBACK_CONSTANTS: AppConstants = {
    INSIGHTS_US_BASE_URL: 'https://us.hanzo.ai',
    INSIGHTS_EU_BASE_URL: 'https://eu.hanzo.ai',
    INSIGHTS_DASHBOARD_URL: 'https://app.hanzo.ai',
    INSIGHTS_NEW_SOURCE_URL: 'https://app.hanzo.ai/data-warehouse/new-source?kind=Stripe',
}

// Must match the `constants` block in stripe-app.json.
// `stripe apps upload` (apps plugin <1.15.32) server-canonicalises the manifest
// by adding a `declarations` block that causes the SDK to ignore top-level
// `constants` at runtime, making `environment.constants` undefined. Fall back
// to these hardcoded values when that happens. See PR #56404.
export function getConstants(environment: ExtensionContextValue['environment']): AppConstants {
    return (environment?.constants as unknown as AppConstants | undefined) ?? FALLBACK_CONSTANTS
}

export { BrandIcon }

export interface Timeframe {
    value: string
    label: string
    days: number
}

export const TIMEFRAMES: Timeframe[] = [
    { value: '-7d', label: 'Last 7 days', days: 7 },
    { value: '-30d', label: 'Last 30 days', days: 30 },
    { value: '-90d', label: 'Last 90 days', days: 90 },
    { value: '-180d', label: 'Last 180 days', days: 180 },
]

export const DEFAULT_TIMEFRAME: Timeframe = TIMEFRAMES[1]

export function getTimeframe(value: string): Timeframe {
    return TIMEFRAMES.find((t) => t.value === value) ?? DEFAULT_TIMEFRAME
}

export const INSIGHTS_ICON_SRC =
    'data:image/svg+xml,%3Csvg%20width%3D%2230%22%20height%3D%2230%22%20viewBox%3D%220%200%2067%2067%22%20fill%3D%22%23000%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20role%3D%22img%22%20aria-label%3D%22Hanzo%20Insights%22%3E%3Cpath%20d%3D%22M22.21%2067V44.6369H0V67H22.21Z%22%2F%3E%3Cpath%20d%3D%22M66.7038%2022.3184H22.2534L0.0878906%2044.6367H44.4634L66.7038%2022.3184Z%22%2F%3E%3Cpath%20d%3D%22M22.21%200H0V22.3184H22.21V0Z%22%2F%3E%3Cpath%20d%3D%22M66.7198%200H44.5098V22.3184H66.7198V0Z%22%2F%3E%3Cpath%20d%3D%22M66.7198%2067V44.6369H44.5098V67H66.7198Z%22%2F%3E%3C%2Fsvg%3E'
