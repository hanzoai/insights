import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/shared/OnboardingDocsContentWrapper'

import { getReactNativeSteps as getReactNativeStepsPA } from '../product-analytics/react-native'
import { StepDefinition } from '../steps'

export const getReactNativeSteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
    const { CodeBlock, Markdown, CalloutBox, dedent } = ctx

    const installSteps = getReactNativeStepsPA(ctx)

    const exceptionAutocaptureStep: StepDefinition = {
        title: 'Set up exception autocapture',
        badge: 'recommended',
        content: (
            <>
                <CalloutBox type="fyi" title="Client-side configuration only">
                    <Markdown>
                        {dedent`
                            Support for remote configuration 
                            in the [error tracking settings](https://app.hanzo.ai/settings/project-error-tracking#exception-autocapture)
                            requires SDK version 4.35.0 or higher.
                        `}
                    </Markdown>
                </CalloutBox>
                <Markdown>
                    {dedent`
                        You can autocapture exceptions by configuring the \`errorTracking\` when setting up Insights:
                    `}
                </Markdown>
                <CodeBlock
                    blocks={[
                        {
                            language: 'jsx',
                            file: 'React Native',
                            code: dedent`
                              export const insights = new Insights('<ph_project_token>', {
                                errorTracking: {
                                  autocapture: {
                                    uncaughtExceptions: true,
                                    unhandledRejections: true,
                                    console: ['error', 'warn'],
                                    nativeCrashes: true, // native iOS/Android crashes (see below)
                                  },
                                },
                              })
                            `,
                        },
                    ]}
                />
                <Markdown>
                    {dedent`
                        **Configuration options:**

                        | Option | Description |
                        | --- | --- |
                        | \`uncaughtExceptions\` | Captures Uncaught exceptions (\`ReactNativeGlobal.ErrorUtils.setGlobalHandler\`) |
                        | \`unhandledRejections\` | Captures Unhandled rejections (\`ReactNativeGlobal.onunhandledrejection\`) |
                        | \`console\` | Captures console logs as errors according to the reported \`LogLevel\` |
                        | \`nativeCrashes\` | Captures native iOS/Android crashes. Requires \`@hanzo/react-native-plugin\` and uploaded native symbols (see below) |
                    `}
                </Markdown>
                <CalloutBox type="fyi" title="Capturing native crashes">
                    <Markdown>
                        {dedent`
                            \`nativeCrashes\` captures native iOS and Android crashes that the JavaScript layer can't see. Beyond the config above, it needs:

                            1. The optional native plugin installed — \`npx expo install @hanzo/react-native-plugin\` (Expo) or \`npm i @hanzo/react-native-plugin\` (bare React Native). If it's missing, native capture is a no-op and your JS-level autocapture is unaffected.
                            2. Your project's **Enable exception autocapture** setting enabled in [error tracking settings](https://app.hanzo.ai/settings/project-error-tracking#exception-autocapture) — the same server-side setting that gates JavaScript autocapture.
                            3. Native debug symbols uploaded at build time, so crash stack traces are readable. See [native crash symbolication](https://hanzo.ai/docs/error-tracking/upload-source-maps/react-native#native-crash-symbolication).
                        `}
                    </Markdown>
                </CalloutBox>
            </>
        ),
    }

    const errorBoundaryStep: StepDefinition = {
        title: 'Set up error boundaries',
        badge: 'optional',
        content: (
            <>
                <Markdown>
                    {dedent`
                        You can use the \`InsightsErrorBoundary\` component to capture rendering errors thrown by components:
                    `}
                </Markdown>
                <CodeBlock
                    blocks={[
                        {
                            language: 'jsx',
                            file: 'React Native',
                            code: dedent`
                                import { InsightsProvider, InsightsErrorBoundary } from 'insights-react-native'
                                import { View, Text } from 'react-native'

                                const App = () => {
                                  return (
                                    <InsightsProvider apiKey="<ph_project_token>">
                                      <InsightsErrorBoundary
                                        fallback={YourFallbackComponent}
                                        additionalProperties={{ screen: "home" }}
                                      >
                                        <YourApp />
                                      </InsightsErrorBoundary>
                                    </InsightsProvider>
                                  )
                                }

                                const YourFallbackComponent = ({ error, componentStack }) => {
                                  return (
                                    <View>
                                      <Text>Something went wrong!</Text>
                                      <Text>{error instanceof Error ? error.message : String(error)}</Text>
                                    </View>
                                  )
                                }
                            `,
                        },
                    ]}
                />
                <CalloutBox type="caution" title="Duplicate errors with console capture">
                    <Markdown>
                        {dedent`
                            If you have both \`InsightsErrorBoundary\` and \`console\` capture enabled in your \`errorTracking\` config, render errors will be captured twice. This is because React logs all errors to the console by default. To avoid this, set \`console: []\` on \`errorTracking.autocapture\` (for example, \`errorTracking: { autocapture: { console: [] } }\`) when using \`InsightsErrorBoundary\`.
                        `}
                    </Markdown>
                </CalloutBox>
                <CalloutBox type="fyi" title="Dev mode behavior">
                    <Markdown>
                        {dedent`
                            In development mode, React propagates all errors to the global error handler even when they are caught by an error boundary. This means you may see errors reported twice in dev builds. This is expected React behavior and does not occur in production builds.
                        `}
                    </Markdown>
                </CalloutBox>
            </>
        ),
    }

    const manualCaptureStep: StepDefinition = {
        title: 'Manually capture exceptions',
        badge: 'optional',
        content: (
            <>
                <Markdown>
                    {dedent`
                        You can manually capture exceptions using the \`captureException\` method:
                    `}
                </Markdown>
                <CodeBlock
                    blocks={[
                        {
                            language: 'jsx',
                            file: 'React Native',
                            code: dedent`
                              try {
                                // Your awesome code that may throw
                                someRiskyOperation();
                              } catch (error) {
                                insights.captureException(error)
                              }
                            `,
                        },
                    ]}
                />
                <Markdown>
                    {dedent`
                        This is helpful if you've built your own error handling logic or want to capture exceptions that are handled by your application code.
                    `}
                </Markdown>
            </>
        ),
    }

    const verifyStep: StepDefinition = {
        title: 'Verify error tracking',
        badge: 'recommended',
        checkpoint: true,
        content: (
            <Markdown>
                {dedent`
                    Before proceeding, let's make sure exception events are being captured and sent to Insights. You should see events appear in the activity feed.

                    [Check for exceptions in Insights](https://app.hanzo.ai/activity/explore)
                `}
            </Markdown>
        ),
    }

    const futureFeaturesStep: StepDefinition = {
        title: 'Future features',
        badge: 'optional',
        content: (
            <Markdown>
                {dedent`
                    We currently don't support the following features:

                    - No automatic source map uploads on React Native web

                    This will be added in a future release. We recommend you stay up to date with the latest version of the Insights React Native SDK.
                `}
            </Markdown>
        ),
    }

    return [
        ...installSteps,
        exceptionAutocaptureStep,
        errorBoundaryStep,
        manualCaptureStep,
        verifyStep,
        futureFeaturesStep,
    ]
}

export const ReactNativeInstallation = createInstallation(getReactNativeSteps)
