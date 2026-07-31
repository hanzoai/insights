import insights from '@hanzo/insights'
import { useState } from 'react'

import { Link } from '@hanzo/elements'

import { Banner } from 'lib/elements/Banner'
import { Button } from 'lib/elements/Button'
import { Modal } from 'lib/elements/Modal'

import { urls } from '../urls'

export function FreeHistoricalSyncsBanner({ hideGetStarted }: { hideGetStarted?: boolean }): JSX.Element {
    const [showModal, setShowModal] = useState(false)

    return (
        <>
            <Banner type="info" className="min-h-[auto] my-2">
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                        <span className="text-sm">
                            Sync all your historical data from any new source for free during the first 7 days
                        </span>

                        <Button
                            type="primary"
                            size="xsmall"
                            onClick={() => {
                                insights.capture('historical_sync_banner_learn_more_clicked')
                                setShowModal(true)
                            }}
                        >
                            Learn more
                        </Button>
                    </div>
                </div>
            </Banner>

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Free rows for the first 7-days on new sources"
                width={600}
                footer={
                    <div className="flex items-center justify-between gap-2 w-full">
                        <Link
                            to="https://hanzo.ai/docs/cdp/sources"
                            target="_blank"
                            onClick={() => {
                                insights.capture('historical_sync_banner_docs_link_clicked')
                            }}
                        >
                            View documentation
                        </Link>
                        {!hideGetStarted && (
                            <Button
                                type="primary"
                                to={urls.dataWarehouseSourceNew()}
                                onClick={() => {
                                    insights.capture('historical_sync_banner_new_source_clicked')
                                    setShowModal(false)
                                }}
                            >
                                Add new source
                            </Button>
                        )}
                    </div>
                }
            >
                <div className="space-y-4">
                    <p>
                        Connect a new data source and enjoy 7 days of free data syncs - perfect for importing historical
                        data and testing your pipeline at no cost.
                    </p>

                    <div className="bg-bg-light rounded p-4">
                        <h4 className="text-sm font-semibold mb-2">What's included?</h4>
                        <ul className="space-y-2 text-sm list-disc list-inside">
                            <li>Import historical data from your production databases</li>
                            <li>Sync data from third-party services like Stripe, Google Ads, BigQuery, and more</li>
                            <li>
                                <strong>Paid plans:</strong> Unlimited rows during the first 7-days
                            </li>
                            <li>
                                <strong>Free plan:</strong> Up to 100M free rows during the first 7-days
                            </li>
                        </ul>
                    </div>

                    {!hideGetStarted && (
                        <div>
                            <h4 className="text-sm font-semibold mb-2">Ready to get started?</h4>
                            <p className="text-sm mb-2">
                                Click below to add a new data source, or check out our documentation to learn more about
                                connecting your databases and third-party services.
                            </p>
                        </div>
                    )}

                    <p className="text-sm opacity-70">
                        After the first 7-day period, standard data warehouse pricing will apply.
                    </p>
                </div>
            </Modal>
        </>
    )
}
