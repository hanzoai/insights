import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/OnboardingDocsContentWrapper'

import { StepDefinition } from '../steps'

export const getInstructorSteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
    const { CodeBlock, CalloutBox, Markdown, dedent, snippets } = ctx

    const NotableGenerationProperties = snippets?.NotableGenerationProperties

    return [
        {
            title: 'Install the Insights SDK',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Setting up analytics starts with installing the Insights SDK for your language. LLM analytics
                        works best with our Python and Node SDKs.
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
            title: 'Install Instructor and OpenAI SDKs',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Install Instructor and the OpenAI SDK. Insights instruments your LLM calls by wrapping the OpenAI
                        client, which Instructor uses under the hood.
                    </Markdown>

                    <CodeBlock
                        blocks={[
                            {
                                language: 'bash',
                                file: 'Python',
                                code: dedent`
                                    pip install instructor openai
                                `,
                            },
                            {
                                language: 'bash',
                                file: 'Node',
                                code: dedent`
                                    npm install @instructor-ai/instructor openai zod@3
                                `,
                            },
                        ]}
                    />
                </>
            ),
        },
        {
            title: 'Initialize Insights and Instructor',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Initialize Insights with your project API key and host from [your project
                        settings](https://insights.hanzo.ai/settings/project), then create a Insights OpenAI wrapper and
                        pass it to Instructor.
                    </Markdown>

                    <CodeBlock
                        blocks={[
                            {
                                language: 'python',
                                file: 'Python',
                                code: dedent`
                                    import instructor
                                    from pydantic import BaseModel
                                    from insights.ai.openai import OpenAI
                                    from insights import Insights

                                    insights = Insights(
                                        "<ph_project_api_key>",
                                        host="<ph_client_api_host>"
                                    )

                                    openai_client = OpenAI(
                                        api_key="your_openai_api_key",
                                        insights_client=insights
                                    )

                                    client = instructor.from_openai(openai_client)
                                `,
                            },
                            {
                                language: 'typescript',
                                file: 'Node',
                                code: dedent`
                                    import Instructor from '@instructor-ai/instructor'
                                    import { OpenAI } from '@hanzo/ai'
                                    import { Insights } from 'insights-node'
                                    import { z } from 'zod'

                                    const phClient = new Insights(
                                      '<ph_project_api_key>',
                                      { host: '<ph_client_api_host>' }
                                    );

                                    const openai = new OpenAI({
                                      apiKey: 'your_openai_api_key',
                                      insights: phClient,
                                    });

                                    const client = Instructor({ client: openai, mode: 'TOOLS' })
                                `,
                            },
                        ]}
                    />

                    <CalloutBox type="fyi" icon="IconInfo" title="How this works">
                        <Markdown>
                            Insights's `OpenAI` wrapper is a proper subclass of `openai.OpenAI`, so it works directly
                            with `instructor.from_openai()`. Insights captures `$ai_generation` events automatically
                            without proxying your calls.
                        </Markdown>
                    </CalloutBox>
                </>
            ),
        },
        {
            title: 'Use Instructor with structured outputs',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Now use Instructor to extract structured data from LLM responses. Insights automatically captures
                        an `$ai_generation` event for each call.
                    </Markdown>

                    <CodeBlock
                        blocks={[
                            {
                                language: 'python',
                                file: 'Python',
                                code: dedent`
                                    class UserInfo(BaseModel):
                                        name: str
                                        age: int

                                    user = client.chat.completions.create(
                                        model="gpt-4o-mini",
                                        response_model=UserInfo,
                                        messages=[
                                            {"role": "user", "content": "John Doe is 30 years old."}
                                        ],
                                        insights_distinct_id="user_123",
                                        insights_trace_id="trace_123",
                                        insights_properties={"conversation_id": "abc123"},
                                    )

                                    print(f"{user.name} is {user.age} years old")
                                `,
                            },
                            {
                                language: 'typescript',
                                file: 'Node',
                                code: dedent`
                                    const UserInfo = z.object({
                                      name: z.string(),
                                      age: z.number(),
                                    })

                                    const user = await client.chat.completions.create({
                                      model: 'gpt-4o-mini',
                                      response_model: { schema: UserInfo, name: 'UserInfo' },
                                      messages: [
                                        { role: 'user', content: 'John Doe is 30 years old.' }
                                      ],
                                      insightsDistinctId: 'user_123',
                                      insightsTraceId: 'trace_123',
                                      insightsProperties: { conversation_id: 'abc123' },
                                    })

                                    console.log(\`\${user.name} is \${user.age} years old\`)

                                    phClient.shutdown()
                                `,
                            },
                        ]}
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

export const InstructorInstallation = createInstallation(getInstructorSteps)
