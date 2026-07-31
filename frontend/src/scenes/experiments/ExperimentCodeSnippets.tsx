import { Link } from '@hanzo/elements'

import { CodeSnippet, Language } from 'lib/components/CodeSnippet'

function ServerSideWarning(): JSX.Element {
    return (
        <div className="warning">
            <p>
                <b>Warning:</b> Server side experiment metrics require you to manually send the feature flag
                information.{' '}
                <Link to="https://hanzo.ai/docs/experiments/adding-experiment-code" target="_blank">
                    See this tutorial for more information.
                </Link>
            </p>
        </div>
    )
}

interface SnippetProps {
    flagKey: string
    variant: string
}

export function AndroidSnippet({ flagKey, variant }: SnippetProps): JSX.Element {
    return (
        <>
            <CodeSnippet language={Language.Kotlin} wrap>
                {`if (Insights.getFeatureFlag("${flagKey}") == "${variant}") {
    // do something
} else {
    // It's a good idea to let control variant always be the default behaviour,
    // so if something goes wrong with flag evaluation, you don't break your app.
}`}
            </CodeSnippet>
        </>
    )
}

export function IOSSnippet({ flagKey, variant }: SnippetProps): JSX.Element {
    return (
        <>
            <CodeSnippet language={Language.Swift} wrap>
                {`if (InsightsSDK.shared.getFeatureFlag("${flagKey}") as? String == "${variant}") {
    // do something
} else {
    // It's a good idea to let control variant always be the default behaviour,
    // so if something goes wrong with flag evaluation, you don't break your app.
}`}
            </CodeSnippet>
        </>
    )
}

export function NodeJSSnippet({ flagKey, variant }: SnippetProps): JSX.Element {
    return (
        <>
            <CodeSnippet language={Language.JavaScript} wrap>
                {`const experimentFlagValue = await client.getFeatureFlag('${flagKey}', 'user distinct id')

if (experimentFlagValue === '${variant}' ) {
    // Do something differently for this user
} else {
    // It's a good idea to let control variant always be the default behaviour,
    // so if something goes wrong with flag evaluation, you don't break your app.
}`}
            </CodeSnippet>
            <ServerSideWarning />
        </>
    )
}

export function JSSnippet({ flagKey, variant }: SnippetProps): JSX.Element {
    return (
        <div>
            <CodeSnippet language={Language.JavaScript} wrap>
                {`if (insights.getFeatureFlag('${flagKey}') === '${variant}') {
    // Do something differently for this user
} else {
    // It's a good idea to let control variant always be the default behaviour,
    // so if something goes wrong with flag evaluation, you don't break your app.
}`}
            </CodeSnippet>
            <div className="mt-4 mb-1">
                <b>Test that it works</b>
            </div>
            <CodeSnippet language={Language.JavaScript} wrap>
                {`insights.featureFlags.overrideFeatureFlags({ flags: {'${flagKey}': '${variant}'} })`}
            </CodeSnippet>
        </div>
    )
}

export function ReactSnippet({ flagKey, variant }: SnippetProps): JSX.Element {
    return (
        <>
            <CodeSnippet language={Language.JavaScript} wrap>
                {`// You can either use the useFeatureFlagVariantKey hook,
// or you can use the feature flags component - https://hanzo.ai/docs/libraries/react#feature-flags-react-component

// Method one: using the useFeatureFlagVariantKey hook
import { useFeatureFlagVariantKey } from '@hanzo/insights/react'

function App() {
    const variant = useFeatureFlagVariantKey('${flagKey}')
    if (variant === '${variant}') {
        // do something
    }
}

// Method two: using the feature flags component
import { InsightsFeature } from '@hanzo/insights/react'

function App() {
    return (
        <InsightsFeature flag='${flagKey}' match='${variant}'>
            <div>
                {/* the component to show */}
            </div>
        </InsightsFeature>
    )
}

// You can also test your code by overriding the feature flag:
insights.featureFlags.overrideFeatureFlags({ flags: {'${flagKey}': '${variant}'} })`}
            </CodeSnippet>
        </>
    )
}

export function RNSnippet({ flagKey, variant }: SnippetProps): JSX.Element {
    return (
        <>
            <CodeSnippet language={Language.JavaScript} wrap>
                {`if (insights.getFeatureFlag('${flagKey}') === '${variant}') {
    // Do something differently for this user
} else {
    // It's a good idea to let control variant always be the default behaviour,
    // so if something goes wrong with flag evaluation, you don't break your app.
}`}
            </CodeSnippet>
        </>
    )
}

export function PHPSnippet({ flagKey, variant }: SnippetProps): JSX.Element {
    return (
        <>
            <CodeSnippet language={Language.PHP} wrap>
                {`if (Insights::getFeatureFlag('${flagKey}', 'user distinct id') == '${variant}') {
    // Do something differently for this user
} else {
    // It's a good idea to let control variant always be the default behaviour,
    // so if something goes wrong with flag evaluation, you don't break your app.
}`}
            </CodeSnippet>
            <ServerSideWarning />
        </>
    )
}

export function GolangSnippet({ flagKey, variant }: SnippetProps): JSX.Element {
    return (
        <>
            <CodeSnippet language={Language.Go} wrap>
                {`experimentFlagValue, err := client.GetFeatureFlag(insights.FeatureFlagPayload{
    Key:        '${flagKey}',
    DistinctId: "distinct-id",
})
if err != nil {
    // Handle error (e.g. capture error and fallback to default behaviour)
}
if experimentFlagValue == '${variant}' {
    // Do something differently for this user
} else {
    // It's a good idea to let control variant always be the default behaviour,
    // so if something goes wrong with flag evaluation, you don't break your app.
}`}
            </CodeSnippet>
            <ServerSideWarning />
        </>
    )
}

export function FlutterSnippet({ flagKey, variant }: SnippetProps): JSX.Element {
    const clientSuffix = 'await Insights().'
    const flagFunction = 'getFeatureFlag'
    const variantSuffix = ` == '${variant}'`

    return (
        <>
            <CodeSnippet language={Language.Dart} wrap>
                {`if (${clientSuffix}${flagFunction}('${flagKey}')${variantSuffix}) {
  // Do something differently for this user
} else {
  // It's a good idea to let control variant always be the default behaviour,
  // so if something goes wrong with flag evaluation, you don't break your app.
}
            `}
            </CodeSnippet>
        </>
    )
}

export function RubySnippet({ flagKey, variant }: SnippetProps): JSX.Element {
    return (
        <>
            <CodeSnippet language={Language.Ruby} wrap>
                {`experimentFlagValue = insights.get_feature_flag('${flagKey}', 'user distinct id')


if experimentFlagValue == '${variant}'
    # Do something differently for this user
else
    # It's a good idea to let control variant always be the default behaviour,
    # so if something goes wrong with flag evaluation, you don't break your app.
end
`}
            </CodeSnippet>
            <ServerSideWarning />
        </>
    )
}

export function PythonSnippet({ flagKey, variant }: SnippetProps): JSX.Element {
    return (
        <>
            <CodeSnippet language={Language.Python} wrap>
                {`experiment_flag_value = insights.get_feature_flag("${flagKey}", "user_distinct_id"):

if experiment_flag_value == '${variant}':
    # Do something differently for this user
else:
    # It's a good idea to let control variant always be the default behaviour,
    # so if something goes wrong with flag evaluation, you don't break your app.
`}
            </CodeSnippet>
            <ServerSideWarning />
        </>
    )
}

export function JavaSnippet({ flagKey, variant }: SnippetProps): JSX.Element {
    return (
        <>
            <CodeSnippet language={Language.Java} wrap>
                {`Object flagValue = insights.getFeatureFlag("user distinct id", "${flagKey}");
if ("${variant}".equals(flagValue)) {
    // Do something differently for this user
} else {
    // It's a good idea to let control variant always be the default behaviour,
    // so if something goes wrong with flag evaluation, you don't break your app.
}
`}
            </CodeSnippet>
            <ServerSideWarning />
        </>
    )
}
