import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/shared/OnboardingDocsContentWrapper'

import { StepDefinition } from '../steps'

export const getConvexSteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
    const { CodeBlock, CalloutBox, Markdown, dedent, snippets } = ctx

    const NotableGenerationProperties = snippets?.NotableGenerationProperties

    return [
        {
            title: 'Install dependencies',
            badge: 'required',
            content: (
                <>
                    <Markdown>Install the Insights AI package, the Vercel AI SDK, and the OpenTelemetry SDK.</Markdown>

                    <CodeBlock
                        language="bash"
                        code={dedent`
                            npm install @hanzo/ai @ai-sdk/openai ai @opentelemetry/sdk-trace-base @opentelemetry/resources @opentelemetry/api
                        `}
                    />
                </>
            ),
        },
        {
            title: 'Set environment variables',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Set your Insights project API key and host as Convex environment variables. You can find these in
                        your [project settings](https://app.hanzo.ai/settings/project).
                    </Markdown>

                    <CodeBlock
                        language="bash"
                        code={dedent`
                            npx convex env set POSTFN_PROJECT_TOKEN "<ph_project_token>"
                            npx convex env set POSTFN_HOST "<ph_client_api_host>"
                        `}
                    />

                    <Markdown>You also need your AI provider's API key (e.g. `OPENAI_API_KEY`):</Markdown>

                    <CodeBlock
                        language="bash"
                        code={dedent`
                            npx convex env set OPENAI_API_KEY "your_openai_api_key"
                        `}
                    />
                </>
            ),
        },
        {
            title: 'Capture LLM events with OpenTelemetry',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Create a Convex action that initializes a `BasicTracerProvider` with Insights's trace exporter
                        and enables telemetry on your AI SDK calls. The provider is initialized at module scope so it
                        persists across warm V8 isolate invocations. Await `provider.forceFlush()` before returning
                        because Convex may finish the action while the OTLP export is still pending.
                    </Markdown>

                    <CodeBlock
                        language="typescript"
                        code={dedent`
                            import { trace } from '@opentelemetry/api'
                            import { BasicTracerProvider, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base'
                            import { resourceFromAttributes } from '@opentelemetry/resources'
                            import { generateText } from 'ai'
                            import { openai } from '@ai-sdk/openai'
                            import { InsightsTraceExporter } from '@hanzo/ai/otel'
                            import { action } from './_generated/server'
                            import { v } from 'convex/values'

                            const provider = new BasicTracerProvider({
                              resource: resourceFromAttributes({
                                'service.name': 'my-convex-app',
                              }),
                              spanProcessors: [
                                new SimpleSpanProcessor(
                                  new InsightsTraceExporter({
                                    projectToken: process.env.POSTFN_PROJECT_TOKEN!,
                                    host: process.env.POSTFN_HOST,
                                  })
                                ),
                              ],
                            })
                            trace.setGlobalTracerProvider(provider)

                            export const generate = action({
                              args: {
                                prompt: v.string(),
                                distinctId: v.optional(v.string()),
                              },
                              handler: async (_ctx, args) => {
                                const distinctId = args.distinctId ?? 'anonymous'

                                const result = await generateText({
                                  model: openai('gpt-5-mini'),
                                  prompt: args.prompt,
                                  experimental_telemetry: {
                                    isEnabled: true,
                                    functionId: 'my-convex-action',
                                    metadata: {
                                      insights_distinct_id: distinctId,
                                    },
                                  },
                                })

                                await provider.forceFlush()

                                return { text: result.text, usage: result.usage }
                              },
                            })
                        `}
                    />

                    <CalloutBox type="fyi" icon="IconInfo" title="How this works">
                        <Markdown>
                            The `InsightsTraceExporter` sends OpenTelemetry `gen_ai.*` spans to Insights's OTLP ingestion
                            endpoint. Insights converts these into `$ai_generation` events automatically. The
                            `insights_distinct_id` metadata field links events to a specific user.
                        </Markdown>
                    </CalloutBox>
                </>
            ),
        },
        {
            title: 'Using Convex Agent',
            badge: 'optional',
            content: (
                <>
                    <Markdown>
                        If you're using `@convex-dev/agent`, pass `experimental_telemetry` to the agent's `generateText`
                        call:
                    </Markdown>

                    <CodeBlock
                        language="typescript"
                        code={dedent`
                            import { trace } from '@opentelemetry/api'
                            import { BasicTracerProvider, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base'
                            import { resourceFromAttributes } from '@opentelemetry/resources'
                            import { Agent } from '@convex-dev/agent'
                            import { openai } from '@ai-sdk/openai'
                            import { InsightsTraceExporter } from '@hanzo/ai/otel'
                            import { components } from './_generated/api'
                            import { action } from './_generated/server'
                            import { v } from 'convex/values'

                            const provider = new BasicTracerProvider({
                              resource: resourceFromAttributes({
                                'service.name': 'my-convex-app',
                              }),
                              spanProcessors: [
                                new SimpleSpanProcessor(
                                  new InsightsTraceExporter({
                                    projectToken: process.env.POSTFN_PROJECT_TOKEN!,
                                    host: process.env.POSTFN_HOST,
                                  })
                                ),
                              ],
                            })
                            trace.setGlobalTracerProvider(provider)

                            export const generate = action({
                              args: {
                                prompt: v.string(),
                                distinctId: v.optional(v.string()),
                              },
                              handler: async (ctx, args) => {
                                const distinctId = args.distinctId ?? 'anonymous'

                                const supportAgent = new Agent(components.agent, {
                                  name: 'support-agent',
                                  languageModel: openai('gpt-5-mini'),
                                  instructions: 'You are a helpful support agent.',
                                })

                                const { thread } = await supportAgent.createThread(ctx, {})

                                const result = await thread.generateText({
                                  prompt: args.prompt,
                                  experimental_telemetry: {
                                    isEnabled: true,
                                    functionId: 'convex-agent',
                                    metadata: {
                                      insights_distinct_id: distinctId,
                                    },
                                  },
                                })

                                await provider.forceFlush()

                                return { text: result.text, usage: result.totalUsage }
                              },
                            })
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

export const ConvexInstallation = createInstallation(getConvexSteps)
