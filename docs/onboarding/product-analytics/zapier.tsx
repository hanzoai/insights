import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/OnboardingDocsContentWrapper'

import { StepDefinition } from '../steps'

export const getZapierSteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
    const { CodeBlock, Markdown, dedent } = ctx

    return [
        {
            title: 'Connect Insights to Zapier',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Zapier lets you connect Insights to thousands of other apps. You can use it to send events to
                        Insights from other services or trigger actions based on Insights events. Go to the [Insights
                        integration page](https://zapier.com/apps/insights/integrations) on Zapier and click **Connect
                        Insights**. When prompted, enter your Insights project API key:
                    </Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'text',
                                file: 'API Key',
                                code: dedent`
                                <ph_project_api_key>
                            `,
                            },
                        ]}
                    />
                    <Markdown>Enter your Insights host:</Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'text',
                                file: 'Host',
                                code: dedent`
                                <ph_client_api_host>
                            `,
                            },
                        ]}
                    />
                </>
            ),
        },
        {
            title: 'Create a Zap',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Create a Zap that sends events to Insights using the "Capture Event" action. Events captured via
                        Zapier will appear in Insights just like events from any other source.
                    </Markdown>
                    <Markdown>
                        You can use Zapier to connect CRMs, payment processors, customer support tools, and more to your
                        Insights analytics.
                    </Markdown>
                </>
            ),
        },
    ]
}

export const ZapierInstallation = createInstallation(getZapierSteps)
