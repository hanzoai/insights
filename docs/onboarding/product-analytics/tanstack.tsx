import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/OnboardingDocsContentWrapper'

import { StepDefinition } from '../steps'

export const getTanStackSteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
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
                </>
            ),
        },
        {
            title: 'Add environment variables',
            badge: 'required',
            content: (
                <>
                    <Markdown>Add your Insights API key and host to your environment variables:</Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'bash',
                                file: '.env',
                                code: dedent`
                                    VITE_PUBLIC_INSIGHTS_KEY=<ph_project_api_key>
                                    VITE_PUBLIC_INSIGHTS_HOST=<ph_client_api_host>
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
                        `main.tsx`):
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
                                    import { InsightsProvider } from '@hanzo/insights/react'

                                    const options = {
                                      api_host: import.meta.env.VITE_PUBLIC_INSIGHTS_HOST,
                                      defaults: '2026-01-30',
                                    } as const

                                    createRoot(document.getElementById('root')).render(
                                      <StrictMode>
                                        <InsightsProvider apiKey={import.meta.env.VITE_PUBLIC_INSIGHTS_KEY} options={options}>
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
            title: 'Send events',
            content: <>{JSEventCapture && <JSEventCapture />}</>,
        },
    ]
}

export const TanStackInstallation = createInstallation(getTanStackSteps)
