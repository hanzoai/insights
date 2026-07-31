import { useValues } from 'kea'

import { Banner } from '@hanzo/elements'

import { AuthorizedUrlList } from 'lib/components/AuthorizedUrlList/AuthorizedUrlList'
import { AuthorizedUrlListType } from 'lib/components/AuthorizedUrlList/authorizedUrlListLogic'
import { heatmapLogic } from 'scenes/heatmaps/scenes/heatmap/heatmapLogic'

export function HeatmapsForbiddenURL(): JSX.Element {
    const { dataUrl } = useValues(heatmapLogic)

    return (
        <div className="flex-1 gap-y-4 my-2">
            <Banner type="error">
                {dataUrl} is not an authorized URL. Please add it to the list of authorized URLs to view heatmaps on
                this page.
            </Banner>
            <h4 className="my-4">Authorized Toolbar URLs</h4>
            <AuthorizedUrlList type={AuthorizedUrlListType.TOOLBAR_URLS} />
        </div>
    )
}
