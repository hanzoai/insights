import { Banner } from 'lib/elements/Banner'
import { Divider } from 'lib/elements/Divider'
import { Tag } from 'lib/elements/Tag'
import { Link } from 'lib/elements/Link'
import { urls } from 'scenes/urls'

import { OnboardingStepKey, SDKKey } from '~/types'

export type AdvertiseMobileReplayContext =
    | 'product-analytics-onboarding'
    | 'flags-onboarding'
    | 'experiments-onboarding'

export function AdvertiseMobileReplay({
    context,
    sdkKey,
}: {
    context: AdvertiseMobileReplayContext
    sdkKey: SDKKey
}): JSX.Element {
    let platform = 'Mobile'
    switch (sdkKey) {
        case SDKKey.ANDROID:
            platform = 'Android'
            break
        case SDKKey.IOS:
            platform = 'iOS'
            break
        case SDKKey.REACT_NATIVE:
            platform = 'React Native'
            break
        case SDKKey.FLUTTER:
            platform = 'Flutter'
            break
    }
    const dataAttrPlatform = platform.toLowerCase().replace(/\s+/g, '-')

    return (
        <div>
            <Divider className="my-8" />
            <Banner type="info">
                <h3>
                    Session Replay for {platform} <Tag type="highlight">NEW</Tag>
                </h3>
                <div>
                    Session replay is now in general availability for {platform}.{' '}
                    <Link
                        to={urls.onboarding({
                            productKey: 'session_replay',
                            stepKey: OnboardingStepKey.INSTALL,
                            sdk: sdkKey,
                        })}
                        data-attr={`${context}-${dataAttrPlatform}-replay-cta`}
                    >
                        Learn how to set it up
                    </Link>
                </div>
            </Banner>
        </div>
    )
}
