import { useActions, useValues } from 'kea'
import { useMemo } from 'react'

import { IconPlus } from '@hanzo/icons'
import { Banner } from '@hanzo/elements'

import {
    AuthorizedUrlListType,
    authorizedUrlListLogic,
    defaultAuthorizedUrlProperties,
    sanitizePossibleWildCardedURL,
    validateProposedUrl,
} from 'lib/components/AuthorizedUrlList/authorizedUrlListLogic'
import { toast } from 'lib/elements/Toast/Toast'
import { heatmapsBrowserLogic } from 'scenes/heatmaps/components/heatmapsBrowserLogic'

const HOST_WILDCARD_REGEX = /^https?:\/\/[^/]*\*/

function deriveAuthorizationCandidate(dataUrl: string): string | null {
    if (HOST_WILDCARD_REGEX.test(dataUrl)) {
        const match = dataUrl.match(/^(https?:\/\/[^/]+)/)
        return match ? match[1] : null
    }
    try {
        return sanitizePossibleWildCardedURL(dataUrl).origin
    } catch {
        return null
    }
}

export function HeatmapsForbiddenURL(): JSX.Element {
    const { dataUrl } = useValues(heatmapsBrowserLogic)
    const logic = authorizedUrlListLogic({
        ...defaultAuthorizedUrlProperties,
        type: AuthorizedUrlListType.TOOLBAR_URLS,
    })
    const { authorizedUrls } = useValues(logic)
    const { addUrl } = useActions(logic)

    const { urlToAuthorize, validationError } = useMemo(() => {
        if (!dataUrl) {
            return { urlToAuthorize: null, validationError: null }
        }
        const candidate = deriveAuthorizationCandidate(dataUrl)
        if (!candidate) {
            return { urlToAuthorize: null, validationError: 'Enter a valid URL to authorize' }
        }
        const error = validateProposedUrl(candidate, authorizedUrls, false, true)
        return { urlToAuthorize: candidate, validationError: error ?? null }
    }, [dataUrl, authorizedUrls])

    return (
        <div className="my-2">
            <Banner
                type="error"
                action={
                    urlToAuthorize && !validationError
                        ? {
                              children: 'Authorize URL',
                              icon: <IconPlus />,
                              onClick: () => {
                                  addUrl(urlToAuthorize)
                                  toast.success(`Authorized ${urlToAuthorize}`)
                              },
                              'data-attr': 'heatmaps-authorize-url',
                          }
                        : undefined
                }
            >
                {dataUrl} is not an authorized URL.
                {validationError ? <> {validationError}.</> : null}
            </Banner>
        </div>
    )
}
