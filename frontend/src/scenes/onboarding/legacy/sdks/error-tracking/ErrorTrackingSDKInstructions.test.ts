import { SDKKey } from '~/types'

import { ALL_SDKS } from '../allSDKs'
import { getAvailableSDKs } from '../getAvailableSDKs'
import { ErrorTrackingSDKDocsLinkOverrides, ErrorTrackingSDKInstructions } from './ErrorTrackingSDKInstructions'

describe('ErrorTrackingSDKInstructions', () => {
    const newlySupportedSDKs: Array<[SDKKey, string]> = [
        [SDKKey.RUST, 'https://hanzo.ai/docs/error-tracking/installation/rust'],
        [SDKKey.UNITY, 'https://hanzo.ai/docs/error-tracking/installation/unity'],
        [SDKKey.ROBLOX, 'https://hanzo.ai/docs/error-tracking/installation/roblox'],
        [SDKKey.JAVA, 'https://hanzo.ai/docs/libraries/java'],
        [SDKKey.KMP, 'https://hanzo.ai/docs/libraries/kmp'],
        [SDKKey.CONVEX, 'https://hanzo.ai/docs/libraries/convex'],
    ]

    it.each(newlySupportedSDKs)('makes %s selectable with working instructions and docs', (sdkKey, docsLink) => {
        const availableSDKs = getAvailableSDKs(ErrorTrackingSDKInstructions, {}, ErrorTrackingSDKDocsLinkOverrides)
        const sdk = availableSDKs.find(({ key }) => key === sdkKey)

        expect(ErrorTrackingSDKInstructions[sdkKey]).not.toBeUndefined()
        expect(sdk).toMatchObject({ key: sdkKey, docsLink })
    })

    it('keeps the AI observability link in shared Convex metadata', () => {
        expect(ALL_SDKS.find(({ key }) => key === SDKKey.CONVEX)?.docsLink).toBe(
            'https://hanzo.ai/docs/ai-observability/installation/convex'
        )
    })
})
