import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/shared/OnboardingDocsContentWrapper'

import { StepDefinition } from '../steps'
import { SDK_DEFAULTS_DATE } from './_snippets/sdkDefaults'

export const getSentrySteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
    const { CodeBlock, Markdown, CalloutBox, dedent } = ctx

    return [
        {
            title: 'Install the packages',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Sentry is an error tracking platform. The Insights-Sentry integration links error data to your
                        analytics, allowing you to see which users experienced errors.
                    </Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'bash',
                                file: 'Terminal',
                                code: dedent`
                                npm install --save insights-js @sentry/browser
                            `,
                            },
                        ]}
                    />
                </>
            ),
        },
        {
            title: 'Configure the integration',
            badge: 'required',
            content: (
                <>
                    <Markdown>Add the Sentry integration when initializing Insights:</Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'javascript',
                                file: 'JavaScript',
                                code: dedent`
                                import insights from 'insights-js'
                                import * as Sentry from '@sentry/browser'

                                // Initialize Sentry first
                                Sentry.init({
                                  dsn: 'your-sentry-dsn',
                                })

                                // Initialize Insights with Sentry integration
                                insights.init('<ph_project_token>', {
                                  api_host: '<ph_client_api_host>',
                                  defaults: '${SDK_DEFAULTS_DATE}'
                                })

                                // Set Insights session ID on Sentry scope
                                Sentry.getCurrentScope().setTag('insights_session_id', insights.get_session_id())
                            `,
                            },
                        ]}
                    />
                    <CalloutBox type="fyi" title="Full setup guide">
                        <Markdown>
                            This allows you to link Sentry errors to Insights sessions. See the [Sentry integration
                            docs](https://hanzo.ai/docs/libraries/sentry) for the full setup guide.
                        </Markdown>
                    </CalloutBox>
                </>
            ),
        },
    ]
}

export const SentryInstallation = createInstallation(getSentrySteps)
