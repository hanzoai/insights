import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/OnboardingDocsContentWrapper'
import { StepDefinition } from '../steps'

export const getOpenRouterSteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
    const { CodeBlock, CalloutBox, Markdown, Blockquote, dedent, snippets } = ctx

    const NotableGenerationProperties = snippets?.NotableGenerationProperties

    return [
        {
            title: 'Install the Insights SDK',
            badge: 'required',
            content: (
                <>
                    <CalloutBox type="fyi" icon="IconInfo" title="Alternative: OpenRouter Broadcast">
                        <Markdown>
                            OpenRouter also offers a native [Broadcast feature](https://openrouter.ai/docs/guides/features/broadcast/insights) that can automatically send LLM analytics data to Insights without requiring SDK instrumentation. This is a simpler option if you don't need the additional customization that our SDK provides.
                        </Markdown>
                    </CalloutBox>

                    <Markdown>
                        Setting up analytics starts with installing the Insights SDK for your language. LLM analytics works
                        best with our Python and Node SDKs.
                    </Markdown>

                    <CodeBlock
                        blocks={[
                            {
                                language: 'bash',
                                file: 'Python',
                                code: dedent`
                                    pip install insights
                                `,
                            },
                            {
                                language: 'bash',
                                file: 'Node',
                                code: dedent`
                                    npm install @hanzo/ai insights-node
                                `,
                            },
                        ]}
                    />
                </>
            ),
        },
        {
            title: 'Install the OpenAI SDK',
            badge: 'required',
            content: (
                <>
                    <Markdown>Install the OpenAI SDK. The Insights SDK instruments your LLM calls by wrapping the OpenAI client. The Insights SDK **does not** proxy your calls.</Markdown>

                    <CodeBlock
                        blocks={[
                            {
                                language: 'bash',
                                file: 'Python',
                                code: dedent`
                                    pip install openai
                                `,
                            },
                            {
                                language: 'bash',
                                file: 'Node',
                                code: dedent`
                                    npm install openai
                                `,
                            },
                        ]}
                    />
                </>
            ),
        },
        {
            title: 'Initialize Insights and OpenAI client',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        We call OpenRouter through the OpenAI client and generate a response. We'll use Insights's OpenAI
                        provider to capture all the details of the call. Initialize Insights with your Insights project API
                        key and host from [your project settings](https://insights.hanzo.ai/settings/project), then pass the
                        Insights client along with the OpenRouter config (the base URL and API key) to our OpenAI wrapper.
                    </Markdown>

                    <CodeBlock
                        blocks={[
                            {
                                language: 'python',
                                file: 'Python',
                                code: dedent`
                                    from insights.ai.openai import OpenAI
                                    from insights import Insights

                                    insights = Insights(
                                        "<ph_project_api_key>",
                                        host="<ph_client_api_host>"
                                    )

                                    client = OpenAI(
                                        base_url="https://openrouter.ai/api/v1",
                                        api_key="<openrouter_api_key>",
                                        insights_client=insights  # This is an optional parameter. If it is not provided, a default client will be used.
                                    )
                                `,
                            },
                            {
                                language: 'typescript',
                                file: 'Node',
                                code: dedent`
                                    import { OpenAI } from '@hanzo/ai'
                                    import { Insights } from 'insights-node'

                                    const phClient = new Insights(
                                      '<ph_project_api_key>',
                                      { host: '<ph_client_api_host>' }
                                    );

                                    const openai = new OpenAI({
                                      baseURL: 'https://openrouter.ai/api/v1',
                                      apiKey: '<openrouter_api_key>',
                                      insights: phClient,
                                    });

                                    // ... your code here ...

                                    // IMPORTANT: Shutdown the client when you're done to ensure all events are sent
                                    phClient.shutdown()
                                `,
                            },
                        ]}
                    />

                    <Blockquote>
                        <Markdown>**Note:** This also works with the `AsyncOpenAI` client.</Markdown>
                    </Blockquote>

                    <CalloutBox type="fyi" icon="IconInfo" title="Proxy note">
                        <Markdown>
                            These SDKs **do not** proxy your calls. They only fire off an async call to Insights in the
                            background to send the data. You can also use LLM analytics with other SDKs or our API, but you
                            will need to capture the data in the right format. See the schema in the [manual capture
                            section](https://hanzo.ai/docs/llm-analytics/installation/manual-capture) for more details.
                        </Markdown>
                    </CalloutBox>
                </>
            ),
        },
        {
            title: 'Call OpenRouter',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Now, when you call OpenRouter with the OpenAI SDK, Insights automatically captures an
                        `$ai_generation` event. You can also capture or modify additional properties with the distinct ID,
                        trace ID, properties, groups, and privacy mode parameters.
                    </Markdown>

                    <CodeBlock
                        blocks={[
                            {
                                language: 'python',
                                file: 'Python',
                                code: dedent`
                                    response = client.responses.create(
                                        model="gpt-5-mini",
                                        input=[
                                            {"role": "user", "content": "Tell me a fun fact about mascots"}
                                        ],
                                        insights_distinct_id="user_123", # optional
                                        insights_trace_id="trace_123", # optional
                                        insights_properties={"conversation_id": "abc123", "paid": True}, # optional
                                        insights_groups={"company": "company_id_in_your_db"},  # optional
                                        insights_privacy_mode=False # optional
                                    )

                                    print(response.choices[0].message.content)
                                `,
                            },
                            {
                                language: 'typescript',
                                file: 'Node',
                                code: dedent`
                                    const completion = await openai.responses.create({
                                        model: "gpt-5-mini",
                                        input: [{ role: "user", content: "Tell me a fun fact about mascots" }],
                                        insightsDistinctId: "user_123", // optional
                                        insightsTraceId: "trace_123", // optional
                                        insightsProperties: { conversation_id: "abc123", paid: true }, // optional
                                        insightsGroups: { company: "company_id_in_your_db" }, // optional
                                        insightsPrivacyMode: false // optional
                                    });

                                    console.log(completion.choices[0].message.content)
                                `,
                            },
                        ]}
                    />

                    <Blockquote>
                        <Markdown>
                            {dedent`
                            **Notes:**
                            - We also support the old \`chat.completions\` API.
                            - This works with responses where \`stream=True\`.
                            - If you want to capture LLM events anonymously, **don't** pass a distinct ID to the request.

                            See our docs on [anonymous vs identified events](https://hanzo.ai/docs/data/anonymous-vs-identified-events) to learn more.
                            `}
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

export const OpenRouterInstallation = createInstallation(getOpenRouterSteps)
