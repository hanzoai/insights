import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/shared/OnboardingDocsContentWrapper'

import { StepDefinition } from '../steps'
import { SDK_DEFAULTS_DATE } from './_snippets/sdkDefaults'

export const getReactSteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
    const { CodeBlock, Markdown, CalloutBox, dedent, snippets } = ctx

    const JSEventCapture = snippets?.JSEventCapture

    return [
        {
            title: 'Install the package',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Install [`insights-js`](https://github.com/insights/insights-js) and `@hanzo/react` using your
                        package manager:
                    </Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'bash',
                                file: 'npm',
                                code: dedent`
                                    npm install insights-js @hanzo/react
                                `,
                            },
                            {
                                language: 'bash',
                                file: 'yarn',
                                code: dedent`
                                    yarn add insights-js @hanzo/react
                                `,
                            },
                            {
                                language: 'bash',
                                file: 'pnpm',
                                code: dedent`
                                    pnpm add insights-js @hanzo/react
                                `,
                            },
                        ]}
                    />
                </>
            ),
        },
        {
            title: 'Add environment variables',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Add your Insights project token and host to your environment variables. For Vite-based React
                        apps, use the `VITE_` prefix to expose them to the client:
                    </Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'bash',
                                file: '.env',
                                code: dedent`
                                    VITE_INSIGHTS_PROJECT_TOKEN=<ph_project_token>
                                    VITE_INSIGHTS_HOST=<ph_client_api_host>
                                `,
                            },
                        ]}
                    />
                </>
            ),
        },
        {
            title: 'Initialize Insights',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Wrap your app with the `InsightsProvider` component at the root of your application (such as
                        `main.tsx` if you're using Vite):
                    </Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'tsx',
                                file: 'main.tsx',
                                code: dedent`
                                    import { StrictMode } from 'react'
                                    import { createRoot } from 'react-dom/client'
                                    import './index.css'
                                    import App from './App.jsx'
                                    import { InsightsProvider } from '@hanzo/react'

                                    const options = {
                                      api_host: import.meta.env.VITE_INSIGHTS_HOST,
                                      defaults: '${SDK_DEFAULTS_DATE}',
                                    } as const

                                    createRoot(document.getElementById('root')).render(
                                      <StrictMode>
                                        <InsightsProvider apiKey={import.meta.env.VITE_INSIGHTS_PROJECT_TOKEN} options={options}>
                                          <App />
                                        </InsightsProvider>
                                      </StrictMode>
                                    )
                                `,
                            },
                        ]}
                    />
                    <CalloutBox type="fyi" title="defaults option">
                        <Markdown>
                            The `defaults` option automatically configures Insights with recommended settings for new
                            projects. See [SDK defaults](https://hanzo.ai/docs/libraries/js#sdk-defaults) for
                            details.
                        </Markdown>
                    </CalloutBox>
                </>
            ),
        },
        {
            title: 'Accessing Insights in your code',
            badge: 'recommended',
            content: (
                <>
                    <Markdown>
                        Use the `useInsights` hook to access the Insights instance in any component wrapped by
                        `InsightsProvider`:
                    </Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'tsx',
                                file: 'MyComponent.tsx',
                                code: dedent`
                                    import { useInsights } from '@hanzo/react'

                                    function MyComponent() {
                                        const insights = useInsights()

                                        function handleClick() {
                                            insights.capture('button_clicked', { button_name: 'signup' })
                                        }

                                        return <button onClick={handleClick}>Sign up</button>
                                    }
                                `,
                            },
                        ]}
                    />
                    <Markdown>You can also import `insights` directly for non-React code or utility functions:</Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'tsx',
                                file: 'utils/analytics.ts',
                                code: dedent`
                                    import insights from 'insights-js'

                                    export function trackPurchase(amount: number) {
                                        insights.capture('purchase_completed', { amount })
                                    }
                                `,
                            },
                        ]}
                    />
                </>
            ),
        },
        {
            title: 'Send events',
            badge: 'recommended',
            content: <>{JSEventCapture && <JSEventCapture />}</>,
        },
    ]
}

export const ReactInstallation = createInstallation(getReactSteps)
