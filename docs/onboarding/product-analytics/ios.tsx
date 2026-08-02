import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/shared/OnboardingDocsContentWrapper'

import { StepDefinition } from '../steps'

export const getIOSSteps = (
    ctx: OnboardingComponentsContext,
    options?: {
        includeExperimentalSpi?: boolean
        experimentalDescription?: string
        minVersionPod?: string
        minVersionSPM?: string
    }
): StepDefinition[] => {
    const { CodeBlock, Markdown, CalloutBox, dedent } = ctx

    const podVersion = options?.minVersionPod || '3.56'
    const spmVersion = options?.minVersionSPM || '3.56.0'

    return [
        {
            title: 'Install dependency',
            badge: 'required',
            content: (
                <>
                    {options?.experimentalDescription && (
                        <CalloutBox type="fyi" title="Experimental API">
                            <Markdown>{options.experimentalDescription}</Markdown>
                        </CalloutBox>
                    )}
                    <Markdown>Install via Swift Package Manager:</Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'swift',
                                file: 'Package.swift',
                                code: dedent`
                                    dependencies: [
                                      .package(url: "https://github.com/Insights/insights-ios.git", from: "${spmVersion}")
                                    ]
                                `,
                            },
                        ]}
                    />
                    <Markdown>Or add Insights to your Podfile:</Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'ruby',
                                file: 'Podfile',
                                code: dedent`
                                    pod "Insights", "~> ${podVersion}"
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
                                    ${options?.includeExperimentalSpi ? '@_spi(Experimental) ' : ''}import Insights
                                    import UIKit

                                    class AppDelegate: NSObject, UIApplicationDelegate {
                                        func application(_: UIApplication, didFinishLaunchingWithOptions _: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
                                            let INSIGHTS_PROJECT_TOKEN = "<ph_project_token>"
                                            let INSIGHTS_HOST = "<ph_client_api_host>"

                                            let config = InsightsConfig(projectToken: INSIGHTS_PROJECT_TOKEN, host: INSIGHTS_HOST)
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
