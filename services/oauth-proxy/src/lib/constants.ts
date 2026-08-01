export type Region = 'us' | 'eu'

export const POSTFN_US_BASE_URL = 'https://us.hanzo.ai'
export const POSTFN_EU_BASE_URL = 'https://eu.hanzo.ai'

export const REGION_BASE_URLS: Record<Region, string> = {
    us: POSTFN_US_BASE_URL,
    eu: POSTFN_EU_BASE_URL,
}

export function toRegion(value: string | undefined | null): Region {
    return value?.toLowerCase() === 'eu' ? 'eu' : 'us'
}

export function baseUrlForRegion(region: Region): string {
    return REGION_BASE_URLS[region]
}
