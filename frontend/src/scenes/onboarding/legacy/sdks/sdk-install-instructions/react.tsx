import { useValues } from 'kea'

import { CodeSnippet, Language } from 'lib/components/CodeSnippet'
import { apiHostOrigin } from 'lib/utils/apiHost'
import SetupWizardBanner from 'scenes/onboarding/shared/SetupWizardBanner'
import { teamLogic } from 'scenes/teamLogic'

import { SDK_DEFAULTS_DATE } from '~/loadInsightsJS'

import { ReactInstallSnippet } from './js-web'

function ReactEnvVarsSnippet(): JSX.Element {
    const { currentTeam } = useValues(teamLogic)

    return (
        <CodeSnippet language={Language.Bash}>
            {[`VITE_POSTFN_PROJECT_TOKEN=${currentTeam?.api_token}`, `VITE_POSTFN_HOST=${apiHostOrigin()}`].join(
                '\n'
            )}
        </CodeSnippet>
    )
}

function ReactSetupSnippet(): JSX.Element {
    return (
        <CodeSnippet language={Language.JavaScript}>
            {`import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { InsightsProvider } from '@hanzo/react'

const options = {
  api_host: import.meta.env.VITE_POSTFN_HOST,
  defaults: '${SDK_DEFAULTS_DATE}',
} as const

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <InsightsProvider apiKey={import.meta.env.VITE_POSTFN_PROJECT_TOKEN} options={options}>
      <App />
    </InsightsProvider>
  </StrictMode>
)`}
        </CodeSnippet>
    )
}

export function SDKInstallReactInstructions({ hideWizard }: { hideWizard?: boolean }): JSX.Element {
    return (
        <>
            <SetupWizardBanner integrationName="React" hide={hideWizard} />
            <h3>Install the package</h3>
            <ReactInstallSnippet />
            <h3>Add environment variables</h3>
            <ReactEnvVarsSnippet />
            <h3>Initialize</h3>
            <p>
                Integrate Insights at the root of your app (such as <code>main.tsx</code> if you're using Vite).
            </p>
            <ReactSetupSnippet />
        </>
    )
}
