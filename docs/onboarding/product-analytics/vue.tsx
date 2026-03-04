import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/OnboardingDocsContentWrapper'

import { StepDefinition } from '../steps'

export const getVueSteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
    const { CodeBlock, Markdown, CalloutBox, dedent, snippets } = ctx

    const JSEventCapture = snippets?.JSEventCapture

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
                    <CalloutBox type="fyi" title="Vue version">
                        <Markdown>
                            This guide is for Vue 3 and above. For Vue 2.x, see our [Vue
                            docs](https://hanzo.ai/docs/libraries/vue-js).
                        </Markdown>
                    </CalloutBox>
                </>
            ),
        },
        {
            title: 'Create a composable',
            badge: 'required',
            content: (
                <>
                    <Markdown>Create a new file `src/composables/useInsights.js`:</Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'javascript',
                                file: 'src/composables/useInsights.js',
                                code: dedent`
                                    import insights from '@hanzo/insights'

                                    export function useInsights() {
                                      insights.init('<ph_project_api_key>', {
                                        api_host: '<ph_client_api_host>',
                                        defaults: '2026-01-30'
                                      })

                                      return { insights }
                                    }
                                `,
                            },
                        ]}
                    />
                </>
            ),
        },
        {
            title: 'Import in your router',
            badge: 'required',
            content: (
                <>
                    <Markdown>In `router/index.js`, import the `useInsights` composable and call it:</Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'javascript',
                                file: 'router/index.js',
                                code: dedent`
                                    import { createRouter, createWebHistory } from 'vue-router'
                                    import HomeView from '../views/HomeView.vue'
                                    import { useInsights } from '@/composables/useInsights'

                                    const router = createRouter({
                                      history: createWebHistory(import.meta.env.BASE_URL),
                                      routes: [
                                        {
                                          path: '/',
                                          name: 'home',
                                          component: HomeView,
                                        },
                                        {
                                          path: '/about',
                                          name: 'about',
                                          component: () => import('../views/AboutView.vue'),
                                        },
                                      ],
                                    })

                                    const { insights } = useInsights()

                                    export default router
                                `,
                            },
                        ]}
                    />
                </>
            ),
        },
        {
            title: 'Send events',
            content: <>{JSEventCapture && <JSEventCapture />}</>,
        },
    ]
}

export const VueInstallation = createInstallation(getVueSteps)
