import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/shared/OnboardingDocsContentWrapper'

import { getReactNativeSteps } from '../product-analytics/react-native'
import { StepDefinition } from '../steps'

function getSurveysReactNativeSteps(ctx: OnboardingComponentsContext): StepDefinition[] {
    const { CodeBlock, Markdown, dedent, snippets } = ctx
    const SurveysFinalSteps = snippets?.SurveysFinalSteps

    const installationSteps = getReactNativeSteps(ctx)

    const surveysSteps: StepDefinition[] = [
        {
            title: 'Install surveys dependencies',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Other than the Insights SDK, Surveys requires a few additional dependencies to be installed.
                    </Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'bash',
                                file: 'yarn',
                                code: dedent`
                                    yarn add react-native-safe-area-context react-native-svg
                                `,
                            },
                            {
                                language: 'bash',
                                file: 'npm',
                                code: dedent`
                                    npm i -s react-native-safe-area-context react-native-svg
                                `,
                            },
                        ]}
                    />
                </>
            ),
        },
        {
            title: 'Add the surveys provider',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Add `InsightsSurveyProvider` to your app anywhere inside `InsightsProvider`. This component
                        fetches surveys. It also acts as the root for where popover surveys are rendered.
                    </Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'typescript',
                                file: 'App.tsx',
                                code: dedent`
                                    <InsightsProvider /*... your config ...*/>
                                      <InsightsSurveyProvider>{children}</InsightsSurveyProvider>
                                    </InsightsProvider>
                                `,
                            },
                        ]}
                    />
                    <Markdown>
                        If you&apos;re not using the `InsightsProvider`, add `InsightsSurveyProvider` to your app anywhere
                        inside your app root component.
                    </Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'typescript',
                                file: 'App.tsx',
                                code: dedent`
                                    <YourAppRoot>
                                      <InsightsSurveyProvider>{children}</InsightsSurveyProvider>
                                    </YourAppRoot>
                                `,
                            },
                        ]}
                    />
                    <Markdown>You can also pass your `client` instance to the `InsightsSurveyProvider`.</Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'typescript',
                                file: 'App.tsx',
                                code: dedent`
                                    <InsightsSurveyProvider client={insights}>
                                        {children}
                                    </InsightsSurveyProvider>
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

export const SurveysReactNativeInstallation = createInstallation(getSurveysReactNativeSteps)
