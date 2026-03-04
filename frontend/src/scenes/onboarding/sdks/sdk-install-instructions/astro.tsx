import { CodeSnippet, Language } from 'lib/components/CodeSnippet'
import { useJsSnippet } from 'lib/components/JSSnippet'
import { Link } from 'lib/lemon-ui/Link'

import SetupWizardBanner from './components/SetupWizardBanner'

function CreateInsightsAstroFileSnippet(): JSX.Element {
    return (
        <CodeSnippet language={Language.Bash}>
            {`cd ./src/components 
# or 'cd ./src && mkdir components && cd ./components' if your components folder doesn't exist 
touch insights.astro`}
        </CodeSnippet>
    )
}

function AstroSetupSnippet(): JSX.Element {
    const jsSnippetScriptTag = useJsSnippet(0, undefined, 'is:inline')
    return (
        <>
            <CodeSnippet language={Language.JavaScript}>
                {`---
// src/components/insights.astro
---
${jsSnippetScriptTag}
`}
            </CodeSnippet>
        </>
    )
}

function CreateLayoutSnippet(): JSX.Element {
    return (
        <CodeSnippet language={Language.Bash}>
            {`cd ./src/layouts
# or 'cd ./src && mkdir layouts && cd ./layouts' if your layouts folder doesn't exist 
touch InsightsLayout.astro`}
        </CodeSnippet>
    )
}

function LayoutCodeSnippet(): JSX.Element {
    return (
        <CodeSnippet language={Language.JavaScript}>
            {`---
import Insights from '../components/insights.astro'
---
<head>
    <Insights />
</head>`}
        </CodeSnippet>
    )
}

function IndexPageSnippet(): JSX.Element {
    return (
        <CodeSnippet language={Language.JavaScript}>
            {`---
import InsightsLayout from '../layouts/InsightsLayout.astro';
---
<InsightsLayout>
  <!-- your existing app components -->
</InsightsLayout>`}
        </CodeSnippet>
    )
}

export function SDKInstallAstroInstructions({ hideWizard }: { hideWizard?: boolean }): JSX.Element {
    return (
        <>
            <SetupWizardBanner integrationName="Astro" hide={hideWizard} />
            <h3>1. Create the Insights component</h3>
            <p>
                In your <code>src/components</code> folder, create a <code>insights.astro</code> file:
            </p>
            <CreateInsightsAstroFileSnippet />
            <p>
                In this file, add your Insights web snippet. Be sure to include the <code>is:inline</code> directive{' '}
                <Link
                    to="https://docs.astro.build/en/guides/client-side-scripts/#opting-out-of-processing"
                    target="_blank"
                >
                    to prevent Astro from processing it
                </Link>
                , or you will get TypeScript and build errors that property 'insights' does not exist on type 'Window &
                typeof globalThis':
            </p>
            <AstroSetupSnippet />

            <h3>2. Create a layout</h3>
            <p>
                Create a layout where we will use <code>insights.astro</code>. Create a new file{' '}
                <code>InsightsLayout.astro</code> in your <code>src/layouts</code> folder:
            </p>
            <CreateLayoutSnippet />
            <p>
                Add the following code to <code>InsightsLayout.astro</code>:
            </p>
            <LayoutCodeSnippet />

            <h3>3. Use the layout in your pages</h3>
            <p>
                Finally, update your pages (like <code>index.astro</code>) to wrap your existing app components with the
                new layout:
            </p>
            <IndexPageSnippet />
        </>
    )
}
