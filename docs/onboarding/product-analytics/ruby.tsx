import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/shared/OnboardingDocsContentWrapper'

import { StepDefinition } from '../steps'

export const getRubySteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
    const { CodeBlock, Markdown, dedent } = ctx

    return [
        {
            title: 'Install the gem',
            badge: 'required',
            content: (
                <>
                    <Markdown>Add the Insights Ruby gem to your Gemfile:</Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'ruby',
                                file: 'Gemfile',
                                code: dedent`
                                gem "insights-ruby"
                            `,
                            },
                        ]}
                    />
                </>
            ),
        },
        {
            title: 'Configure Insights',
            badge: 'required',
            content: (
                <>
                    <Markdown>Initialize the Insights client with your project token and host:</Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'ruby',
                                file: 'Ruby',
                                code: dedent`
                                require 'insights'
                                
                                insights = Insights::Client.new({
                                    api_key: "<ph_project_token>",
                                    host: "<ph_client_api_host>",
                                    on_error: Proc.new { |status, msg| print msg }
                                })
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
            content: (
                <>
                    <Markdown>Once installed, you can manually send events to test your integration:</Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'ruby',
                                file: 'Ruby',
                                code: dedent`
                                insights.capture({
                                    distinct_id: 'user_123',
                                    event: 'button_clicked',
                                    properties: {
                                        button_name: 'signup'
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

export const RubyInstallation = createInstallation(getRubySteps)
