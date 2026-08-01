import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/shared/OnboardingDocsContentWrapper'

import { getIOSSteps as getIOSStepsPA } from '../product-analytics/ios'
import { StepDefinition } from '../steps'

export const getIOSSteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
    const { CodeBlock, Markdown, dedent } = ctx

    const installSteps = getIOSStepsPA(ctx, {
        minVersionPod: '3.58',
        minVersionSPM: '3.58.0',
    })

    const sendLogStep: StepDefinition = {
        title: 'Send a log',
        badge: 'required',
        content: (
            <>
                <Markdown>
                    Capture a structured log record with `captureLog`. Records are batched and shipped to Insights's logs
                    product.
                </Markdown>
                <CodeBlock
                    blocks={[
                        {
                            language: 'swift',
                            file: 'Swift',
                            code: dedent`
                                import Insights

                                InsightsSDK.shared.captureLog("Server started", level: .info, attributes: [
                                    "server.port": 3000,
                                    "server.env": "production"
                                ])
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

export const IOSInstallation = createInstallation(getIOSSteps)
