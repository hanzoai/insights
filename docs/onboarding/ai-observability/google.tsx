import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/shared/OnboardingDocsContentWrapper'

import { StepDefinition } from '../steps'

export const getGoogleSteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
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
                            [Node.js](https://github.com/Insights/insights-js/tree/main/examples/example-ai-gemini) and
                            [Python](https://github.com/Insights/insights-python/tree/main/examples/example-ai-gemini)
                            examples on GitHub. If you're using the Insights SDK wrapper instead of OpenTelemetry, see
                            the [Node.js
                            wrapper](https://github.com/Insights/insights-js/tree/e08ff1be/examples/example-ai-gemini) and
                            [Python
                            wrapper](https://github.com/Insights/insights-python/tree/0fdbc2e9/examples/example-ai-gemini)
                            examples.
                        </Markdown>
                    </CalloutBox>

                    <Markdown>
                        Install the OpenTelemetry SDK, the Google Gen AI instrumentation, and the Google Gen AI SDK.
                    </Markdown>

                    <CodeBlock
                        blocks={[
                            {
                                language: 'bash',
                                file: 'Python',
                                code: dedent`
                                    pip install google-genai opentelemetry-sdk "insights[otel]" opentelemetry-instrumentation-google-generativeai
                                `,
                            },
                            {
                                language: 'bash',
                                file: 'Node',
                                code: dedent`
                                    npm install @google/genai @hanzo/ai @opentelemetry/sdk-node @opentelemetry/resources @traceloop/instrumentation-google-generativeai
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
                        Configure OpenTelemetry to auto-instrument Google Gen AI SDK calls and export traces to Insights.
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
                                    from opentelemetry.instrumentation.google_generativeai import GoogleGenerativeAiInstrumentor

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

                                    GoogleGenerativeAiInstrumentor().instrument()
                                `,
                            },
                            {
                                language: 'typescript',
                                file: 'Node',
                                code: dedent`
                                    import { NodeSDK } from '@opentelemetry/sdk-node'
                                    import { resourceFromAttributes } from '@opentelemetry/resources'
                                    import { InsightsSpanProcessor } from '@hanzo/ai/otel'
                                    import { GenAIInstrumentation } from '@traceloop/instrumentation-google-generativeai'

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
                                      instrumentations: [new GenAIInstrumentation()],
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
            title: 'Call Google Gen AI LLMs',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Now, when you use the Google Gen AI SDK to call Gemini, Insights automatically captures
                        `$ai_generation` events via the OpenTelemetry instrumentation.
                    </Markdown>

                    <CodeBlock
                        blocks={[
                            {
                                language: 'python',
                                file: 'Python',
                                code: dedent`
                                    from google import genai

                                    client = genai.Client(api_key="your_gemini_api_key")

                                    response = client.models.generate_content(
                                        model="gemini-2.5-flash",
                                        contents=[{"role": "user", "parts": [{"text": "Tell me a fun fact about mascots"}]}],
                                    )

                                    print(response.text)
                                `,
                            },
                            {
                                language: 'typescript',
                                file: 'Node',
                                code: dedent`
                                    import { GoogleGenAI } from '@google/genai'

                                    const client = new GoogleGenAI({ apiKey: 'your_gemini_api_key' })

                                    const response = await client.models.generateContent({
                                      model: 'gemini-2.5-flash',
                                      contents: 'Tell me a fun fact about mascots',
                                    })

                                    console.log(response.text)
                                `,
                            },
                        ]}
                    />

                    <Blockquote>
                        <Markdown>
                            {dedent`
                                **Note:** This integration also works with Vertex AI via Google Cloud Platform. Initialize the Google Gen AI client with \`vertexai=True, project=..., location=...\` (Python) or \`{ vertexai: true, project: '...', location: '...' }\` (Node) and the OpenTelemetry instrumentation will capture those calls the same way.
                            `}
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
        {
            title: 'Capture embeddings',
            badge: 'optional',
            content: (
                <>
                    <Markdown>
                        Insights can also capture embedding generations as `$ai_embedding` events. The OpenTelemetry
                        instrumentation automatically captures these when you use the `embed_content` API:
                    </Markdown>

                    <CodeBlock
                        blocks={[
                            {
                                language: 'python',
                                file: 'Python',
                                code: dedent`
                                    response = client.models.embed_content(
                                        model="gemini-embedding-001",
                                        contents="The quick brown fox",
                                    )
                                `,
                            },
                            {
                                language: 'typescript',
                                file: 'Node',
                                code: dedent`
                                    const response = await client.models.embedContent({
                                      model: 'gemini-embedding-001',
                                      contents: 'The quick brown fox',
                                    })
                                `,
                            },
                        ]}
                    />
                </>
            ),
        },
    ]
}

export const GoogleInstallation = createInstallation(getGoogleSteps)
