import type { ExtensionContextValue } from '@stripe/ui-extension-sdk/context'
import { ContextView, Link } from '@stripe/ui-extension-sdk/ui'

import InsightsConnect from '../components/InsightsConnect'
import { BRAND_COLOR, BrandIcon, getConstants } from '../constants'

const APP_ID = 'com.insights.stripe'

const Home = ({ environment }: ExtensionContextValue): JSX.Element => {
    return (
        <ContextView
            title="Insights"
            brandColor={BRAND_COLOR}
            brandIcon={BrandIcon}
            footerContent={
                <Link href={{ name: 'fullPage', params: { appId: APP_ID } }} type="primary">
                    Open full dashboard
                </Link>
            }
        >
            <InsightsConnect constants={getConstants(environment)} mode={environment.mode} />
        </ContextView>
    )
}

export default Home
