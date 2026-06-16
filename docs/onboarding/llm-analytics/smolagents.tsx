import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/OnboardingDocsContentWrapper'

import { StepDefinition } from '../steps'

export const getSmolagentsSteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
    const { CodeBlock, CalloutBox, Markdown, dedent, snippets } = ctx

    const NotableGenerationProperties = snippets?.NotableGenerationProperties

    return [
        {
            title: 'Install the Insights SDK',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Setting up analytics starts with installing the Insights SDK. The smolagents integration uses
                        Insights's OpenAI wrapper.
                    </Markdown>

                    <CodeBlock
                        language="bash"
                        code={dedent`
                            pip install insights
                        `}
                    />
                </>
            ),
        },
        {
            title: 'Install smolagents and OpenAI',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Install smolagents and the OpenAI SDK. Insights instruments your LLM calls by wrapping the OpenAI
                        client, which you can pass to smolagents' `OpenAIServerModel`.
                    </Markdown>

                    <CodeBlock
                        language="bash"
                        code={dedent`
                            pip install smolagents openai
                        `}
                    />
                </>
            ),
        },
        {
            title: 'Initialize Insights and smolagents',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Initialize Insights with your project API key and host from [your project
                        settings](https://insights.hanzo.ai/settings/project), then create a Insights OpenAI wrapper and
                        pass it to smolagents' `OpenAIServerModel`.
                    </Markdown>

                    <CodeBlock
                        language="python"
                        code={dedent`
                            from smolagents import CodeAgent, OpenAIServerModel
                            from insights.ai.openai import OpenAI
                            from insights import Insights

                            insights = Insights(
                                "<ph_project_api_key>",
                                host="<ph_client_api_host>"
                            )

                            openai_client = OpenAI(
                                api_key="your_openai_api_key",
                                insights_client=insights
                            )

                            model = OpenAIServerModel(
                                model_id="gpt-4o-mini",
                                client=openai_client,
                            )
                        `}
                    />

                    <CalloutBox type="fyi" icon="IconInfo" title="How this works">
                        <Markdown>
                            Insights's `OpenAI` wrapper is a drop-in replacement for `openai.OpenAI`. By passing it as
                            the `client` to `OpenAIServerModel`, all LLM calls made by smolagents are automatically
                            captured as `$ai_generation` events.
                        </Markdown>
                    </CalloutBox>
                </>
            ),
        },
        {
            title: 'Run your agent',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Use smolagents as normal. Insights automatically captures an `$ai_generation` event for each LLM
                        call made through the wrapped OpenAI client.
                    </Markdown>

                    <CodeBlock
                        language="python"
                        code={dedent`
                            agent = CodeAgent(
                                tools=[],
                                model=model,
                            )

                            result = agent.run(
                                "What is a fun fact about mascots?"
                            )

                            print(result)
                        `}
                    />

                    <Markdown>
                        {dedent`
                            You can expect captured \`$ai_generation\` events to have the following properties:
                        `}
                    </Markdown>

                    {NotableGenerationProperties && <NotableGenerationProperties />}
                </>
            ),
        },
    ]
}

export const SmolagentsInstallation = createInstallation(getSmolagentsSteps)
