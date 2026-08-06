import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/shared/OnboardingDocsContentWrapper'

import { StepDefinition } from '../steps'

export const getAzureOpenAISteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
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
                            [Node.js](https://github.com/Insights/insights-js/tree/e08ff1be/examples/example-ai-azure-openai)
                            and
                            [Python](https://github.com/Insights/insights-python/tree/7223c52/examples/example-ai-azure-openai)
                            examples on GitHub.
                        </Markdown>
                    </CalloutBox>

                    <Markdown>Install the Insights SDK and the OpenAI SDK.</Markdown>

                    <CodeBlock
                        blocks={[
                            {
                                language: 'bash',
                                file: 'Python',
                                code: dedent`
                                    pip install insights openai
                                `,
                            },
                            {
                                language: 'bash',
                                file: 'Node',
                                code: dedent`
                                    npm install @hanzo/ai insights-node openai
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
                            Create a Insights client, then swap in Insights's Azure OpenAI wrapper.
                        `}
                    </Markdown>

                    <CodeBlock
                        blocks={[
                            {
                                language: 'python',
                                file: 'Python',
                                code: dedent`
                                    from insights import Insights
                                    from insights.ai.openai import AzureOpenAI
                                    import time, uuid, json

                                    insights = Insights("<ph_project_token>", host="<ph_client_api_host>")

                                    client = AzureOpenAI(
                                        api_key="<azure_openai_api_key>",
                                        api_version="2024-10-21",
                                        azure_endpoint="https://<your-resource>.openai.azure.com",
                                        insights_client=insights,
                                    )
                                `,
                            },
                            {
                                language: 'typescript',
                                file: 'Node',
                                code: dedent`
                                    import { AzureOpenAI } from '@hanzo/ai/openai'
                                    import { Insights } from 'insights-node'

                                    const insights = new Insights('<ph_project_token>', { host: '<ph_client_api_host>' })

                                    const client = new AzureOpenAI({
                                      apiKey: '<azure_openai_api_key>',
                                      apiVersion: '2024-10-21',
                                      endpoint: 'https://<your-resource>.openai.azure.com',
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
            title: 'Call Azure OpenAI',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        {dedent`
                            When you use the wrapped client to call Azure OpenAI, Insights automatically captures an
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

                                    response = client.responses.create(
                                        model="<your-deployment-name>",
                                        input=[{"role": "user", "content": "What's the weather in Paris?"}],
                                        tools=tools,
                                        insights_distinct_id="user_123",
                                        insights_trace_id=trace_id,
                                        insights_properties={
                                            "$ai_session_id": "conversation-abc",
                                            "$ai_provider": "azure",
                                        },
                                    )
                                `,
                            },
                            {
                                language: 'typescript',
                                file: 'Node',
                                code: dedent`
                                    const traceId = crypto.randomUUID()

                                    const response = await client.responses.create({
                                      model: '<your-deployment-name>',
                                      input: [{ role: 'user', content: "What's the weather in Paris?" }],
                                      tools,
                                      insightsDistinctId: 'user_123',
                                      insightsTraceId: traceId,
                                      insightsProperties: {
                                        $ai_session_id: 'conversation-abc',
                                        $ai_provider: 'azure',
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
                                    for item in response.output:
                                        if item.type != "function_call":
                                            continue

                                        start = time.time()
                                        result = run_tool(item.name, json.loads(item.arguments))

                                        insights.capture(
                                            distinct_id="user_123",
                                            event="$ai_span",
                                            properties={
                                                "$ai_trace_id": trace_id,
                                                "$ai_session_id": "conversation-abc",
                                                "$ai_span_id": str(uuid.uuid4()),
                                                "$ai_span_name": item.name,
                                                "$ai_input_state": item.arguments,
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
                                    for (const item of response.output) {
                                      if (item.type !== 'function_call') continue

                                      const start = Date.now()
                                      const result = await runTool(item.name, JSON.parse(item.arguments))

                                      insights.capture({
                                        distinctId: 'user_123',
                                        event: '$ai_span',
                                        properties: {
                                          $ai_trace_id: traceId,
                                          $ai_session_id: 'conversation-abc',
                                          $ai_span_id: crypto.randomUUID(),
                                          $ai_span_name: item.name,
                                          $ai_input_state: item.arguments,
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
    ]
}

export const AzureOpenAIInstallation = createInstallation(getAzureOpenAISteps)
