import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/OnboardingDocsContentWrapper'

import { StepDefinition } from '../steps'

export const getGoSteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
    const { CodeBlock, Markdown, dedent } = ctx

    return [
        {
            title: 'Install the package',
            badge: 'required',
            content: (
                <>
                    <Markdown>Install the Insights Go library:</Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'bash',
                                file: 'Terminal',
                                code: dedent`
                                go get "github.com/hanzoai/insights-go"
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
                    <Markdown>Initialize the Insights client with your API key and host:</Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'go',
                                file: 'main.go',
                                code: dedent`
                                package main

                                import (
                                    "github.com/hanzoai/insights-go"
                                )

                                func main() {
                                    client, _ := insights.NewWithConfig("<ph_project_api_key>", insights.Config{Endpoint: "<ph_client_api_host>"})
                                    defer client.Close()
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
            content: (
                <>
                    <Markdown>Once installed, you can manually send events to test your integration:</Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'go',
                                file: 'Go',
                                code: dedent`
                                client.Enqueue(insights.Capture{
                                    DistinctId: "user_123",
                                    Event: "button_clicked",
                                    Properties: insights.NewProperties().
                                        Set("button_name", "signup"),
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

export const GoInstallation = createInstallation(getGoSteps)
