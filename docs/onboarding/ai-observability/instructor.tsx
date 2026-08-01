import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/shared/OnboardingDocsContentWrapper'

import { StepDefinition } from '../steps'

export const getInstructorSteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
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
                            [Node.js](https://github.com/Insights/insights-js/tree/main/examples/example-ai-instructor)
                            and
                            [Python](https://github.com/Insights/insights-python/tree/master/examples/example-ai-instructor)
                            examples on GitHub. If you're using the Insights SDK wrapper instead of OpenTelemetry, see
                            the [Node.js
                            wrapper](https://github.com/Insights/insights-js/tree/e08ff1be/examples/example-ai-instructor)
                            and [Python
                            wrapper](https://github.com/Insights/insights-python/tree/7223c52/examples/example-ai-instructor)
                            examples.
                        </Markdown>
                    </CalloutBox>

                    <Markdown>Install the OpenTelemetry SDK, the OpenAI instrumentation, and Instructor.</Markdown>

                    <CodeBlock
                        blocks={[
                            {
                                language: 'bash',
                                file: 'Python',
                                code: dedent`
                                    pip install instructor openai opentelemetry-sdk "insights[otel]" opentelemetry-instrumentation-openai-v2
                                `,
                            },
                            {
                                language: 'bash',
                                file: 'Node',
                                code: dedent`
                                    npm install @instructor-ai/instructor openai zod @hanzo/ai @opentelemetry/sdk-node @opentelemetry/resources @opentelemetry/instrumentation-openai
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
            title: 'Extract structured data',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Use Instructor to extract structured data from LLM responses. Insights automatically captures an
                        `$ai_generation` event for each call made through the OpenAI SDK that Instructor wraps.
                    </Markdown>

                    <CodeBlock
                        blocks={[
                            {
                                language: 'python',
                                file: 'Python',
                                code: dedent`
                                    import instructor
                                    import openai
                                    from pydantic import BaseModel

                                    class User(BaseModel):
                                        name: str
                                        age: int

                                    client = instructor.from_openai(openai.OpenAI(api_key="your_openai_api_key"))

                                    user = client.chat.completions.create(
                                        model="gpt-4o-mini",
                                        response_model=User,
                                        messages=[{"role": "user", "content": "Extract: John is 30 years old"}],
                                    )

                                    print(user)
                                `,
                            },
                            {
                                language: 'typescript',
                                file: 'Node',
                                code: dedent`
                                    import OpenAI from 'openai'
                                    import Instructor from '@instructor-ai/instructor'
                                    import { z } from 'zod'

                                    const oai = new OpenAI({ apiKey: 'your_openai_api_key' })
                                    const client = Instructor({ client: oai, mode: 'TOOLS' })

                                    const UserSchema = z.object({
                                      name: z.string(),
                                      age: z.number(),
                                    })

                                    const user = await client.chat.completions.create({
                                      model: 'gpt-4o-mini',
                                      response_model: { schema: UserSchema, name: 'User' },
                                      messages: [{ role: 'user', content: 'Extract: John is 30 years old' }],
                                    })

                                    console.log(user)
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

export const InstructorInstallation = createInstallation(getInstructorSteps)
