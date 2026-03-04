import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/OnboardingDocsContentWrapper'
import { StepDefinition } from '../steps'

export const getAzureOpenAISteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
    const { CodeBlock, CalloutBox, Markdown, Blockquote, dedent, snippets } = ctx

    const NotableGenerationProperties = snippets?.NotableGenerationProperties

    return [
        {
            title: 'Install the SDKs',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Setting up analytics starts with installing the Insights and OpenAI SDKs.
                    </Markdown>

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
            title: 'Initialize Insights and Azure OpenAI client',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        We call Azure OpenAI through Insights's AzureOpenAI wrapper to capture all the details of the call.
                        Initialize Insights with your Insights project API key and host from
                        [your project settings](https://insights.hanzo.ai/settings/project), then pass the Insights client
                        along with your Azure OpenAI config (the API key, API version, and endpoint) to our AzureOpenAI wrapper.
                    </Markdown>

                    <CodeBlock
                        blocks={[
                            {
                                language: 'python',
                                file: 'Python',
                                code: dedent`
                                    from insights.ai.openai import AzureOpenAI
                                    from insights import Insights

                                    insights = Insights(
                                        "<ph_project_api_key>",
                                        host="<ph_client_api_host>"
                                    )

                                    client = AzureOpenAI(
                                        api_key="<azure_openai_api_key>",
                                        api_version="2024-10-21",
                                        azure_endpoint="https://<your-resource>.openai.azure.com",
                                        insights_client=insights
                                    )
                                `,
                            },
                            {
                                language: 'typescript',
                                file: 'Node',
                                code: dedent`
                                    import { AzureOpenAI } from '@hanzo/ai'
                                    import { Insights } from 'insights-node'

                                    const phClient = new Insights(
                                      '<ph_project_api_key>',
                                      { host: '<ph_client_api_host>' }
                                    );

                                    const client = new AzureOpenAI({
                                      apiKey: '<azure_openai_api_key>',
                                      apiVersion: '2024-10-21',
                                      endpoint: 'https://<your-resource>.openai.azure.com',
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
                        <Markdown>**Note:** This also works with the `AsyncAzureOpenAI` client.</Markdown>
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
            title: 'Call Azure OpenAI',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Now, when you call Azure OpenAI, Insights automatically captures an
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
                                        model="<your-deployment-name>",
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
                                    const completion = await client.chat.completions.create({
                                        model: "<your-deployment-name>",
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

export const AzureOpenAIInstallation = createInstallation(getAzureOpenAISteps)
