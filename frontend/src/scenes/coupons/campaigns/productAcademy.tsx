import { CampaignConfig } from './types'

export const productAcademyCampaign: CampaignConfig = {
    name: 'Product Academy giveaway',
    heroTitle: 'Get $100 in Insights credit',
    heroSubtitle: 'A Product Academy birthday giveaway',
    benefits: [
        {
            title: '$100 in Insights credit',
            description: 'Use the credit toward future Insights invoices after you activate billing.',
        },
        {
            title: 'No expiration date',
            description: 'Redeem your code whenever you are ready to move beyond the free tier.',
        },
    ],
    eligibilityCriteria: [
        'A valid code from the Product Academy giveaway',
        'Organization admin or owner in Insights',
        'An active Insights subscription with a payment method',
    ],
}
