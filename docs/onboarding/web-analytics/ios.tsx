import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/OnboardingDocsContentWrapper'

import { getIOSSteps as getIOSStepsPA } from '../product-analytics/ios'
import { StepDefinition } from '../steps'

export const getIOSSteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
    const { Markdown, CodeBlock, dedent, snippets } = ctx
    const MobileFinalSteps = snippets?.MobileFinalSteps

    // Get installation steps from product-analytics
    const paSteps = getIOSStepsPA(ctx)

    // Replace the "Send events" step with web analytics specific content
    const webAnalyticsSteps = paSteps.map((step) => {
        if (step.title === 'Send events') {
            return {
                title: 'Track screen views',
                badge: 'recommended' as const,
                content: (
                    <>
                        {MobileFinalSteps && <MobileFinalSteps />}
                        <Markdown>
                            To automatically track screen views, configure Insights to capture screen views:
                        </Markdown>
                        <CodeBlock
                            blocks={[
                                {
                                    language: 'swift',
                                    file: 'AppDelegate.swift',
                                    code: dedent`
                                        let config = InsightsConfig(apiKey: INSIGHTS_API_KEY, host: INSIGHTS_HOST)
                                        config.captureScreenViews = true
                                        InsightsSDK.shared.setup(config)
                                    `,
                                },
                            ]}
                        />
                    </>
                ),
            }
        }
        return step
    })

    return webAnalyticsSteps
}

export const IOSInstallation = createInstallation(getIOSSteps)
