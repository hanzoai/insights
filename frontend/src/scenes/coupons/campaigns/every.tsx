import { IconX } from '@hanzo/icons'

import { Logo } from 'lib/brand'

import { CampaignConfig } from './types'

// TODO: Keep this date in sync with EveryGoodieBagStrategy.INVOICE_CUTOFF_DATE in billing.
const EVERY_CREDIT_ELIGIBILITY_CUTOFF = 'July 14, 2026'

const EveryHero: React.FC = () => {
    return (
        <div className="flex items-center justify-center gap-3 mb-4">
            <Logo size="xl" />
            <IconX className="size-8 opacity-60" />
        </div>
    )
}

export const everyCampaign: CampaignConfig = {
    name: 'EVERY Goodie Bag',
    heroTitle: '$2K in AI credits + $2K in core credits',
    heroSubtitle: '$2K in AI credits for everyone, plus $2K in core credits for new Insights customers.',
    HeroImage: EveryHero,
    benefits: [
        {
            title: "$2K credits toward Insights's AI tools",
            description: (
                <>
                    All eligible EVERY Goodie Bag customers receive $2K in credits toward Insights's AI tools. Today,
                    that includes:
                    <ul className="mt-1 ml-4 list-disc text-muted text-sm">
                        <li>Insights AI (including the Slack agent)</li>
                        <li>Inbox (self-driving PRs based on your data)</li>
                    </ul>
                </>
            ),
        },
        {
            title: "Early access to new features in Insights's AI tools",
            description: 'Get access to select new Insights AI tools and features as they become available.',
        },
        {
            title: '$2K core credits',
            description: `Organizations with no non-$0 Insights invoices before ${EVERY_CREDIT_ELIGIBILITY_CUTOFF} are also eligible for $2K in credits for Insights core tools, such as product analytics, session replay, error tracking, AI observability, and data warehouse.`,
        },
        {
            title: '12-month access',
            description: 'Campaign benefits run for one year from the day you redeem your code.',
        },
    ],
    eligibilityCriteria: [
        'Active EVERY Goodie Bag annual subscriber',
        'Active paid subscription to Insights',
        `No non-$0 Insights invoices before ${EVERY_CREDIT_ELIGIBILITY_CUTOFF} to qualify for Insights core credits`,
        'Insights Desktop and AI Gateway are currently excluded from this offer',
    ],
}
