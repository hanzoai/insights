import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/shared/OnboardingDocsContentWrapper'

import { StepDefinition } from '../steps'

export const getLiteLLMSteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
    const { CodeBlock, Markdown, Blockquote, dedent, snippets } = ctx
    const NotableGenerationProperties = snippets?.NotableGenerationProperties

    return [
        {
            title: 'LiteLLM Requirements',
            badge: 'required',
            content: (
                <Blockquote>
                    <Markdown>
                        **Note:** Use LiteLLM as a Python SDK or as a proxy server. Insights observability requires
                        LiteLLM version 1.77.3 or higher.
                    </Markdown>
                </Blockquote>
            ),
        },
        {
            title: 'Install LiteLLM',
            badge: 'required',
            content: (
                <>
                    <Markdown>Choose your installation method based on how you want to use LiteLLM:</Markdown>

                    <CodeBlock
                        blocks={[
                            {
                                language: 'bash',
                                file: 'SDK',
                                code: dedent`
                                    pip install litellm
                                `,
                            },
                            {
                                language: 'bash',
                                file: 'Proxy',
                                code: dedent`
                                    # Install via pip
                                    pip install 'litellm[proxy]'

                                    # Or run via Docker
                                    docker run --rm -p 4000:4000 ghcr.io/berriai/litellm:latest
                                `,
                            },
                        ]}
                    />
                </>
            ),
        },
        {
            title: 'Configure Insights observability',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Configure Insights by setting your project token and host as well as adding `insights` to your
                        LiteLLM callback handlers. You can find your project token in [your project
                        settings](https://app.hanzo.ai/settings/project).
                    </Markdown>

                    <CodeBlock
                        blocks={[
                            {
                                language: 'python',
                                file: 'SDK',
                                code: dedent`
                                    import os
                                    import litellm

                                    # Set environment variables
                                    os.environ["POSTFN_API_KEY"] = "<ph_project_token>"
                                    os.environ["POSTFN_API_URL"] = "<ph_client_api_host>"  # Optional, defaults to https://app.hanzo.ai

                                    # Enable Insights callbacks
                                    litellm.success_callback = ["insights"]
                                    litellm.failure_callback = ["insights"]  # Optional: also log failures
                                `,
                            },
                            {
                                language: 'yaml',
                                file: 'Proxy',
                                code: dedent`
                                    # config.yaml
                                    model_list:
                                    - model_name: gpt-5-mini
                                      litellm_params:
                                        model: gpt-5-mini

                                    litellm_settings:
                                      success_callback: ["insights"]
                                      failure_callback: ["insights"]  # Optional: also log failures

                                    environment_variables:
                                      POSTFN_API_KEY: "<ph_project_token>"
                                      POSTFN_API_URL: "<ph_client_api_host>"  # Optional
                                `,
                            },
                        ]}
                    />
                </>
            ),
        },
        {
            title: 'Call LLMs through LiteLLM',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        {dedent`
                            When you use LiteLLM to call an LLM provider, Insights automatically captures an
                            \`$ai_generation\` event. Identity and trace data travel through \`metadata\`, since
                            LiteLLM has no dedicated \`insights_trace_id\` parameter.
                        `}
                    </Markdown>

                    <CodeBlock
                        blocks={[
                            {
                                language: 'python',
                                file: 'SDK',
                                code: dedent`
                                    from insights import Insights
                                    import time, uuid, json

                                    insights = Insights("<ph_project_token>", host="<ph_client_api_host>")

                                    trace_id = str(uuid.uuid4())

                                    response = litellm.completion(
                                        model="gpt-5-mini",
                                        messages=[{"role": "user", "content": "What's the weather in Paris?"}],
                                        tools=tools,
                                        metadata={
                                            "user_id": "user_123",                # Maps to Insights distinct_id
                                            "company": "company_id_in_your_db",   # Custom property
                                            "$ai_session_id": "conversation-abc",
                                            "$ai_trace_id": trace_id,
                                        },
                                    )
                                `,
                            },
                            {
                                language: 'bash',
                                file: 'Proxy',
                                code: dedent`
                                    # Start the proxy (if not already running)
                                    litellm --config config.yaml

                                    # Make a request to the proxy
                                    curl -X POST http://localhost:4000/chat/completions \
                                      -H "Content-Type: application/json" \
                                      -d '{
                                        "model": "gpt-5-mini",
                                        "messages": [
                                          {"role": "user", "content": "Tell me a fun fact about mascots"}
                                        ],
                                        "metadata": {
                                          "user_id": "user_123",
                                          "company": "company_id_in_your_db", # Custom property
                                          "$ai_session_id": "conversation-abc" # Groups calls into one session
                                        }
                                      }'
                                `,
                            },
                        ]}
                    />

                    <Blockquote>
                        <Markdown>
                            {dedent`
                                **Notes:**
                                - This works with streaming responses by setting \`stream=True\`.
                                - To disable logging for specific requests, add \`{"no-log": true}\` to metadata.
                                - Pass \`$ai_session_id\` in metadata to group calls from the same conversation into
                                  one Insights session.
                                - If you want to capture LLM events anonymously, **do not** pass a \`user_id\` in metadata.

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
        {
            title: 'Capture tool calls as spans',
            badge: 'optional',
            content: (
                <>
                    <Markdown>
                        {dedent`
                            Capture each tool call as a span yourself, as the example below does right after the
                            generation that triggered it.
                        `}
                    </Markdown>

                    <CodeBlock
                        language="python"
                        code={dedent`
                            for call in response.choices[0].message.tool_calls or []:
                                start = time.time()
                                result = run_tool(call.function.name, json.loads(call.function.arguments))

                                insights.capture(
                                    distinct_id="user_123",
                                    event="$ai_span",
                                    properties={
                                        "$ai_trace_id": trace_id,
                                        "$ai_session_id": "conversation-abc",
                                        "$ai_span_id": str(uuid.uuid4()),
                                        "$ai_span_name": call.function.name,
                                        "$ai_input_state": call.function.arguments,
                                        "$ai_output_state": result,
                                        "$ai_latency": time.time() - start,
                                    },
                                )
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
        {
            title: 'Capture embeddings',
            badge: 'optional',
            content: (
                <>
                    <Markdown>
                        Insights can also capture embedding generations as `$ai_embedding` events through LiteLLM:
                    </Markdown>

                    <CodeBlock
                        blocks={[
                            {
                                language: 'python',
                                file: 'SDK',
                                code: dedent`
                                    response = litellm.embedding(
                                        input="The quick brown fox",
                                        model="text-embedding-3-small",
                                        metadata={
                                            "user_id": "user_123",  # Maps to Insights distinct_id
                                            "company": "company_id_in_your_db"  # Custom property
                                        }
                                    )
                                `,
                            },
                            {
                                language: 'bash',
                                file: 'Proxy',
                                code: dedent`
                                    # Make an embeddings request to the proxy
                                    curl -X POST http://localhost:4000/embeddings \
                                      -H "Content-Type: application/json" \
                                      -d '{
                                        "input": "The quick brown fox",
                                        "model": "text-embedding-3-small",
                                        "metadata": {
                                          "user_id": "user_123",
                                          "company": "company_id_in_your_db" # Custom property
                                        }
                                      }'
                                `,
                            },
                        ]}
                    />
                </>
            ),
        },
    ]
}

export const LiteLLMInstallation = createInstallation(getLiteLLMSteps)
