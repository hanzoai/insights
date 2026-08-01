import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/shared/OnboardingDocsContentWrapper'

import { StepDefinition } from '../steps'

export const getTraceloopSteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
    const { CodeBlock, Markdown, dedent } = ctx

    return [
        {
            title: 'Access the integrations page',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Traceloop supports most popular LLM models and you can bring your Traceloop data into Insights
                        for analysis.
                    </Markdown>
                    <Markdown>
                        Go to the [integrations page](https://app.traceloop.com/settings/integrations) in your Traceloop
                        dashboard and click on the Insights card.
                    </Markdown>
                </>
            ),
        },
        {
            title: 'Configure the integration',
            badge: 'required',
            content: (
                <>
                    <Markdown>Paste in your Insights project token:</Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'text',
                                file: 'API Key',
                                code: dedent`
                                <ph_project_token>
                            `,
                            },
                        ]}
                    />
                    <Markdown>Paste in your Insights host:</Markdown>
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
                    <Markdown>Select the environment you want to connect to Insights and click **Enable**.</Markdown>
                    <Markdown>
                        Traceloop events will now be exported into Insights as soon as they're available.
                    </Markdown>
                </>
            ),
        },
        {
            title: 'Send custom properties (optional)',
            badge: 'optional',
            content: (
                <>
                    <Markdown>
                        Prefix any Traceloop association property with `insights_` to attach it to the exported event as
                        a custom property. The prefix is stripped, so `insights_environment` becomes an `environment`
                        property you can filter and break down by in Insights.
                    </Markdown>
                    <CodeBlock
                        language="typescript"
                        code={dedent`
                            import { withAssociationProperties } from '@traceloop/node-server-sdk'

                            withAssociationProperties({ insights_environment: 'production' }, () => {
                              // your LLM calls here
                            })
                        `}
                    />
                </>
            ),
        },
    ]
}

export const TraceloopInstallation = createInstallation(getTraceloopSteps)
