import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/shared/OnboardingDocsContentWrapper'

import { StepDefinition } from '../steps'

export const getPortkeySteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
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
                            [Node.js](https://github.com/Insights/insights-js/tree/main/examples/example-ai-portkey) and
                            [Python](https://github.com/Insights/insights-python/tree/master/examples/example-ai-portkey)
                            examples on GitHub. If you're using the Insights SDK wrapper instead of OpenTelemetry, see
                            the [Node.js
                            wrapper](https://github.com/Insights/insights-js/tree/e08ff1be/examples/example-ai-portkey)
                            and [Python
                            wrapper](https://github.com/Insights/insights-python/tree/7223c52/examples/example-ai-portkey)
                            examples.
                        </Markdown>
                    </CalloutBox>

                    <CalloutBox type="fyi" icon="IconInfo" title="About Portkey">
                        <Markdown>
                            Portkey acts as an AI gateway that routes requests to 250+ LLM providers. The model string
                            format (`@integration-slug/model`) determines which provider to use, where the slug is the
                            name you chose when setting up the integration in Portkey.
                        </Markdown>
                    </CalloutBox>

                    <Markdown>Install the OpenTelemetry SDK, the OpenAI instrumentation, and the OpenAI SDK.</Markdown>

                    <CodeBlock
                        blocks={[
                            {
                                language: 'bash',
                                file: 'Python',
                                code: dedent`
                                    pip install openai portkey-ai opentelemetry-sdk "insights[otel]" opentelemetry-instrumentation-openai-v2
                                `,
                            },
                            {
                                language: 'bash',
                                file: 'Node',
                                code: dedent`
                                    npm install openai portkey-ai @hanzo/ai @opentelemetry/sdk-node @opentelemetry/resources @opentelemetry/instrumentation-openai
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
                        Configure OpenTelemetry to auto-instrument OpenAI SDK calls and export traces to Insights.
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
                                `,
                            },
                            {
                                language: 'typescript',
                                file: 'Node',
                                code: dedent`
                                    import { NodeSDK } from '@opentelemetry/sdk-node'
                                    import { resourceFromAttributes } from '@opentelemetry/resources'
                                    import { InsightsSpanProcessor } from '@hanzo/ai/otel'
                                    import { OpenAIInstrumentation } from '@opentelemetry/instrumentation-openai'

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
                                      instrumentations: [new OpenAIInstrumentation()],
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
            title: 'Call Portkey',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Now, when you call Portkey with the OpenAI SDK, Insights automatically captures `$ai_generation`
                        events via the OpenTelemetry instrumentation.
                    </Markdown>

                    <CodeBlock
                        blocks={[
                            {
                                language: 'python',
                                file: 'Python',
                                code: dedent`
                                    import openai
                                    from portkey_ai import PORTKEY_GATEWAY_URL

                                    client = openai.OpenAI(
                                        base_url=PORTKEY_GATEWAY_URL,
                                        api_key="<portkey_api_key>",
                                    )

                                    response = client.chat.completions.create(
                                        model="@<integration-slug>/gpt-5-mini",
                                        messages=[
                                            {"role": "user", "content": "Tell me a fun fact about mascots"}
                                        ],
                                    )

                                    print(response.choices[0].message.content)
                                `,
                            },
                            {
                                language: 'typescript',
                                file: 'Node',
                                code: dedent`
                                    import OpenAI from 'openai'
                                    import { PORTKEY_GATEWAY_URL } from 'portkey-ai'

                                    const client = new OpenAI({
                                      baseURL: PORTKEY_GATEWAY_URL,
                                      apiKey: '<portkey_api_key>',
                                    })

                                    const response = await client.chat.completions.create({
                                      model: '@<integration-slug>/gpt-5-mini',
                                      messages: [{ role: 'user', content: 'Tell me a fun fact about mascots' }],
                                    })

                                    console.log(response.choices[0].message.content)
                                `,
                            },
                        ]}
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

export const PortkeyInstallation = createInstallation(getPortkeySteps)
