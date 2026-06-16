import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/OnboardingDocsContentWrapper'

import { StepDefinition } from '../steps'

export const getDSPySteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
    const { CodeBlock, CalloutBox, Markdown, dedent, snippets } = ctx

    const NotableGenerationProperties = snippets?.NotableGenerationProperties

    return [
        {
            title: 'Install the Insights SDK',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Setting up analytics starts with installing the Insights SDK. The DSPy integration uses Insights's
                        LLM callback.
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
            title: 'Install DSPy and LLM',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Install DSPy and LLM. DSPy uses LLM natively for provider access, and Insights integrates
                        with LLM's callback system.
                    </Markdown>

                    <CodeBlock
                        language="bash"
                        code={dedent`
                            pip install dspy llm
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
                            import dspy
                            import llm

                            # Set Insights environment variables
                            os.environ["INSIGHTS_API_KEY"] = "<ph_project_api_key>"
                            os.environ["INSIGHTS_API_URL"] = "<ph_client_api_host>"

                            # Enable Insights callbacks in LLM
                            llm.success_callback = ["insights"]
                            llm.failure_callback = ["insights"]

                            # Configure DSPy to use an LLM
                            lm = dspy.LM("openai/gpt-4o-mini", api_key="your_openai_api_key")
                            dspy.configure(lm=lm)
                        `}
                    />

                    <CalloutBox type="fyi" icon="IconInfo" title="How this works">
                        <Markdown>
                            DSPy uses LLM under the hood for LLM provider access. By configuring Insights as a
                            LLM callback, all LLM calls made through DSPy are automatically captured as
                            `$ai_generation` events.
                        </Markdown>
                    </CalloutBox>
                </>
            ),
        },
        {
            title: 'Run DSPy modules',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Use DSPy as normal. Insights automatically captures an `$ai_generation` event for each LLM call
                        made through LLM.
                    </Markdown>

                    <CodeBlock
                        language="python"
                        code={dedent`
                            # Define a simple signature
                            class QA(dspy.Signature):
                                """Answer the question."""
                                question: str = dspy.InputField()
                                answer: str = dspy.OutputField()

                            # Create and run a module
                            predictor = dspy.Predict(QA)
                            result = predictor(
                                question="What is a fun fact about mascots?"
                            )

                            print(result.answer)
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

export const DSPyInstallation = createInstallation(getDSPySteps)
