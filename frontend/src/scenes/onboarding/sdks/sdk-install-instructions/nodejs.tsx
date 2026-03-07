import { useValues } from 'kea'

import { CodeSnippet, Language } from 'lib/components/CodeSnippet'
import { apiHostOrigin } from 'lib/utils/apiHost'
import { teamLogic } from 'scenes/teamLogic'

type InsightsNodeOptions = {
    enableExceptionAutocapture?: boolean
}

export function NodeInstallSnippet(): JSX.Element {
    return (
        <CodeSnippet language={Language.Bash}>
            {`npm install insights-node
# OR
yarn add insights-node
# OR
pnpm add insights-node`}
        </CodeSnippet>
    )
}

export function NodeSetupSnippet({ enableExceptionAutocapture = false }: InsightsNodeOptions): JSX.Element {
    const { currentTeam } = useValues(teamLogic)

    const options = [`host: '${apiHostOrigin()}'`]

    if (enableExceptionAutocapture) {
        options.push('enableExceptionAutocapture: true')
    }

    return (
        <CodeSnippet language={Language.JavaScript}>
            {`import { Insights } from 'insights-node'

const client = new Insights(
    '${currentTeam?.api_token}',
    {
        ${options.join(',\n        ')}
    }
)`}
        </CodeSnippet>
    )
}

export function SDKInstallNodeInstructions(props: InsightsNodeOptions): JSX.Element {
    return (
        <>
            <h3>Install</h3>
            <NodeInstallSnippet />
            <h3>Configure</h3>
            <NodeSetupSnippet {...props} />
        </>
    )
}
