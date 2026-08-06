import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/shared/OnboardingDocsContentWrapper'

import { StepDefinition } from '../steps'

export const getVercelAISteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
    const { CodeBlock, Markdown, Blockquote, dedent, snippets } = ctx

    const NotableGenerationProperties = snippets?.NotableGenerationProperties

    return [
        {
            title: 'Install dependencies',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Install the Insights AI package, the Vercel AI SDK, the OpenTelemetry SDK, and Zod for defining
                        tool schemas.
                    </Markdown>

                    <CodeBlock
                        language="bash"
                        code={dedent`
                            npm install @hanzo/ai @ai-sdk/openai ai @opentelemetry/sdk-node @opentelemetry/resources zod
                        `}
                    />
                </>
            ),
        },
        {
            title: 'Set up the OpenTelemetry exporter',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Initialize the OpenTelemetry SDK with Insights's `InsightsSpanProcessor`. This sends `gen_ai.*`
                        spans directly to Insights's OTLP ingestion endpoint. Insights converts these into
                        `$ai_generation` events automatically.
                    </Markdown>

                    <CodeBlock
                        language="typescript"
                        code={dedent`
                            import { NodeSDK } from '@opentelemetry/sdk-node'
                            import { resourceFromAttributes } from '@opentelemetry/resources'
                            import { InsightsSpanProcessor } from '@hanzo/ai/otel'

                            const sdk = new NodeSDK({
                              resource: resourceFromAttributes({
                                'service.name': 'my-app',
                              }),
                              spanProcessors: [
                                new InsightsSpanProcessor({
                                  apiKey: '<ph_project_token>',
                                  host: '<ph_client_api_host>',
                                }),
                              ],
                            })
                            sdk.start()
                        `}
                    />
                </>
            ),
        },
        {
            title: 'Call Vercel AI with telemetry enabled',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        {dedent`
                            Pass \`experimental_telemetry\` to your Vercel AI SDK calls. The \`insights_distinct_id\`
                            metadata field links events to a specific user in Insights. Define \`tools\` the same way
                            you always would, with an \`execute\` function, as \`get_weather\` does below.
                        `}
                    </Markdown>

                    <CodeBlock
                        language="typescript"
                        code={dedent`
                            import { generateText, tool, stepCountIs } from 'ai'
                            import { openai } from '@ai-sdk/openai'
                            import { z } from 'zod'

                            const result = await generateText({
                              model: openai('gpt-5-mini'),
                              prompt: "What's the weather in Paris?",
                              tools: {
                                get_weather: tool({
                                  description: 'Get the weather for a city',
                                  inputSchema: z.object({ city: z.string() }),
                                  execute: async ({ city }) => \`It's always sunny in \${city}!\`,
                                }),
                              },
                              stopWhen: stepCountIs(5), // let the model see the tool result and respond
                              experimental_telemetry: {
                                isEnabled: true,
                                functionId: 'my-ai-function',
                                metadata: {
                                  insights_distinct_id: 'user_123', // optional
                                  insights_environment: 'production', // custom property: sets "environment" on the event
                                  $ai_session_id: 'conversation-abc', // optional: groups calls into one session
                                },
                              },
                            })

                            console.log(result.text)
                        `}
                    />

                    <Blockquote>
                        <Markdown>
                            **Note:** If you want to capture LLM events anonymously, omit the `insights_distinct_id`
                            metadata field. See our docs on [anonymous vs identified
                            events](https://hanzo.ai/docs/data/anonymous-vs-identified-events) to learn more.
                        </Markdown>
                    </Blockquote>

                    <Blockquote>
                        <Markdown>
                            **Custom properties:** Prefix any telemetry metadata field with `insights_` to attach it to
                            the `$ai_generation` event as a custom property. Insights strips the prefix, so
                            `insights_environment` becomes an `environment` property you can filter and break down by.
                            Insights does not capture other metadata fields.
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

export const VercelAIInstallation = createInstallation(getVercelAISteps)
