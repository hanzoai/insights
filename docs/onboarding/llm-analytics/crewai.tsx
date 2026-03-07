import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/OnboardingDocsContentWrapper'

import { StepDefinition } from '../steps'

export const getCrewAISteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
    const { CodeBlock, CalloutBox, Markdown, dedent, snippets } = ctx

    const NotableGenerationProperties = snippets?.NotableGenerationProperties

    return [
        {
            title: 'Install the Insights SDK',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Setting up analytics starts with installing the Insights SDK. CrewAI uses LLM under the hood,
                        and Insights integrates with LLM's callback system.
                    </Markdown>

                    <CodeBlock
                        language="bash"
                        code={dedent`
                            pip install insights
                        `}
                    />
                </>
            ),
        },
        {
            title: 'Install CrewAI',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Install CrewAI. Insights instruments your LLM calls through LLM's callback system that CrewAI
                        uses natively.
                    </Markdown>

                    <CodeBlock
                        language="bash"
                        code={dedent`
                            pip install crewai llm
                        `}
                    />
                </>
            ),
        },
        {
            title: 'Configure Insights with LLM',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Set your Insights project API key and host as environment variables, then configure LLM to
                        use Insights as a callback handler. You can find your API key in [your project
                        settings](https://insights.hanzo.ai/settings/project).
                    </Markdown>

                    <CodeBlock
                        language="python"
                        code={dedent`
                            import os
                            import llm
                            from crewai import Agent, Task, Crew

                            # Set Insights environment variables
                            os.environ["INSIGHTS_API_KEY"] = "<ph_project_api_key>"
                            os.environ["INSIGHTS_API_URL"] = "<ph_client_api_host>"

                            # Enable Insights callbacks in LLM
                            llm.success_callback = ["insights"]
                            llm.failure_callback = ["insights"]
                        `}
                    />

                    <CalloutBox type="fyi" icon="IconInfo" title="How this works">
                        <Markdown>
                            CrewAI uses LLM under the hood for LLM provider access. By configuring Insights as a
                            LLM callback, all LLM calls made through CrewAI are automatically captured as
                            `$ai_generation` events without proxying your calls.
                        </Markdown>
                    </CalloutBox>
                </>
            ),
        },
        {
            title: 'Run your crew',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Run your CrewAI agents as normal. Insights automatically captures generation events for each LLM
                        call.
                    </Markdown>

                    <CodeBlock
                        language="python"
                        code={dedent`
                            researcher = Agent(
                                role="Researcher",
                                goal="Find interesting facts about mascots",
                                backstory="You are an expert wildlife researcher.",
                            )

                            task = Task(
                                description="Research three fun facts about mascots.",
                                expected_output="A list of three fun facts.",
                                agent=researcher,
                            )

                            crew = Crew(
                                agents=[researcher],
                                tasks=[task],
                            )

                            result = crew.kickoff()
                            print(result)
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

export const CrewAIInstallation = createInstallation(getCrewAISteps)
