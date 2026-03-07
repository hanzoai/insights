import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/OnboardingDocsContentWrapper'

import { StepDefinition } from '../steps'

export const getPydanticAISteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
    const { CodeBlock, CalloutBox, Markdown, dedent, snippets } = ctx

    const NotableGenerationProperties = snippets?.NotableGenerationProperties

    return [
        {
            title: 'Install the Insights SDK',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Setting up analytics starts with installing the Insights SDK. The Pydantic AI integration uses
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
            title: 'Install Pydantic AI',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Install Pydantic AI with OpenAI support. Insights instruments your LLM calls by wrapping the
                        OpenAI client that Pydantic AI uses.
                    </Markdown>

                    <CodeBlock
                        language="bash"
                        code={dedent`
                            pip install 'pydantic-ai[openai]'
                        `}
                    />
                </>
            ),
        },
        {
            title: 'Initialize Insights and Pydantic AI',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Initialize Insights with your project API key and host from [your project
                        settings](https://insights.hanzo.ai/settings/project), then create a Insights `AsyncOpenAI`
                        wrapper, pass it to an `OpenAIProvider`, and use that with Pydantic AI's `OpenAIChatModel`.
                    </Markdown>

                    <CodeBlock
                        language="python"
                        code={dedent`
                            from pydantic_ai import Agent
                            from pydantic_ai.models.openai import OpenAIChatModel
                            from pydantic_ai.providers.openai import OpenAIProvider
                            from insights.ai.openai import AsyncOpenAI
                            from insights import Insights

                            insights = Insights(
                                "<ph_project_api_key>",
                                host="<ph_client_api_host>"
                            )

                            openai_client = AsyncOpenAI(
                                api_key="your_openai_api_key",
                                insights_client=insights
                            )

                            provider = OpenAIProvider(openai_client=openai_client)

                            model = OpenAIChatModel(
                                "gpt-4o-mini",
                                provider=provider
                            )
                        `}
                    />

                    <CalloutBox type="fyi" icon="IconInfo" title="How this works">
                        <Markdown>
                            Insights's `AsyncOpenAI` wrapper is a proper subclass of `openai.AsyncOpenAI`, so it works
                            directly as the client for Pydantic AI's `OpenAIProvider`. Insights captures
                            `$ai_generation` events automatically without proxying your calls.
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
                        Create a Pydantic AI agent with the model and run it. Insights automatically captures an
                        `$ai_generation` event for each LLM call.
                    </Markdown>

                    <CodeBlock
                        language="python"
                        code={dedent`
                            agent = Agent(
                                model,
                                system_prompt="You are a helpful assistant.",
                            )

                            result = agent.run_sync(
                                "Tell me a fun fact about mascots.",
                                # Pass Insights metadata via the OpenAI client's extra params
                            )

                            print(result.output)
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

export const PydanticAIInstallation = createInstallation(getPydanticAISteps)
