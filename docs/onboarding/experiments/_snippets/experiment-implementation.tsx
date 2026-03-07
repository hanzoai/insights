import { memo } from 'react'
import { useMDXComponents } from 'scenes/onboarding/OnboardingDocsContentWrapper'

export const ExperimentImplementationSnippet = memo(({ language = 'javascript' }: { language?: string }): JSX.Element => {
    const { CodeBlock, dedent } = useMDXComponents()

    const snippets: Record<string, string> = {
        javascript: dedent`
            if (insights.getFeatureFlag('your-experiment-feature-flag') === 'test') {
                // Do something differently for this user
            } else {
                // It's a good idea to let control variant always be the default behaviour,
                // so if something goes wrong with flag evaluation, you don't break your app.
            }

            // Test that it works
            insights.featureFlags.overrideFeatureFlags({ flags: {'your-experiment-feature-flag': 'test'} })
        `,
        react: dedent`
            // You can either use the useFeatureFlagVariantKey hook,
            // or you can use the feature flags component - https://hanzo.ai/docs/libraries/react#feature-flags-react-component

            // Method one: using the useFeatureFlagVariantKey hook
            import { useFeatureFlagVariantKey } from '@hanzo/insights/react'

            function App() {
                const variant = useFeatureFlagVariantKey('your-experiment-feature-flag')
                if (variant === 'test') {
                    // do something
                }
            }

            // Method two: using the feature flags component
            import { InsightsFeature } from '@hanzo/insights/react'

            function App() {
                return (
                    <InsightsFeature flag='your-experiment-feature-flag' match='test'>
                        <div>
                            {/* the component to show */}
                        </div>
                    </InsightsFeature>
                )
            }

            // You can also test your code by overriding the feature flag:
            insights.featureFlags.overrideFeatureFlags({ flags: {'your-experiment-feature-flag': 'test'} })
        `,
        'react-native': dedent`
            if (insights.getFeatureFlag('your-experiment-feature-flag') === 'test') {
                // Do something differently for this user
            } else {
                // It's a good idea to let control variant always be the default behaviour,
                // so if something goes wrong with flag evaluation, you don't break your app.
            }
        `,
        'node.js': dedent`
            const experimentFlagValue = await client.getFeatureFlag('your-experiment-feature-flag', 'user distinct id')

            if (experimentFlagValue === 'test' ) {
                // Do something differently for this user
            } else {
                // It's a good idea to let control variant always be the default behaviour,
                // so if something goes wrong with flag evaluation, you don't break your app.
            }
        `,
        python: dedent`
            experiment_flag_value = insights.get_feature_flag("your-experiment-feature-flag", "user_distinct_id")

            if experiment_flag_value == 'test':
                # Do something differently for this user
            else:
                # It's a good idea to let control variant always be the default behaviour,
                # so if something goes wrong with flag evaluation, you don't break your app.
        `,
        php: dedent`
            if (Insights::getFeatureFlag('your-experiment-feature-flag', 'user distinct id') == 'test') {
                // Do something differently for this user
            } else {
                // It's a good idea to let control variant always be the default behaviour,
                // so if something goes wrong with flag evaluation, you don't break your app.
            }
        `,
        ruby: dedent`
            experimentFlagValue = insights.get_feature_flag('your-experiment-feature-flag', 'user distinct id')

            if experimentFlagValue == 'test'
                # Do something differently for this user
            else
                # It's a good idea to let control variant always be the default behaviour,
                # so if something goes wrong with flag evaluation, you don't break your app.
            end
        `,
        go: dedent`
            experimentFlagValue, err := client.GetFeatureFlag(insights.FeatureFlagPayload{
                Key:        "your-experiment-feature-flag",
                DistinctId: "distinct-id",
            })
            if err != nil {
                // Handle error (e.g. capture error and fallback to default behaviour)
            }
            if experimentFlagValue == "test" {
                // Do something differently for this user
            } else {
                // It's a good idea to let control variant always be the default behaviour,
                // so if something goes wrong with flag evaluation, you don't break your app.
            }
        `,
        android: dedent`
            if (Insights.getFeatureFlag("your-experiment-feature-flag") == "test") {
                // do something
            } else {
                // It's a good idea to let control variant always be the default behaviour,
                // so if something goes wrong with flag evaluation, you don't break your app.
            }
        `,
        ios: dedent`
            if (InsightsSDK.shared.getFeatureFlag("your-experiment-feature-flag") as? String == "test") {
                // do something
            } else {
                // It's a good idea to let control variant always be the default behaviour,
                // so if something goes wrong with flag evaluation, you don't break your app.
            }
        `,
        flutter: dedent`
            if (await Insights().getFeatureFlag('your-experiment-feature-flag') == 'test') {
                // Do something differently for this user
            } else {
                // It's a good idea to let control variant always be the default behaviour,
                // so if something goes wrong with flag evaluation, you don't break your app.
            }
        `,
    }

    const langMap: Record<string, string> = {
        javascript: 'javascript',
        react: 'jsx',
        'react-native': 'javascript',
        'node.js': 'javascript',
        python: 'python',
        php: 'php',
        ruby: 'ruby',
        go: 'go',
        android: 'kotlin',
        ios: 'swift',
        flutter: 'dart',
    }

    return <CodeBlock language={langMap[language] || 'javascript'} code={snippets[language] || snippets.javascript} />
})
