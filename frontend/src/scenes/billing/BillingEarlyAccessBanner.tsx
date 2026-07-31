import { useActions } from 'kea'

import { Link } from '@hanzo/elements'

import { supportLogic } from 'lib/components/Support/supportLogic'
import { BuilderMascot3 } from 'lib/components/mascots'
import { Banner } from 'lib/elements/Banner'
import { Tag } from 'lib/elements/Tag/Tag'

export function BillingEarlyAccessBanner(): JSX.Element {
    const { openSupportForm } = useActions(supportLogic)

    return (
        <Banner type="info" hideIcon className="overflow-visible">
            <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0 mr-2">
                    <Tag type="completion" className="absolute top-2.5 left-0 transform -rotate-12">
                        EARLY ACCESS
                    </Tag>
                    <BuilderMascot3 className="w-20 h-20 mt-6" />
                </div>
                <div className="text-primary">
                    <p>
                        We're still tinkering with these dashboards - got questions, ideas or bugs?{' '}
                        <Link
                            onClick={() =>
                                openSupportForm({
                                    kind: 'support',
                                    target_area: 'billing',
                                    isEmailFormOpen: true,
                                })
                            }
                        >
                            Send them our way
                        </Link>
                        !
                    </p>
                    <ul className="list-disc list-inside pl-2">
                        <li>Usage data updates daily (UTC) - so today's numbers show up tomorrow</li>
                        <li>Historical spend and billing periods are based on the current subscription plan</li>
                        <li>
                            To further breakdown product usage, check out this{' '}
                            <Link
                                to={`/dashboard?templateFilter=${encodeURIComponent('billable usage')}#newDashboard=modal`}
                            >
                                dashboard template
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>
        </Banner>
    )
}
