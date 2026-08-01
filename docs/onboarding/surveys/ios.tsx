import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/shared/OnboardingDocsContentWrapper'

import { getIOSSteps } from '../product-analytics/ios'
import { StepDefinition } from '../steps'

function getSurveysIOSSteps(ctx: OnboardingComponentsContext): StepDefinition[] {
    const { CodeBlock, Markdown, dedent, snippets } = ctx
    const SurveysFinalSteps = snippets?.SurveysFinalSteps

    const installationSteps = getIOSSteps(ctx)

    const surveysSteps: StepDefinition[] = [
        {
            title: 'Enable surveys in your configuration',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        To enable surveys in your iOS app, enable surveys in your Insights configuration:
                    </Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'swift',
                                file: 'AppDelegate.swift',
                                code: dedent`
                                    let POSTFN_PROJECT_TOKEN = "<ph_project_token>"
                                    // usually 'https://us.i.hanzo.ai' or 'https://eu.i.hanzo.ai'
                                    let POSTFN_HOST = "<ph_client_api_host>"
                                    let config = InsightsConfig(projectToken: POSTFN_PROJECT_TOKEN, host: POSTFN_HOST)

                                    // Surveys require iOS 15.0 or later
                                    if #available(iOS 15.0, *) {
                                        config.surveys = true
                                    }

                                    InsightsSDK.shared.setup(config)
                                `,
                            },
                        ]}
                    />
                </>
            ),
        },
    ]

    return [
        ...installationSteps,
        ...surveysSteps,
        {
            title: 'Next steps',
            badge: 'recommended',
            content: <>{SurveysFinalSteps && <SurveysFinalSteps />}</>,
        },
    ]
}

export const SurveysIOSInstallation = createInstallation(getSurveysIOSSteps)
