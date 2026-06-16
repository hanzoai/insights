import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/OnboardingDocsContentWrapper'

import { StepDefinition } from '../steps'

export const getReactNativeSteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
    const { CodeBlock, Markdown, dedent } = ctx

    return [
        {
            title: 'Install the package',
            badge: 'required',
            content: (
                <>
                    <Markdown>Install the Insights React Native library and its dependencies:</Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'bash',
                                file: 'Expo',
                                code: dedent`
                                    npx expo install insights-react-native expo-file-system expo-application expo-device expo-localization
                                `,
                            },
                            {
                                language: 'bash',
                                file: 'yarn',
                                code: dedent`
                                    yarn add insights-react-native @react-native-async-storage/async-storage react-native-device-info react-native-localize

                                    # for iOS
                                    cd ios && pod install
                                `,
                            },
                            {
                                language: 'bash',
                                file: 'npm',
                                code: dedent`
                                    npm i -s insights-react-native @react-native-async-storage/async-storage react-native-device-info react-native-localize

                                    # for iOS
                                    cd ios && pod install
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
                    <Markdown>
                        Insights is most easily used via the `InsightsProvider` component. Wrap your app with the
                        provider:
                    </Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'tsx',
                                file: 'App.tsx',
                                code: dedent`
                                    import { InsightsProvider } from 'insights-react-native'

                                    export function MyApp() {
                                        return (
                                            <InsightsProvider
                                                apiKey="<ph_project_api_key>"
                                                options={{
                                                    host: "<ph_client_api_host>",
                                                }}
                                            >
                                                <RestOfApp />
                                            </InsightsProvider>
                                        )
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
                        events using the `useInsights` hook:
                    </Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'tsx',
                                file: 'Component.tsx',
                                code: dedent`
                                    import { useInsights } from 'insights-react-native'

                                    function MyComponent() {
                                        const insights = useInsights()

                                        const handlePress = () => {
                                            insights.capture('button_pressed', {
                                                button_name: 'signup'
                                            })
                                        }

                                        return <Button onPress={handlePress} title="Sign Up" />
                                    }
                                `,
                            },
                        ]}
                    />
                </>
            ),
        },
    ]
}

export const ReactNativeInstallation = createInstallation(getReactNativeSteps)
