import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/OnboardingDocsContentWrapper'

import { StepDefinition } from '../steps'

export const getGoogleSteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
    const { CodeBlock, CalloutBox, Markdown, Blockquote, dedent, snippets } = ctx
    const NotableGenerationProperties = snippets?.NotableGenerationProperties

    return [
        {
            title: 'Install the Insights SDK',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Setting up analytics starts with installing the Insights SDK for your language. LLM analytics works best with our Python and Node SDKs.
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
            title: 'Install the Google Gen AI SDK',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Install the Google Gen AI SDK. The Insights SDK instruments your LLM calls by wrapping the Google Gen
                        AI client. The Insights SDK **does not** proxy your calls.
                    </Markdown>

                    <CodeBlock
                        blocks={[
                            {
                                language: 'bash',
                                file: 'Python',
                                code: dedent`
                                    pip install google-genai
                                `,
                            },
                            {
                                language: 'bash',
                                file: 'Node',
                                code: dedent`
                                    npm install @google/genai
                                `,
                            },
                        ]}
                    />

                    <CalloutBox type="fyi" icon="IconInfo" title="Proxy note">
                        <Markdown>
                            These SDKs **do not** proxy your calls. They only fire off an async call to Insights in the background to send the data.

                            You can also use LLM analytics with other SDKs or our API, but you will need to capture the data in the right format. See the schema in the [manual capture section](https://hanzo.ai/docs/llm-analytics/installation/manual-capture) for more details.
                        </Markdown>
                    </CalloutBox>
                </>
            ),
        },
        {
            title: 'Initialize Insights and Google Gen AI client',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Initialize Insights with your project API key and host from [your project settings](https://insights.hanzo.ai/settings/project), then pass it to our Google Gen AI wrapper.
                    </Markdown>

                    <CodeBlock
                        blocks={[
                            {
                                language: 'python',
                                file: 'Python',
                                code: dedent`
                                    from insights.ai.gemini import Client
                                    from insights import Insights

                                    insights = Insights(
                                        "<ph_project_api_key>",
                                        host="<ph_client_api_host>"
                                    )

                                    client = Client(
                                        api_key="...", # Replace with your Gemini API key
                                        insights_client=insights # This is an optional parameter. If it is not provided, a default client will be used.
                                    )
                                `,
                            },
                            {
                                language: 'typescript',
                                file: 'Node',
                                code: dedent`
                                    import { GoogleGenAI } from '@hanzo/ai'
                                    import { Insights } from 'insights-node'

                                    const phClient = new Insights(
                                        '<ph_project_api_key>',
                                        { host: '<ph_client_api_host>' }
                                    )

                                    const client = new GoogleGenAI({
                                        apiKey: '...', // Replace with your Gemini API key
                                        insights: phClient
                                    })
                                `,
                            },
                        ]}
                    />

                    <Blockquote>
                        <Markdown>
                            **Note:** This integration also works with Vertex AI via Google Cloud Platform. You can use the Google Gen AI SDK's Vertex AI client with Insights analytics.
                        </Markdown>
                    </Blockquote>

                    <Markdown>
                        **Vertex AI code example:**
                    </Markdown>

                    <CodeBlock
                        blocks={[
                            {
                                language: 'python',
                                file: 'Python',
                                code: dedent`
                                    from insights import Insights
                                    from insights.ai.gemini import Client

                                    # Initialize Insights
                                    insights = Insights(
                                        project_api_key="<ph_project_api_key>",
                                        host="<ph_client_api_host>"
                                    )

                                    # Initialize Gemini client with Vertex AI
                                    client = Client(
                                        vertexai=True,
                                        project="your-gcp-project-id",
                                        location="us-central1",
                                        insights_client=insights,
                                        insights_distinct_id="user-123"
                                    )

                                    # Use it
                                    response = client.models.generate_content(
                                        model="gemini-2.0-flash",
                                        contents=["Hello, world!"]
                                    )

                                    print(response.text)
                                `,
                            },
                            {
                                language: 'typescript',
                                file: 'Node',
                                code: dedent`
                                    import { Insights } from 'insights-node'
                                    import { InsightsGoogleGenAI } from '@hanzo/ai'

                                    // Initialize Insights
                                    const insights = new Insights(
                                      '<ph_project_api_key>',
                                      { host: '<ph_client_api_host>' }
                                    )

                                    // Initialize Gemini client with Vertex AI
                                    const client = new InsightsGoogleGenAI({
                                      vertexai: true,
                                      project: 'your-gcp-project-id',
                                      location: 'us-central1',
                                      insights: insights
                                    })

                                    // Use it
                                    const response = await client.models.generateContent({
                                      model: 'gemini-2.0-flash',
                                      contents: 'Hello, world!',
                                      insightsDistinctId: 'user-123'
                                    })

                                    console.log(response.text)
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
                        Now, when you use the Google Gen AI SDK to call LLMs, Insights automatically captures an `$ai_generation` event.

                        You can enrich the event with additional data such as the trace ID, distinct ID, custom properties, groups, and privacy mode options.
                    </Markdown>

                    <CodeBlock
                        blocks={[
                            {
                                language: 'python',
                                file: 'Python',
                                code: dedent`
                                    response = client.models.generate_content(
                                        model="gemini-2.5-flash",
                                        contents=["Tell me a fun fact about mascots"],
                                        insights_distinct_id="user_123", # optional
                                        insights_trace_id="trace_123", # optional
                                        insights_properties={"conversation_id": "abc123", "paid": True}, # optional
                                        insights_groups={"company": "company_id_in_your_db"},  # optional
                                        insights_privacy_mode=False # optional
                                    )

                                    print(response.text)
                                `,
                            },
                            {
                                language: 'typescript',
                                file: 'Node',
                                code: dedent`
                                    const response = await client.models.generateContent({
                                      model: "gemini-2.5-flash",
                                      contents: ["Tell me a fun fact about mascots"],
                                      insightsDistinctId: "user_123", // optional
                                      insightsTraceId: "trace_123", // optional
                                      insightsProperties: { conversationId: "abc123", paid: true }, // optional
                                      insightsGroups: { company: "company_id_in_your_db" }, // optional
                                      insightsPrivacyMode: false // optional
                                    })

                                    console.log(response.text)
                                    phClient.shutdown()
                                `,
                            },
                        ]}
                    />

                    <Blockquote>
                        <Markdown>
                            **Note:** If you want to capture LLM events anonymously, **don't** pass a distinct ID to the request. See our docs on [anonymous vs identified events](https://hanzo.ai/docs/data/anonymous-vs-identified-events) to learn more.
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

export const GoogleInstallation = createInstallation(getGoogleSteps)
