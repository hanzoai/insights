import { useValues } from 'kea'

import { Link } from '@hanzo/elements'

import { CodeSnippet, Language } from 'lib/components/CodeSnippet'
import { apiHostOrigin } from 'lib/utils/apiHost'
import { teamLogic } from 'scenes/teamLogic'

import SetupWizardBanner from './components/SetupWizardBanner'

export interface RNSetupProps {
    hideWizard?: boolean
    includeReplay?: boolean
    includeSurveys?: boolean
}

function RNInstallSnippet({ includeReplay, includeSurveys }: RNSetupProps): JSX.Element {
    return (
        <CodeSnippet language={Language.Bash}>
            {`# Expo apps
npx expo install insights-react-native expo-file-system expo-application expo-device expo-localization${
                includeReplay ? ` insights-react-native-session-replay` : ''
            }${includeSurveys ? ` react-native-safe-area-context react-native-svg` : ''}

# Standard React Native apps
yarn add insights-react-native @react-native-async-storage/async-storage react-native-device-info react-native-localize${
                includeReplay ? ` insights-react-native-session-replay` : ''
            }${includeSurveys ? ` react-native-safe-area-context react-native-svg` : ''}
# or
npm i -s insights-react-native @react-native-async-storage/async-storage react-native-device-info react-native-localize${
                includeReplay ? ` insights-react-native-session-replay` : ''
            }${includeSurveys ? ` react-native-safe-area-context react-native-svg` : ''}

# for iOS
cd ios
pod install`}
        </CodeSnippet>
    )
}

function RNSetupSnippet({ includeReplay }: RNSetupProps): JSX.Element {
    const { currentTeam } = useValues(teamLogic)
    const url = apiHostOrigin()

    return (
        <>
            <p>
                Insights is most easily used via the <code>InsightsProvider</code> component but if you need to
                instantiate it directly,{' '}
                <Link to="https://hanzo.ai/docs/libraries/react-native#without-the-insightsprovider">
                    check out the docs
                </Link>{' '}
                which explain how to do this correctly.
            </p>
            <CodeSnippet language={Language.JSX}>
                {`// App.(js|ts)
import { InsightsProvider } from 'insights-react-native'
...

export function MyApp() {
    return (
        <InsightsProvider apiKey="${currentTeam?.api_token}" options={{
            host: "${url}",
            ${
                includeReplay
                    ? `
            // check https://hanzo.ai/docs/session-replay/installation?tab=React+Native
            // for more config and to learn about how we capture sessions on mobile
            // and what to expect
            enableSessionReplay: true,
            sessionReplayConfig: {
                // Whether text inputs are masked. Default is true.
                // Password inputs are always masked regardless
                maskAllTextInputs: true,
                // Whether images are masked. Default is true.
                maskAllImages: true,
                // Capture logs automatically. Default is true.
                // Android only (Native Logcat only)
                captureLog: true,
                // Whether network requests are captured in recordings. Default is true
                // Only metric-like data like speed, size, and response code are captured.
                // No data is captured from the request or response body.
                // iOS only
                captureNetworkTelemetry: true,
                // Throttling delay used to reduce the number of snapshots captured and reduce performance impact
                // The lower the number more snapshots will be captured but higher the performance impact
                // Default is 1000ms
                throttleDelayMs: 1000,
            },`
                    : ''
            }
        }}>
            <RestOfApp />
        </InsightsProvider>
    )
}`}
            </CodeSnippet>
        </>
    )
}

function RNSetupSurveysProvider(): JSX.Element {
    return (
        <>
            <p>
                Add InsightsSurveyProvider to your app anywhere inside InsightsProvider. This component fetches surveys.
                It also acts as the root for where popover surveys are rendered.
            </p>
            <CodeSnippet language={Language.JSX}>
                {`<InsightsProvider>
    <InsightsSurveyProvider>{children}</InsightsSurveyProvider>
</InsightsProvider>`}
            </CodeSnippet>
            <p>
                If you're not using the InsightsProvider, add InsightsSurveyProvider to your app anywhere inside your app
                root component.
            </p>
            <CodeSnippet language={Language.JSX}>
                {`<YourAppRoot>
  <InsightsSurveyProvider>{children}</InsightsSurveyProvider>
</YourAppRoot>`}
            </CodeSnippet>
            <p>You can also pass your client instance to the InsightsSurveyProvider.</p>
            <CodeSnippet language={Language.JSX}>{`<InsightsSurveyProvider client={insights}>`}</CodeSnippet>
        </>
    )
}

export function SDKInstallRNInstructions(props: RNSetupProps): JSX.Element {
    return (
        <>
            <SetupWizardBanner integrationName="React Native" hide={props.hideWizard} />
            <h3>Install</h3>
            <RNInstallSnippet includeReplay={props.includeReplay} includeSurveys={props.includeSurveys} />
            <h3>Configure</h3>
            <RNSetupSnippet includeReplay={props.includeReplay} />
            {props.includeSurveys && (
                <>
                    <h3>Setup SurveysProvider</h3>
                    <RNSetupSurveysProvider />
                </>
            )}
        </>
    )
}
