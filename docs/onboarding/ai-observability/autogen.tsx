import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/shared/OnboardingDocsContentWrapper'

import { StepDefinition } from '../steps'

export const getAutoGenSteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
    const { CodeBlock, CalloutBox, Markdown, Blockquote, dedent, snippets } = ctx

    const NotableGenerationProperties = snippets?.NotableGenerationProperties

    return [
        {
            title: 'Install dependencies',
            badge: 'required',
            content: (
                <>
                    <CalloutBox type="info" icon="IconInfo" title="Full working examples">
                        <Markdown>
                            See the complete [Python
                            example](https://github.com/Insights/insights-python/tree/master/examples/example-ai-autogen)
                            on GitHub. If you're using the Insights SDK wrapper instead of OpenTelemetry, see the [Python
                            wrapper
                            example](https://github.com/Insights/insights-python/tree/7223c52/examples/example-ai-autogen).
                        </Markdown>
                    </CalloutBox>

                    <Markdown>Install the OpenTelemetry SDK, the OpenAI instrumentation, and AutoGen.</Markdown>

                    <CodeBlock
                        language="bash"
                        code={dedent`
                            pip install autogen-agentchat "autogen-ext[openai]" openai opentelemetry-sdk "insights[otel]" opentelemetry-instrumentation-openai-v2
                        `}
                    />
                </>
            ),
        },
        {
            title: 'Set up OpenTelemetry tracing',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Configure OpenTelemetry to auto-instrument OpenAI SDK calls and export traces to Insights.
                        Insights converts `gen_ai.*` spans into `$ai_generation` events automatically.
                    </Markdown>

                    <CodeBlock
                        language="python"
                        code={dedent`
                            from opentelemetry import trace
                            from opentelemetry.sdk.trace import TracerProvider
                            from opentelemetry.sdk.resources import Resource, SERVICE_NAME
                            from insights.ai.otel import InsightsSpanProcessor
                            from opentelemetry.instrumentation.openai_v2 import OpenAIInstrumentor

                            resource = Resource(attributes={
                                SERVICE_NAME: "my-app",
                                "insights.distinct_id": "user_123", # optional: identifies the user in Insights
                                "foo": "bar", # custom properties are passed through
                            })

                            provider = TracerProvider(resource=resource)
                            provider.add_span_processor(
                                InsightsSpanProcessor(
                                    api_key="<ph_project_token>",
                                    host="<ph_client_api_host>",
                                )
                            )
                            trace.set_tracer_provider(provider)

                            OpenAIInstrumentor().instrument()
                        `}
                    />
                </>
            ),
        },
        {
            title: 'Run your agents',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Use AutoGen as normal. Insights automatically captures an `$ai_generation` event for each LLM
                        call made through the OpenAI SDK that AutoGen uses internally.
                    </Markdown>

                    <CodeBlock
                        language="python"
                        code={dedent`
                            import asyncio
                            from autogen_agentchat.agents import AssistantAgent
                            from autogen_ext.models.openai import OpenAIChatCompletionClient

                            model_client = OpenAIChatCompletionClient(
                                model="gpt-4o",
                                api_key="your_openai_api_key",
                            )
                            agent = AssistantAgent("assistant", model_client=model_client)

                            async def main():
                                result = await agent.run(task="Say 'Hello World!'")
                                print(result)
                                await model_client.close()

                            asyncio.run(main())
                        `}
                    />

                    <Blockquote>
                        <Markdown>
                            **Note:** If you want to capture LLM events anonymously, omit the `insights.distinct_id`
                            resource attribute. See our docs on [anonymous vs identified
                            events](https://hanzo.ai/docs/data/anonymous-vs-identified-events) to learn more.
                        </Markdown>
                    </Blockquote>

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

export const AutoGenInstallation = createInstallation(getAutoGenSteps)
