import { useActions, useValues } from 'kea'

import { DateFilter } from 'lib/components/DateFilter/DateFilter'
import { Button } from 'lib/elements/Button'
import { Modal } from 'lib/elements/Modal'
import { IconOpenInNew } from 'lib/elements/icons'
import { addProductIntentForCrossSell } from 'lib/utils/product-intents'
import { urls } from 'scenes/urls'
import { WebQuery } from 'scenes/web-analytics/tiles/WebAnalyticsTile'

import { ProductIntentContext, ProductKey } from '~/queries/schema/schema-general'

import { WebAnalyticsExport } from './WebAnalyticsExport'
import { WebPropertyFilters } from './WebPropertyFilters'
import { ProductTab } from './common'
import { webAnalyticsLogic } from './webAnalyticsLogic'
import { webAnalyticsModalLogic } from './webAnalyticsModalLogic'

export const WebAnalyticsModal = (): JSX.Element | null => {
    const {
        dateFilter: { dateFrom, dateTo },
        productTab,
    } = useValues(webAnalyticsLogic)
    const { modal } = useValues(webAnalyticsModalLogic)

    const { setDates } = useActions(webAnalyticsLogic)
    const { closeModal } = useActions(webAnalyticsModalLogic)

    if (!modal) {
        return null
    }

    return (
        <Modal
            isOpen={!!modal}
            onClose={closeModal}
            simple={false}
            title={modal?.title || ''}
            width={1600}
            fullScreen={false}
            closable={true}
        >
            <div className="WebAnalyticsModal deprecated-space-y-4">
                <div className="flex flex-row flex-wrap gap-2">
                    {productTab !== ProductTab.MARKETING && <WebPropertyFilters />}
                    <DateFilter dateFrom={dateFrom} dateTo={dateTo} onChange={setDates} />
                    <div className="ml-auto">
                        <WebAnalyticsExport query={modal.query} insightProps={modal.insightProps} />
                    </div>
                </div>
                <Modal.Content embedded>
                    <WebQuery
                        attachTo={webAnalyticsLogic}
                        uniqueKey="WebAnalyticsModal.Query"
                        query={modal.query}
                        insightProps={modal.insightProps}
                        showIntervalSelect={modal.showIntervalSelect}
                        control={modal.control}
                        tileId={modal.tileId}
                    />
                </Modal.Content>
                <div className="flex flex-row justify-end">
                    {modal.canOpenInsight ? (
                        <Button
                            to={urls.insightNew({ query: modal.query, sceneSource: 'web-analytics' })}
                            icon={<IconOpenInNew />}
                            size="small"
                            type="secondary"
                            onClick={() => {
                                void addProductIntentForCrossSell({
                                    from: ProductKey.WEB_ANALYTICS,
                                    to: ProductKey.PRODUCT_ANALYTICS,
                                    intent_context: ProductIntentContext.WEB_ANALYTICS_INSIGHT,
                                })
                            }}
                        >
                            Open as new Insight
                        </Button>
                    ) : null}
                </div>
            </div>
        </Modal>
    )
}
