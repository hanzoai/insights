import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/OnboardingDocsContentWrapper'

import { StepDefinition } from '../steps'

export const getNuxtClientSteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
    const { CodeBlock, Markdown, CalloutBox, dedent } = ctx

    return [
        {
            title: 'Install the package',
            badge: 'required',
            content: (
                <>
                    <Markdown>Install the Insights JavaScript library using your package manager:</Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'bash',
                                file: 'npm',
                                code: dedent`
                                    npm install insights-js
                                `,
                            },
                            {
                                language: 'bash',
                                file: 'yarn',
                                code: dedent`
                                    yarn add insights-js
                                `,
                            },
                            {
                                language: 'bash',
                                file: 'pnpm',
                                code: dedent`
                                    pnpm add insights-js
                                `,
                            },
                        ]}
                    />
                    <CalloutBox type="fyi" title="Nuxt version">
                        <Markdown>
                            This guide is for Nuxt v3.0 and above. For Nuxt v2.16 and below, see our [Nuxt
                            docs](https://hanzo.ai/docs/libraries/nuxt-js#nuxt-v216-and-below).
                        </Markdown>
                    </CalloutBox>
                </>
            ),
        },
        {
            title: 'Add environment variables',
            badge: 'required',
            content: (
                <>
                    <Markdown>Add your Insights API key and host to your `nuxt.config.js` file:</Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'javascript',
                                file: 'nuxt.config.js',
                                code: dedent`
                                    export default defineNuxtConfig({
                                      runtimeConfig: {
                                        public: {
                                          insightsPublicKey: '<ph_project_api_key>',
                                          insightsHost: '<ph_client_api_host>',
                                          insightsDefaults: '2026-01-30'
                                        }
                                      }
                                    })
                                `,
                            },
                        ]}
                    />
                </>
            ),
        },
        {
            title: 'Create a plugin',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Create a new plugin by creating a new file `insights.client.js` in your plugins directory:
                    </Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'javascript',
                                file: 'plugins/insights.client.js',
                                code: dedent`
                                    import { defineNuxtPlugin } from '#app'
                                    import insights from '@hanzo/insights'

                                    export default defineNuxtPlugin(nuxtApp => {
                                      const runtimeConfig = useRuntimeConfig();
                                      const insightsClient = insights.init(runtimeConfig.public.insightsPublicKey, {
                                        api_host: runtimeConfig.public.insightsHost,
                                        defaults: runtimeConfig.public.insightsDefaults,
                                        loaded: (insights) => {
                                          if (import.meta.env.MODE === 'development') insights.debug();
                                        }
                                      })

                                      return {
                                        provide: {
                                          insights: () => insightsClient
                                        }
                                      }
                                    })
                                `,
                            },
                        ]}
                    />
                </>
            ),
        },
    ]
}

export const getNuxtServerSteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
    const { CodeBlock, Markdown, dedent } = ctx

    return [
        {
            title: 'Server-side setup',
            badge: 'optional',
            content: (
                <>
                    <Markdown>
                        To capture events from server routes, install `insights-node` and instantiate it directly. You
                        can also use it to evaluate feature flags on the server:
                    </Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'bash',
                                file: 'npm',
                                code: dedent`
                                    npm install insights-node
                                `,
                            },
                            {
                                language: 'bash',
                                file: 'yarn',
                                code: dedent`
                                    yarn add insights-node
                                `,
                            },
                            {
                                language: 'bash',
                                file: 'pnpm',
                                code: dedent`
                                    pnpm add insights-node
                                `,
                            },
                        ]}
                    />
                    <CodeBlock
                        blocks={[
                            {
                                language: 'javascript',
                                file: 'server/api/example.js',
                                code: dedent`
                                    import { Insights } from 'insights-node'

                                    export default defineEventHandler(async (event) => {
                                        const runtimeConfig = useRuntimeConfig()

                                        const insights = new Insights(
                                            runtimeConfig.public.insightsPublicKey,
                                            { host: runtimeConfig.public.insightsHost }
                                        )

                                        insights.capture({
                                            distinctId: 'distinct_id_of_the_user',
                                            event: 'event_name'
                                        })

                                        await insights.shutdown()
                                    })
                                `,
                            },
                        ]}
                    />
                </>
            ),
        },
    ]
}

export const getNuxtSteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
    const { snippets } = ctx
    const JSEventCapture = snippets?.JSEventCapture

    return [
        ...getNuxtClientSteps(ctx),
        ...getNuxtServerSteps(ctx),
        {
            title: 'Send events',
            badge: undefined,
            content: <>{JSEventCapture && <JSEventCapture />}</>,
        },
    ]
}

export const NuxtInstallation = createInstallation(getNuxtSteps)
