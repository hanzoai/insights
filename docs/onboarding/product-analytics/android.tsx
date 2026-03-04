import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/OnboardingDocsContentWrapper'

import { StepDefinition } from '../steps'

export const getAndroidSteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
    const { CodeBlock, Markdown, dedent } = ctx

    return [
        {
            title: 'Install the dependency',
            badge: 'required',
            content: (
                <>
                    <Markdown>Add the Insights Android SDK to your `build.gradle` dependencies:</Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'kotlin',
                                file: 'build.gradle',
                                code: dedent`
                                    dependencies {
                                        implementation("com.insights:insights-android:3.+")
                                    }
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
                    <Markdown>Initialize Insights in your Application class:</Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'kotlin',
                                file: 'SampleApp.kt',
                                code: dedent`
                                    class SampleApp : Application() {

                                        companion object {
                                            const val INSIGHTS_API_KEY = "<ph_project_api_key>"
                                            const val INSIGHTS_HOST = "<ph_client_api_host>"
                                        }

                                        override fun onCreate() {
                                            super.onCreate()

                                            // Create a Insights Config with the given API key and host
                                            val config = InsightsAndroidConfig(
                                                apiKey = INSIGHTS_API_KEY,
                                                host = INSIGHTS_HOST
                                            )

                                            // Setup Insights with the given Context and Config
                                            InsightsAndroid.setup(this, config)
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
                                language: 'kotlin',
                                file: 'Kotlin',
                                code: dedent`
                                    import com.insights.Insights

                                    Insights.capture(
                                        event = "button_clicked",
                                        properties = mapOf(
                                            "button_name" to "signup"
                                        )
                                    )
                                `,
                            },
                        ]}
                    />
                </>
            ),
        },
    ]
}

export const AndroidInstallation = createInstallation(getAndroidSteps)
