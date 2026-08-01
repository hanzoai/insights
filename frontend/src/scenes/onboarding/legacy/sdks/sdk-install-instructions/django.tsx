import { useValues } from 'kea'

import { CodeSnippet, Language } from 'lib/components/CodeSnippet'
import { apiHostOrigin } from 'lib/utils/apiHost'
import SetupWizardBanner from 'scenes/onboarding/shared/SetupWizardBanner'
import { teamLogic } from 'scenes/teamLogic'

function DjangoInstallSnippet(): JSX.Element {
    return <CodeSnippet language={Language.Bash}>pip install insights</CodeSnippet>
}

function DjangoAppConfigSnippet(): JSX.Element {
    const { currentTeam } = useValues(teamLogic)

    return (
        <CodeSnippet language={Language.Python}>
            {`from django.apps import AppConfig
import insights

class YourAppConfig(AppConfig):
    name = "your_app_name"
    def ready(self):
        insights.api_key = '${currentTeam?.api_token}'
        insights.host = '${apiHostOrigin()}'`}
        </CodeSnippet>
    )
}

function DjangoSettingsSnippet(): JSX.Element {
    return (
        <CodeSnippet language={Language.Python}>
            {`INSTALLED_APPS = [
    # other apps
    'your_app_name.apps.MyAppConfig',  # Add your app config
] `}
        </CodeSnippet>
    )
}

export function SDKInstallDjangoInstructions(): JSX.Element {
    return (
        <>
            <SetupWizardBanner integrationName="Django" />
            <h3>Install</h3>
            <DjangoInstallSnippet />
            <h3>Configure</h3>
            <p>
                Set the Insights project token and host in your <code>AppConfig</code> in <code>apps.py</code> so that's
                it's available everywhere:
            </p>
            <DjangoAppConfigSnippet />
            <p />
            Next, if you haven't done so already, make sure you add your <code>AppConfig</code> to your{' '}
            <code>settings.py</code> under <code>INSTALLED_APPS</code>:
            <DjangoSettingsSnippet />
        </>
    )
}
