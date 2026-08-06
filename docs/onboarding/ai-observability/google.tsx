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
                            examples on GitHub.
                        </Markdown>
                    </CalloutBox>

                    <Markdown>Install the Insights SDK and the Google Gen AI SDK.</Markdown>

                    <CodeBlock
                        blocks={[
                            {
                                language: 'bash',
                                file: 'Python',
                                code: dedent`
                                    pip install insights google-genai
                                `,
                            },
                            {
                                language: 'bash',
                                file: 'Node',
                                code: dedent`
                                    npm install @hanzo/ai insights-node @google/genai
                                `,
                            },
                        ]}
                    />
                </>
            ),
        },
        {
            title: 'Configure Insights',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        {dedent`
                            Create a Insights client, then swap in Insights's Google Gen AI wrapper.
                        `}
                    </Markdown>

                    <CodeBlock
                        blocks={[
                            {
                                language: 'python',
                                file: 'Python',
                                code: dedent`
                                    from insights import Insights
                                    from insights.ai.gemini import Client
                                    import time, uuid
                                    from google.genai import types

                                    insights = Insights("<ph_project_token>", host="<ph_client_api_host>")

                                    client = Client(
                                        api_key="your_gemini_api_key",
                                        insights_client=insights,
                                    )
                                `,
                            },
                            {
                                language: 'typescript',
                                file: 'Node',
                                code: dedent`
                                    import { GoogleGenAI } from '@hanzo/ai/gemini'
                                    import { Insights } from 'insights-node'

                                    const insights = new Insights('<ph_project_token>', { host: '<ph_client_api_host>' })

                                    const client = new GoogleGenAI({
                                      apiKey: 'your_gemini_api_key',
                                      insights,
                                    })
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
                        {dedent`
                            When you use the wrapped client to call Gemini, Insights automatically captures an
                            \`$ai_generation\` event.
                        `}
                    </Markdown>

                    <CodeBlock
                        blocks={[
                            {
                                language: 'python',
                                file: 'Python',
                                code: dedent`
                                    trace_id = str(uuid.uuid4())

                                    response = client.models.generate_content(
                                        model="gemini-2.5-flash",
                                        contents=[{"role": "user", "parts": [{"text": "What's the weather in Paris?"}]}],
                                        config=types.GenerateContentConfig(tools=tools),
                                        insights_distinct_id="user_123",
                                        insights_trace_id=trace_id,
                                        insights_properties={
                                            "$ai_session_id": "conversation-abc",
                                        },
                                    )
                                `,
                            },
                            {
                                language: 'typescript',
                                file: 'Node',
                                code: dedent`
                                    const traceId = crypto.randomUUID()

                                    const response = await client.models.generateContent({
                                      model: 'gemini-2.5-flash',
                                      contents: "What's the weather in Paris?",
                                      config: { tools },
                                      insightsDistinctId: 'user_123',
                                      insightsTraceId: traceId,
                                      insightsProperties: {
                                        $ai_session_id: 'conversation-abc',
                                      },
                                    })
                                `,
                            },
                        ]}
                    />

                    <Blockquote>
                        <Markdown>
                            **Note:** If you want to capture LLM events anonymously, omit `insights_distinct_id` from the
                            call. See our docs on [anonymous vs identified
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
            title: 'Capture tool calls as spans',
            badge: 'optional',
            content: (
                <>
                    <Markdown>
                        {dedent`
                            For standard responses, the insights client captures it as a generation. For all tool
                            calls, you must manually capture them as \`$ai_span\` events.
                        `}
                    </Markdown>

                    <CodeBlock
                        blocks={[
                            {
                                language: 'python',
                                file: 'Python',
                                code: dedent`
                                    for call in response.function_calls or []:
                                        start = time.time()
                                        result = run_tool(call.name, call.args)

                                        insights.capture(
                                            distinct_id="user_123",
                                            event="$ai_span",
                                            properties={
                                                "$ai_trace_id": trace_id,
                                                "$ai_session_id": "conversation-abc",
                                                "$ai_span_id": str(uuid.uuid4()),
                                                "$ai_span_name": call.name,
                                                "$ai_input_state": call.args,
                                                "$ai_output_state": result,
                                                "$ai_latency": time.time() - start,
                                            },
                                        )
                                `,
                            },
                            {
                                language: 'typescript',
                                file: 'Node',
                                code: dedent`
                                    for (const call of response.functionCalls ?? []) {
                                      const start = Date.now()
                                      const result = await runTool(call.name, call.args)

                                      insights.capture({
                                        distinctId: 'user_123',
                                        event: '$ai_span',
                                        properties: {
                                          $ai_trace_id: traceId,
                                          $ai_session_id: 'conversation-abc',
                                          $ai_span_id: crypto.randomUUID(),
                                          $ai_span_name: call.name,
                                          $ai_input_state: call.args,
                                          $ai_output_state: result,
                                          $ai_latency: (Date.now() - start) / 1000,
                                        },
                                      })
                                    }
                                `,
                            },
                        ]}
                    />

                    <Markdown>
                        {dedent`
                            See [spans](https://hanzo.ai/docs/ai-observability/spans) for the full list of span
                            properties.
                        `}
                    </Markdown>
                </>
            ),
        },
        {
            title: 'Capture embeddings',
            badge: 'optional',
            content: (
                <>
                    <Markdown>
                        Insights can also capture embedding generations as `$ai_embedding` events. The wrapped client
                        captures these automatically when you use the `embed_content` API:
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
