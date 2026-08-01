import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/shared/OnboardingDocsContentWrapper'

import { getReactNativeSteps as getReactNativeStepsPA } from '../product-analytics/react-native'
import { StepDefinition } from '../steps'

export const getReactNativeSteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
    const { CodeBlock, Markdown, dedent } = ctx

    const installSteps = getReactNativeStepsPA(ctx, { minVersion: '4.44.0' })

    const sendLogStep: StepDefinition = {
        title: 'Send a log',
        badge: 'required',
        content: (
            <>
                <Markdown>
                    Capture a structured log record using the logger facade. Requires `insights-react-native` 4.44.0 or
                    later. Records are batched and shipped to Insights's logs product.
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

                                    const handlePress = () => {
                                        insights.logger.info('checkout completed', {
                                            order_id: 'ord_789'
                                        })
                                    }

                                    return <Button onPress={handlePress} title="Check out" />
                                }
                            `,
                        },
                    ]}
                />
                <Markdown>
                    {dedent`
                        Logs appear in Insights within a few seconds. Use the [Logs page](https://app.hanzo.ai/logs) to search and filter
                        by service name, severity, or any attribute you attach.
                    `}
                </Markdown>
            </>
        ),
    }

    return [...installSteps, sendLogStep]
}

export const ReactNativeInstallation = createInstallation(getReactNativeSteps)
