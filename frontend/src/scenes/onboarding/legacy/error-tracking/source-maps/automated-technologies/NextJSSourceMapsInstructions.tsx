import { useValues } from 'kea'

import { CodeSnippet, Language } from 'lib/components/CodeSnippet'
import { apiHostOrigin } from 'lib/utils/apiHost'
import { teamLogic } from 'scenes/teamLogic'

import { SourceMapsAPIKeyBanner } from '../SourceMapsAPIKeyBanner'
import { VerifySourceMaps } from '../VerifySourceMaps'

export function NextJSSourceMapsInstructions(): JSX.Element {
    const { currentTeam } = useValues(teamLogic)
    const host = apiHostOrigin()

    return (
        <>
            <SourceMapsAPIKeyBanner />

            <h3>Install the Insights Next.js config package</h3>
            <p>
                This package handles automatic source map generation and upload for error tracking. Install it using
                your package manager:
            </p>
            <CodeSnippet language={Language.Bash}>
                {[
                    'npm install @hanzo/nextjs-config',
                    '# OR',
                    'yarn add @hanzo/nextjs-config',
                    '# OR',
                    'pnpm add @hanzo/nextjs-config',
                ].join('\n')}
            </CodeSnippet>

            <h3>Add Insights config to your Next.js app</h3>
            <p>
                Add the following to your <code>next.config.js</code> file:
            </p>
            <CodeSnippet language={Language.JavaScript}>
                {nextConfig(currentTeam?.id?.toString() ?? '<team_id>', host)}
            </CodeSnippet>

            <h3>Build your project for production</h3>
            <p>
                Build your project for production. The Next.js config package will automatically generate and upload
                source maps to Insights during the build process.
            </p>

            <VerifySourceMaps />
        </>
    )
}

const nextConfig = (
    teamId: string,
    host: string
): string => `import { withInsightsConfig } from "@hanzo/nextjs-config";

const nextConfig = {
  //...your nextjs config,
};

export default withInsightsConfig(nextConfig, {
  personalApiKey: '<ph_personal_api_key>', // Your personal API key from Insights settings
  envId: '${teamId}', // Your environment ID (project ID)
  host: '${host}', // Optional: Your Insights instance URL, defaults to https://us.hanzo.ai
  sourcemaps: { // Optional
    enabled: true, // Optional: Enable sourcemaps generation and upload, defaults to true on production builds
    project: "my-application", // Optional: Project name, defaults to git repository name
    version: "1.0.0", // Optional: Release version, defaults to current git commit
    deleteAfterUpload: true, // Optional: Delete sourcemaps after upload, defaults to true
  },
});`
