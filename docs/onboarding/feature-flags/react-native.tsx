import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/OnboardingDocsContentWrapper'

import { getReactNativeSteps as getReactNativeStepsPA } from '../product-analytics/react-native'
import { StepDefinition } from '../steps'

export const getReactNativeSteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
    const { CodeBlock, Markdown, dedent } = ctx

    // Get installation steps from product-analytics
    const installationSteps = getReactNativeStepsPA(ctx)

    // Add flag-specific steps
    const flagSteps: StepDefinition[] = [
        {
            title: 'Use feature flags',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        {dedent`
                            Insights provides hooks to make it easy to use feature flags in your React Native app. Use \`useFeatureFlagEnabled\` for boolean flags:
                        `}
                    </Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'tsx',
                                file: 'Component.tsx',
                                code: dedent`
                                    import { useInsights } from 'insights-react-native'

                                    function MyComponent() {
                                        const insights = useInsights()
                                        const isMyFlagEnabled = insights.isFeatureEnabled('flag-key')

                                        if (isMyFlagEnabled) {
                                            // Do something differently for this user
                                            // Optional: fetch the payload
                                            const matchedFlagPayload = insights.getFeatureFlagPayload('flag-key')
                                        }

                                        return <View>...</View>
                                    }
                                `,
                            },
                        ]}
                    />
                    <Markdown>
                        {dedent`
                            ### Multivariate flags

                            For multivariate flags, use \`getFeatureFlag\`:
                        `}
                    </Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'tsx',
                                file: 'Component.tsx',
                                code: dedent`
                                    import { useInsights } from 'insights-react-native'

                                    function MyComponent() {
                                        const insights = useInsights()
                                        const enabledVariant = insights.getFeatureFlag('flag-key')

                                        if (enabledVariant === 'variant-key') { // replace 'variant-key' with the key of your variant
                                            // Do something differently for this user
                                            // Optional: fetch the payload
                                            const matchedFlagPayload = insights.getFeatureFlagPayload('flag-key')
                                        }

                                        return <View>...</View>
                                    }
                                `,
                            },
                        ]}
                    />
                </>
            ),
        },
        {
            title: 'Running experiments',
            badge: 'optional',
            content: (
                <Markdown>
                    {dedent`
                        Experiments run on top of our feature flags. Once you've implemented the flag in your code, you run an experiment by creating a new experiment in the Insights dashboard.
                    `}
                </Markdown>
            ),
        },
    ]

    return [...installationSteps, ...flagSteps]
}

export const ReactNativeInstallation = createInstallation(getReactNativeSteps)
