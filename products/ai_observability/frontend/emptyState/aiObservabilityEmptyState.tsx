import { IconLlmAnalytics } from '@hanzo/icons'

import { pngMascot } from 'lib/brand/mascot'
import type { SceneProductEmptyState } from 'lib/components/ProductEmptyState/types'

import { ProductKey } from '~/queries/schema/schema-general'

import { aiObservabilitySharedLogic } from '../aiObservabilitySharedLogic'
import { AIObservabilityTracePreview } from './AIObservabilityTracePreview'

const MascotMagnifyingGlass = pngMascot()

export const aiObservabilityEmptyState: SceneProductEmptyState = {
    statusLogic: aiObservabilitySharedLogic,
    config: {
        productKey: ProductKey.AI_OBSERVABILITY,
        productName: 'AI observability',
        icon: <IconLlmAnalytics />,
        accentColor: 'var(--color-product-llm-analytics-light)',
        accentColorDark: 'var(--color-product-llm-analytics-dark)',
        mascot: MascotMagnifyingGlass,
        text: {
            'needs-setup': {
                headline: 'See how your AI is doing in the wild',
                lead: "Capture LLM sessions in full detail. See how it's being used, catch errors and regressions in real-time, and get alerted when they happen.",
                hint: 'Point the wizard at your project root. Setup costs are on us, no API key needed:',
            },
        },
        wizard: { slug: 'ai-observability', pinProjectId: true },
        docsUrl: 'https://hanzo.ai/docs/ai-observability',
        manualSetupUrl: 'https://hanzo.ai/docs/ai-observability/installation',
        previewLabel: 'Sessions, once connected',
        Preview: AIObservabilityTracePreview,
    },
}
