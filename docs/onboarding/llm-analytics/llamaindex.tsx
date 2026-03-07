import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/OnboardingDocsContentWrapper'

import { StepDefinition } from '../steps'

export const getLlamaIndexSteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
    const { CodeBlock, CalloutBox, Markdown, dedent, snippets } = ctx

    const NotableGenerationProperties = snippets?.NotableGenerationProperties

    return [
        {
            title: 'Install the Insights SDK',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Setting up analytics starts with installing the Insights SDK. The LlamaIndex integration uses
                        Insights's OpenAI wrapper.
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
            title: 'Install LlamaIndex',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Install LlamaIndex with the OpenAI integration. Insights instruments your LLM calls by wrapping
                        the OpenAI client that LlamaIndex uses.
                    </Markdown>

                    <CodeBlock
                        language="bash"
                        code={dedent`
                            pip install llama-index llama-index-llms-openai
                        `}
                    />
                </>
            ),
        },
        {
            title: 'Initialize Insights and LlamaIndex',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Initialize Insights with your project API key and host from [your project
                        settings](https://insights.hanzo.ai/settings/project), then create a Insights OpenAI wrapper and
                        pass it to LlamaIndex's `OpenAI` LLM class.
                    </Markdown>

                    <CodeBlock
                        language="python"
                        code={dedent`
                            from llama_index.llms.openai import OpenAI as LlamaOpenAI
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

                            llm = LlamaOpenAI(
                                model="gpt-4o-mini",
                                api_key="your_openai_api_key",
                            )
                            llm._client = openai_client
                        `}
                    />

                    <CalloutBox type="fyi" icon="IconInfo" title="How this works">
                        <Markdown>
                            Insights's `OpenAI` wrapper is a proper subclass of `openai.OpenAI`, so it can replace the
                            internal client used by LlamaIndex's OpenAI LLM. Insights captures `$ai_generation` events
                            automatically without proxying your calls.

                            **Note:** This approach accesses an internal attribute (`_client`) which may change in future
                            LlamaIndex versions. Check for updates if you encounter issues after upgrading LlamaIndex.
                        </Markdown>
                    </CalloutBox>
                </>
            ),
        },
        {
            title: 'Query with LlamaIndex',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Use LlamaIndex as normal. Insights automatically captures an `$ai_generation` event for each LLM
                        call made through the wrapped client.
                    </Markdown>

                    <CodeBlock
                        language="python"
                        code={dedent`
                            from llama_index.core import VectorStoreIndex, SimpleDirectoryReader

                            # Load your documents
                            documents = SimpleDirectoryReader("data").load_data()

                            # Create an index
                            index = VectorStoreIndex.from_documents(documents, llm=llm)

                            # Query the index
                            query_engine = index.as_query_engine(llm=llm)
                            response = query_engine.query("What is this document about?")

                            print(response)
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

export const LlamaIndexInstallation = createInstallation(getLlamaIndexSteps)
