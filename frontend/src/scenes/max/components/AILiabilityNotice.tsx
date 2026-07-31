import { useActions, useValues } from 'kea'

import { Banner, Link } from '@hanzo/elements'

import { organizationLogic } from 'scenes/organizationLogic'
import { urls } from 'scenes/urls'

import { maxGlobalLogic } from '../maxGlobalLogic'

export function AILiabilityNotice(): JSX.Element | null {
    const { shouldShowLiabilityNotice } = useValues(maxGlobalLogic)
    const { dismissLiabilityNotice } = useActions(maxGlobalLogic)
    const { isAdminOrOwner } = useValues(organizationLogic)

    if (!shouldShowLiabilityNotice) {
        return null
    }

    return (
        <div className="flex flex-col mb-2 max-w-160 w-full px-3">
            <Banner type="ai" onClose={dismissLiabilityNotice}>
                Insights AI uses third-party LLM providers (OpenAI and Anthropic). Your data will not be used for
                training models.
                {isAdminOrOwner && (
                    <>
                        {' '}
                        If you'd rather disable this feature,{' '}
                        <Link to={urls.settings('organization-details', 'organization-ai-consent')}>
                            manage AI settings
                        </Link>
                        .
                    </>
                )}{' '}
                <Link to="https://hanzo.ai/docs/insights-ai/faq" target="_blank" disableDocsPanel>
                    Learn more
                </Link>
            </Banner>
        </div>
    )
}
