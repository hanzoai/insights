import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/shared/OnboardingDocsContentWrapper'

import { StepDefinition } from '../steps'
import { SDK_DEFAULTS_DATE } from './_snippets/sdkDefaults'

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
                    <Markdown>Add your Insights project token and host to your environment variables:</Markdown>
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
            title: 'Send events',
            content: <>{JSEventCapture && <JSEventCapture />}</>,
        },
    ]
}

export const TanStackInstallation = createInstallation(getTanStackSteps)
