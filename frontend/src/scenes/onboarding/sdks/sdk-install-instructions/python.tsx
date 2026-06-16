import { useValues } from 'kea'

import { CodeSnippet, Language } from 'lib/components/CodeSnippet'
import { apiHostOrigin } from 'lib/utils/apiHost'
import { teamLogic } from 'scenes/teamLogic'

type InsightsPythonOptions = {
    enableExceptionAutocapture?: boolean
}

function PythonInstallSnippet(): JSX.Element {
    return <CodeSnippet language={Language.Bash}>pip install insights</CodeSnippet>
}

export function PythonSetupSnippet({ enableExceptionAutocapture = false }: InsightsPythonOptions): JSX.Element {
    const { currentTeam } = useValues(teamLogic)

    const options = [`host='${apiHostOrigin()}'`]

    if (enableExceptionAutocapture) {
        options.push('enable_exception_autocapture=True')
    }

    return (
        <CodeSnippet language={Language.Python}>
            {`from insights import Insights

insights = Insights(
  project_api_key='${currentTeam?.api_token}',
  ${options.join(',\n  ')}
)`}
        </CodeSnippet>
    )
}

export function SDKInstallPythonInstructions(props: InsightsPythonOptions): JSX.Element {
    return (
        <>
            <h3>Install</h3>
            <PythonInstallSnippet />
            <h3>Configure</h3>
            <PythonSetupSnippet {...props} />
        </>
    )
}
