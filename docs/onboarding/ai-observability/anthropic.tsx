import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/shared/OnboardingDocsContentWrapper'

import { StepDefinition } from '../steps'

export const getAnthropicSteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
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
                            See the complete
                            [Node.js](https://github.com/Insights/insights-js/tree/main/examples/example-ai-anthropic) and
                            [Python](https://github.com/Insights/insights-python/tree/master/examples/example-ai-anthropic)
                            examples on GitHub. If you're using the Insights SDK wrapper instead of OpenTelemetry, see
                            the [Node.js
                            wrapper](https://github.com/Insights/insights-js/tree/e08ff1be/examples/example-ai-anthropic)
                            and [Python
                            wrapper](https://github.com/Insights/insights-python/tree/7223c52/examples/example-ai-anthropic)
                            examples.
                        </Markdown>
                    </CalloutBox>

                    <Markdown>
                        Install the OpenTelemetry SDK, the Anthropic instrumentation, and the Anthropic SDK.
                    </Markdown>

                    <CodeBlock
                        blocks={[
                            {
                                language: 'bash',
                                file: 'Python',
                                code: dedent`
                                    pip install anthropic opentelemetry-sdk "insights[otel]" opentelemetry-instrumentation-anthropic
                                `,
                            },
                            {
                                language: 'bash',
                                file: 'Node',
                                code: dedent`
                                    npm install @anthropic-ai/sdk @hanzo/ai @opentelemetry/sdk-node @opentelemetry/resources @traceloop/instrumentation-anthropic
                                `,
                            },
                        ]}
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
                        Configure OpenTelemetry to auto-instrument Anthropic SDK calls and export traces to Insights.
                        Insights converts `gen_ai.*` spans into `$ai_generation` events automatically.
                    </Markdown>

                    <CodeBlock
                        blocks={[
                            {
                                language: 'python',
                                file: 'Python',
                                code: dedent`
                                    from opentelemetry import trace
                                    from opentelemetry.sdk.trace import TracerProvider
                                    from opentelemetry.sdk.resources import Resource, SERVICE_NAME
                                    from insights.ai.otel import InsightsSpanProcessor
                                    from opentelemetry.instrumentation.anthropic import AnthropicInstrumentor

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

                                    AnthropicInstrumentor().instrument()
                                `,
                            },
                            {
                                language: 'typescript',
                                file: 'Node',
                                code: dedent`
                                    import { NodeSDK } from '@opentelemetry/sdk-node'
                                    import { resourceFromAttributes } from '@opentelemetry/resources'
                                    import { InsightsSpanProcessor } from '@hanzo/ai/otel'
                                    import { AnthropicInstrumentation } from '@traceloop/instrumentation-anthropic'

                                    const sdk = new NodeSDK({
                                      resource: resourceFromAttributes({
                                        'service.name': 'my-app',
                                        'insights.distinct_id': 'user_123', // optional: identifies the user in Insights
                                        foo: 'bar', // custom properties are passed through
                                      }),
                                      spanProcessors: [
                                        new InsightsSpanProcessor({
                                          apiKey: '<ph_project_token>',
                                          host: '<ph_client_api_host>',
                                        }),
                                      ],
                                      instrumentations: [new AnthropicInstrumentation()],
                                    })
                                    sdk.start()
                                `,
                            },
                        ]}
                    />
                </>
            ),
        },
        {
            title: 'Call Anthropic',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Now, when you use the Anthropic SDK to call LLMs, Insights automatically captures
                        `$ai_generation` events via the OpenTelemetry instrumentation.
                    </Markdown>

                    <CodeBlock
                        blocks={[
                            {
                                language: 'python',
                                file: 'Python',
                                code: dedent`
                                    import anthropic

                                    client = anthropic.Anthropic(api_key="sk-ant-api...")

                                    response = client.messages.create(
                                        model="claude-sonnet-4-20250514",
                                        max_tokens=1024,
                                        messages=[
                                            {"role": "user", "content": "Tell me a fun fact about mascots"}
                                        ],
                                    )

                                    print(response.content[0].text)
                                `,
                            },
                            {
                                language: 'typescript',
                                file: 'Node',
                                code: dedent`
                                    import Anthropic from '@anthropic-ai/sdk'

                                    const client = new Anthropic({ apiKey: 'sk-ant-api...' })

                                    const response = await client.messages.create({
                                      model: 'claude-sonnet-4-20250514',
                                      max_tokens: 1024,
                                      messages: [{ role: 'user', content: 'Tell me a fun fact about mascots' }],
                                    })

                                    console.log(response.content[0].text)
                                `,
                            },
                        ]}
                    />

                    <Blockquote>
                        <Markdown>
                            **Note:** This also works with the `AsyncAnthropic` client as well as `AnthropicBedrock`,
                            `AnthropicVertex`, and the async versions of those.
                        </Markdown>
                    </Blockquote>

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

export const AnthropicInstallation = createInstallation(getAnthropicSteps)
