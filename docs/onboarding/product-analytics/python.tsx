import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/OnboardingDocsContentWrapper'

import { StepDefinition } from '../steps'

export const getPythonSteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
    const { CodeBlock, Markdown, CalloutBox, dedent, snippets } = ctx

    const PythonEventCapture = snippets?.PythonEventCapture

    return [
        {
            title: 'Install the package',
            badge: 'required',
            content: (
                <>
                    <Markdown>Install the Insights Python library using pip:</Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'bash',
                                file: 'Terminal',
                                code: dedent`
                                    pip install insights
                                `,
                            },
                        ]}
                    />
                </>
            ),
        },
        {
            title: 'Initialize Insights',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Initialize the Insights client with your project API key and host from your project settings:
                    </Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'python',
                                file: 'Python',
                                code: dedent`
                                    from insights import Insights

                                    insights = Insights(
                                        project_api_key='<ph_project_api_key>',
                                        host='<ph_client_api_host>'
                                    )
                                `,
                            },
                        ]}
                    />
                    <CalloutBox type="fyi" title="Django integration">
                        <Markdown>
                            If you're using Django, check out our [Django
                            integration](https://hanzo.ai/docs/libraries/django) for automatic request tracking.
                        </Markdown>
                    </CalloutBox>
                </>
            ),
        },
        {
            title: 'Send events',
            badge: 'recommended',
            content: (
                <>
                    <Markdown>
                        Once installed, Insights will automatically start capturing events. You can also manually send
                        events to test your integration:
                    </Markdown>
                    {PythonEventCapture && <PythonEventCapture />}
                </>
            ),
        },
    ]
}

export const PythonInstallation = createInstallation(getPythonSteps)
