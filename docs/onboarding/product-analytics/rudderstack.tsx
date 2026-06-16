import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/OnboardingDocsContentWrapper'

import { StepDefinition } from '../steps'

export const getRudderstackSteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
    const { CodeBlock, Markdown, CalloutBox, dedent } = ctx

    return [
        {
            title: 'Add Insights destination',
            badge: 'required',
            content: (
                <Markdown>
                    RudderStack is an open-source customer data platform that can route your analytics data to Insights
                    and other destinations. In your RudderStack dashboard, go to **Destinations** &gt; **Add
                    Destination** and search for **Insights**.
                </Markdown>
            ),
        },
        {
            title: 'Enter your credentials',
            badge: 'required',
            content: (
                <>
                    <Markdown>Enter your Insights project API key:</Markdown>
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
            title: 'Verify the connection',
            badge: 'recommended',
            content: (
                <>
                    <Markdown>
                        Connect your source to the Insights destination. RudderStack will now forward `track`,
                        `identify`, `page`, and `group` calls to Insights.
                    </Markdown>
                    <CalloutBox type="fyi" title="Learn more">
                        <Markdown>
                            See the [RudderStack integration docs](https://hanzo.ai/docs/libraries/rudderstack) for
                            more details.
                        </Markdown>
                    </CalloutBox>
                </>
            ),
        },
    ]
}

export const RudderstackInstallation = createInstallation(getRudderstackSteps)
