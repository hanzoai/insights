import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/OnboardingDocsContentWrapper'

import { getNuxtSteps as getNuxtStepsPA } from '../product-analytics/nuxt'
import { StepDefinition } from '../steps'

export const getNuxtSteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
    const { CodeBlock, Markdown, dedent, snippets } = ctx
    const BooleanFlag = snippets?.BooleanFlagSnippet
    const MultivariateFlag = snippets?.MultivariateFlagSnippet

    // Get installation steps from product-analytics
    const installationSteps = getNuxtStepsPA(ctx)

    // Add flag implementation steps
    const flagSteps: StepDefinition[] = [
        {
            title: 'Client-side rendering',
            badge: 'required',
            content: (
                <>
                    <Markdown>**Basic flag implementation**</Markdown>
                    {BooleanFlag && <BooleanFlag language="javascript" />}
                    <Markdown>**Multivariate flags**</Markdown>
                    {MultivariateFlag && <MultivariateFlag language="javascript" />}
                </>
            ),
        },
        {
            title: 'Server-side rendering',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Use `insights-node` to evaluate feature flags on the server. Initialize Insights in your server
                        route:
                    </Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'javascript',
                                file: 'server/api/example.js',
                                code: dedent`
                                    import { Insights } from 'insights-node'

                                    const runtimeConfig = useRuntimeConfig()
                                    const insights = new Insights(
                                        runtimeConfig.public.insightsPublicKey,
                                        { host: runtimeConfig.public.insightsHost }
                                    )
                                `,
                            },
                        ]}
                    />
                    <Markdown>**Basic flag implementation**</Markdown>
                    {BooleanFlag && <BooleanFlag language="node.js" />}
                    <Markdown>**Multivariate flags**</Markdown>
                    {MultivariateFlag && <MultivariateFlag language="node.js" />}
                </>
            ),
        },
        {
            title: 'Running experiments',
            badge: 'optional',
            content: (
                <Markdown>
                    Experiments run on top of our feature flags. Once you've implemented the flag in your code, you run
                    an experiment by creating a new experiment in the Insights dashboard.
                </Markdown>
            ),
        },
    ]

    return [...installationSteps, ...flagSteps]
}

export const NuxtInstallation = createInstallation(getNuxtSteps)
