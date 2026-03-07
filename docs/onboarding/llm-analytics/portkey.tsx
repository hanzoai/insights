import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/OnboardingDocsContentWrapper'
import { StepDefinition } from '../steps'

export const getPortkeySteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
    const { CodeBlock, CalloutBox, Markdown, Blockquote, dedent, snippets } = ctx

    const NotableGenerationProperties = snippets?.NotableGenerationProperties

    return [
        {
            title: 'Install the Insights SDK',
            badge: 'required',
            content: (
                <>
                    <CalloutBox type="fyi" icon="IconInfo" title="About Portkey">
                        <Markdown>
                            Portkey acts as an AI gateway that routes requests to 250+ LLM providers. The model string format (`@integration-slug/model`) determines which provider to use, where the slug is the name you chose when setting up the integration in Portkey.
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
            title: 'Install the OpenAI and Portkey SDKs',
            badge: 'required',
            content: (
                <>
                    <Markdown>Install the OpenAI and Portkey SDKs. The Insights SDK instruments your LLM calls by wrapping the OpenAI client. The Insights SDK **does not** proxy your calls.</Markdown>

                    <CodeBlock
                        blocks={[
                            {
                                language: 'bash',
                                file: 'Python',
                                code: dedent`
                                    pip install openai portkey-ai
                                `,
                            },
                            {
                                language: 'bash',
                                file: 'Node',
                                code: dedent`
                                    npm install openai portkey-ai
                                `,
                            },
                        ]}
                    />
                </>
            ),
        },
        {
            title: 'Initialize Insights and Portkey-routed client',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Initialize Insights with your project API key and host from [your project
                        settings](https://insights.hanzo.ai/settings/project), then pass it along with the Portkey gateway
                        URL and your Portkey API key to our OpenAI wrapper.
                    </Markdown>

                    <CodeBlock
                        blocks={[
                            {
                                language: 'python',
                                file: 'Python',
                                code: dedent`
                                    from insights.ai.openai import OpenAI
                                    from insights import Insights
                                    from portkey_ai import PORTKEY_GATEWAY_URL

                                    insights = Insights(
                                        "<ph_project_api_key>",
                                        host="<ph_client_api_host>"
                                    )

                                    client = OpenAI(
                                        base_url=PORTKEY_GATEWAY_URL,
                                        api_key="<portkey_api_key>",
                                        insights_client=insights
                                    )
                                `,
                            },
                            {
                                language: 'typescript',
                                file: 'Node',
                                code: dedent`
                                    import { OpenAI } from '@hanzo/ai'
                                    import { Insights } from 'insights-node'
                                    import { PORTKEY_GATEWAY_URL } from 'portkey-ai'

                                    const phClient = new Insights(
                                      '<ph_project_api_key>',
                                      { host: '<ph_client_api_host>' }
                                    );

                                    const openai = new OpenAI({
                                      baseURL: PORTKEY_GATEWAY_URL,
                                      apiKey: '<portkey_api_key>',
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
            title: 'Call Portkey',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Now, when you call Portkey with the OpenAI SDK, Insights automatically captures an
                        `$ai_generation` event. You can also capture or modify additional properties with the distinct ID,
                        trace ID, properties, groups, and privacy mode parameters.
                    </Markdown>

                    <CodeBlock
                        blocks={[
                            {
                                language: 'python',
                                file: 'Python',
                                code: dedent`
                                    response = client.chat.completions.create(
                                        model="@<integration-slug>/gpt-4o-mini",
                                        messages=[
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
                                    const completion = await openai.chat.completions.create({
                                        model: "@<integration-slug>/gpt-4o-mini",
                                        messages: [{ role: "user", content: "Tell me a fun fact about mascots" }],
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
                            - This works with responses where \`stream=True\`.
                            - If you want to capture LLM events anonymously, **don't** pass a distinct ID to the request.
                            - The \`@<integration-slug>\` prefix is the name you chose when setting up the integration in your [Portkey dashboard](https://app.portkey.ai/).

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

export const PortkeyInstallation = createInstallation(getPortkeySteps)
