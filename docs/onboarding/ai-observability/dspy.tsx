import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/shared/OnboardingDocsContentWrapper'

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
                        LiteLLM callback.
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
            title: 'Install DSPy and LiteLLM',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Install DSPy and LiteLLM. DSPy uses LiteLLM natively for provider access, and Insights integrates
                        with LiteLLM's callback system.
                    </Markdown>

                    <CodeBlock
                        language="bash"
                        code={dedent`
                            pip install dspy litellm
                        `}
                    />
                </>
            ),
        },
        {
            title: 'Configure Insights with LiteLLM',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Set your Insights project token and host as environment variables, then configure LiteLLM to use
                        Insights as a callback handler. You can find your project token in [your project
                        settings](https://app.hanzo.ai/settings/project).
                    </Markdown>

                    <CodeBlock
                        language="python"
                        code={dedent`
                            import os
                            import dspy
                            import litellm

                            # Set Insights environment variables
                            os.environ["INSIGHTS_API_KEY"] = "<ph_project_token>"
                            os.environ["INSIGHTS_API_URL"] = "<ph_client_api_host>"

                            # Enable Insights callbacks in LiteLLM
                            litellm.success_callback = ["insights"]
                            litellm.failure_callback = ["insights"]

                            # Configure DSPy to use an LLM
                            lm = dspy.LM(
                                "openai/gpt-5-mini",
                                api_key="your_openai_api_key",
                                metadata={
                                    "user_id": "user_123",  # Maps to Insights distinct_id
                                    "$ai_session_id": "conversation-abc",  # Groups calls into one session
                                },
                            )
                            dspy.configure(lm=lm)
                        `}
                    />

                    <CalloutBox type="fyi" icon="IconInfo" title="How this works">
                        <Markdown>
                            DSPy uses LiteLLM under the hood for LLM provider access. By configuring Insights as a
                            LiteLLM callback, all LLM calls made through DSPy are automatically captured as
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
                        {dedent`
                            Use DSPy as normal. Insights automatically captures an \`$ai_generation\` event for each
                            LLM call made through LiteLLM.
                        `}
                    </Markdown>

                    <CodeBlock
                        language="python"
                        code={dedent`
                            from insights import Insights
                            import time, uuid

                            insights = Insights("<ph_project_token>", host="<ph_client_api_host>")

                            trace_id = str(uuid.uuid4())

                            lm = dspy.LM(
                                "openai/gpt-5-mini",
                                api_key="your_openai_api_key",
                                metadata={
                                    "user_id": "user_123",
                                    "$ai_session_id": "conversation-abc",
                                    "$ai_trace_id": trace_id,
                                },
                            )
                            dspy.configure(lm=lm)


                            # Define a simple signature
                            class QA(dspy.Signature):
                                """Answer the question."""
                                question: str = dspy.InputField()
                                answer: str = dspy.OutputField()

                            predictor = dspy.Predict(QA)
                            result = predictor(question="What's a fun fact about mascots?")
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
        {
            title: 'Capture tool calls as spans',
            badge: 'optional',
            content: (
                <>
                    <Markdown>
                        {dedent`
                            Capture tool calls as a span yourself, as the example below does before calling \`predictor\`.
                        `}
                    </Markdown>

                    <CodeBlock
                        language="python"
                        code={dedent`
                            # retrieve() is your existing retrieval setup
                            start = time.time()
                            context = retrieve("mascot facts")

                            insights.capture(
                                distinct_id="user_123",
                                event="$ai_span",
                                properties={
                                    "$ai_trace_id": trace_id,
                                    "$ai_session_id": "conversation-abc",
                                    "$ai_span_id": str(uuid.uuid4()),
                                    "$ai_span_name": "retrieve",
                                    "$ai_input_state": "mascot facts",
                                    "$ai_output_state": context,
                                    "$ai_latency": time.time() - start,
                                },
                            )

                            question = f"Using this context, answer what a fun fact about mascots is: {context}"
                            result = predictor(question=question)
                        `}
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

export const DSPyInstallation = createInstallation(getDSPySteps)
