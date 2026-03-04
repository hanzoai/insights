import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/OnboardingDocsContentWrapper'

import { StepDefinition } from '../steps'

export const getIOSSteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
    const { CodeBlock, Markdown, dedent } = ctx

    return [
        {
            title: 'Install via CocoaPods',
            badge: 'required',
            content: (
                <>
                    <Markdown>Add Insights to your Podfile:</Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'ruby',
                                file: 'Podfile',
                                code: dedent`
                                    pod "Insights", "~> 3.0"
                                `,
                            },
                        ]}
                    />
                    <Markdown>Or install via Swift Package Manager:</Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'swift',
                                file: 'Package.swift',
                                code: dedent`
                                    dependencies: [
                                      .package(url: "https://github.com/hanzoai/insights-ios.git", from: "3.0.0")
                                    ]
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
                    <Markdown>Initialize Insights in your AppDelegate:</Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'swift',
                                file: 'AppDelegate.swift',
                                code: dedent`
                                    import Foundation
                                    import Insights
                                    import UIKit

                                    class AppDelegate: NSObject, UIApplicationDelegate {
                                        func application(_: UIApplication, didFinishLaunchingWithOptions _: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
                                            let INSIGHTS_API_KEY = "<ph_project_api_key>"
                                            let INSIGHTS_HOST = "<ph_client_api_host>"

                                            let config = InsightsConfig(apiKey: INSIGHTS_API_KEY, host: INSIGHTS_HOST)
                                            InsightsSDK.shared.setup(config)

                                            return true
                                        }
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
                    <Markdown>
                        Once installed, Insights will automatically start capturing events. You can also manually send
                        events to test your integration:
                    </Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'swift',
                                file: 'Swift',
                                code: dedent`
                                    InsightsSDK.shared.capture("button_clicked", properties: ["button_name": "signup"])
                                `,
                            },
                        ]}
                    />
                </>
            ),
        },
    ]
}

export const IOSInstallation = createInstallation(getIOSSteps)
