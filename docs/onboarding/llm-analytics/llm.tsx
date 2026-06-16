import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/OnboardingDocsContentWrapper'

import { StepDefinition } from '../steps'

export const getLLMSteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
    const { CodeBlock, Markdown, Blockquote, dedent, snippets } = ctx
    const NotableGenerationProperties = snippets?.NotableGenerationProperties

    return [
        {
            title: 'LLM Requirements',
            badge: 'required',
            content: (
                <Blockquote>
                    <Markdown>
                        **Note:** LLM can be used as a Python SDK or as a proxy server. Insights observability requires
                        LLM version 1.77.3 or higher.
                    </Markdown>
                </Blockquote>
            ),
        },
        {
            title: 'Install LLM',
            badge: 'required',
            content: (
                <>
                    <Markdown>Choose your installation method based on how you want to use LLM:</Markdown>

                    <CodeBlock
                        blocks={[
                            {
                                language: 'bash',
                                file: 'SDK',
                                code: dedent`
                                    pip install llm
                                `,
                            },
                            {
                                language: 'bash',
                                file: 'Proxy',
                                code: dedent`
                                    # Install via pip
                                    pip install 'llm[proxy]'

                                    # Or run via Docker
                                    docker run --rm -p 4000:4000 ghcr.io/hanzoai/llm:latest
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
                        Configure Insights by setting your project API key and host as well as adding `insights` to your
                        LLM callback handlers. You can find your API key in [your project
                        settings](https://insights.hanzo.ai/settings/project).
                    </Markdown>

                    <CodeBlock
                        blocks={[
                            {
                                language: 'python',
                                file: 'SDK',
                                code: dedent`
                                    import os
                                    import llm

                                    # Set environment variables
                                    os.environ["INSIGHTS_API_KEY"] = "<ph_project_api_key>"
                                    os.environ["INSIGHTS_API_URL"] = "<ph_client_api_host>"  # Optional, defaults to https://insights.hanzo.ai

                                    # Enable Insights callbacks
                                    llm.success_callback = ["insights"]
                                    llm.failure_callback = ["insights"]  # Optional: also log failures
                                `,
                            },
                            {
                                language: 'yaml',
                                file: 'Proxy',
                                code: dedent`
                                    # config.yaml
                                    model_list:
                                    - model_name: gpt-4o-mini
                                      llm_params:
                                        model: gpt-4o-mini

                                    llm_settings:
                                      success_callback: ["insights"]
                                      failure_callback: ["insights"]  # Optional: also log failures

                                    environment_variables:
                                      INSIGHTS_API_KEY: "<ph_project_api_key>"
                                      INSIGHTS_API_URL: "<ph_client_api_host>"  # Optional
                                `,
                            },
                        ]}
                    />
                </>
            ),
        },
        {
            title: 'Call LLMs through LLM',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Now, when you use LLM to call various LLM providers, Insights automatically captures an
                        `$ai_generation` event.
                    </Markdown>

                    <CodeBlock
                        blocks={[
                            {
                                language: 'python',
                                file: 'SDK',
                                code: dedent`
                                    response = llm.completion(
                                        model="gpt-4o-mini",
                                        messages=[
                                            {"role": "user", "content": "Tell me a fun fact about mascots"}
                                        ],
                                        metadata={
                                            "user_id": "user_123",  # Maps to Insights distinct_id
                                            "company": "company_id_in_your_db"  # Custom property
                                        }
                                    )

                                    print(response.choices[0].message.content)
                                `,
                            },
                            {
                                language: 'bash',
                                file: 'Proxy',
                                code: dedent`
                                    # Start the proxy (if not already running)
                                    llm --config config.yaml

                                    # Make a request to the proxy
                                    curl -X POST http://localhost:4000/chat/completions \
                                      -H "Content-Type: application/json" \
                                      -d '{
                                        "model": "gpt-4o-mini",
                                        "messages": [
                                          {"role": "user", "content": "Tell me a fun fact about mascots"}
                                        ],
                                        "metadata": {
                                          "user_id": "user_123",
                                          "company": "company_id_in_your_db" # Custom property
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
                                - If you want to capture LLM events anonymously, **don't** pass a \`user_id\` in metadata.

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
            title: 'Capture embeddings',
            badge: 'optional',
            content: (
                <>
                    <Markdown>
                        Insights can also capture embedding generations as `$ai_embedding` events through LLM:
                    </Markdown>

                    <CodeBlock
                        blocks={[
                            {
                                language: 'python',
                                file: 'SDK',
                                code: dedent`
                                    response = llm.embedding(
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

export const LLMInstallation = createInstallation(getLLMSteps)
