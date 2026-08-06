import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/shared/OnboardingDocsContentWrapper'

import { StepDefinition } from '../steps'

export const getMastraSteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
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
                            See the complete [Node.js
                            example](https://github.com/Insights/insights-js/tree/main/examples/example-ai-mastra) on
                            GitHub. If you're using the Insights SDK wrapper instead, see the [Node.js wrapper
                            example](https://github.com/Insights/insights-js/tree/e08ff1be/examples/example-ai-mastra).
                        </Markdown>
                    </CalloutBox>

                    <Markdown>
                        Install Mastra with the official `@mastra/insights` exporter. Mastra's observability system sends
                        traces to Insights as `$ai_generation` events automatically.
                    </Markdown>

                    <CodeBlock
                        language="bash"
                        code={dedent`
                            npm install @mastra/core @mastra/observability @mastra/insights
                        `}
                    />
                </>
            ),
        },
        {
            title: 'Configure Mastra with the Insights exporter',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Initialize Mastra with an `Observability` config that uses the `InsightsExporter`. Pass your
                        Insights project token and host from [your project
                        settings](https://app.hanzo.ai/settings/project).
                    </Markdown>

                    <CodeBlock
                        language="typescript"
                        code={dedent`
                            import { Mastra } from '@mastra/core'
                            import { Agent } from '@mastra/core/agent'
                            import { Observability } from '@mastra/observability'
                            import { InsightsExporter } from '@mastra/insights'

                            const weatherAgent = new Agent({
                              id: 'weather-agent',
                              name: 'Weather Agent',
                              instructions: 'You are a helpful assistant with access to weather data.',
                              model: { id: 'openai/gpt-4o-mini' },
                            })

                            const mastra = new Mastra({
                              agents: { weatherAgent },
                              observability: new Observability({
                                configs: {
                                  insights: {
                                    serviceName: 'my-app',
                                    exporters: [
                                      new InsightsExporter({
                                        apiKey: '<ph_project_token>',
                                        host: '<ph_client_api_host>',
                                        defaultDistinctId: 'user_123', // fallback if no userId in metadata
                                      }),
                                    ],
                                  },
                                },
                              }),
                            })
                        `}
                    />
                </>
            ),
        },
        {
            title: 'Run your agent',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Use Mastra as normal. The `InsightsExporter` automatically captures `$ai_generation` events for
                        each LLM call, including token usage, cost, latency, and the full conversation.
                    </Markdown>

                    <Markdown>
                        Pass `tracingOptions.metadata` to `generate()` to attach per-request metadata. The `userId`
                        field maps to Insights's distinct ID, `sessionId` maps to `$ai_session_id`, and any other keys
                        are passed through as custom event properties.
                    </Markdown>

                    <CodeBlock
                        language="typescript"
                        code={dedent`
                            const agent = mastra.getAgent('weatherAgent')

                            const result = await agent.generate("What's the weather in Dublin?", {
                              tracingOptions: {
                                metadata: {
                                  userId: 'user_123', // becomes distinct_id
                                  sessionId: 'session_abc', // becomes $ai_session_id
                                  conversation_id: 'abc-123', // custom property
                                },
                              },
                            })

                            console.log(result.text)
                        `}
                    />

                    <Blockquote>
                        <Markdown>
                            **Note:** If you want to capture LLM events anonymously, omit `userId` from
                            `tracingOptions.metadata` and don't set `defaultDistinctId`. See our docs on [anonymous vs
                            identified events](https://hanzo.ai/docs/data/anonymous-vs-identified-events) to learn
                            more.
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

export const MastraInstallation = createInstallation(getMastraSteps)
