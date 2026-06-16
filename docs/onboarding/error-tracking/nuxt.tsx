import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/OnboardingDocsContentWrapper'

import { StepDefinition } from '../steps'

export const getNuxt37Steps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
    const { CodeBlock, Markdown, CalloutBox, dedent } = ctx

    return [
        {
            title: 'Install the Insights Nuxt module',
            badge: 'required',
            content: (
                <>
                    <Markdown>Install the Insights Nuxt module using your package manager:</Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'bash',
                                file: 'npm',
                                code: dedent`
                                    npm install @hanzo/nuxt
                                `,
                            },
                            {
                                language: 'bash',
                                file: 'yarn',
                                code: dedent`
                                    yarn add @hanzo/nuxt
                                `,
                            },
                            {
                                language: 'bash',
                                file: 'pnpm',
                                code: dedent`
                                    pnpm add @hanzo/nuxt
                                `,
                            },
                            {
                                language: 'bash',
                                file: 'bun',
                                code: dedent`
                                    bun add @hanzo/nuxt
                                `,
                            },
                        ]}
                    />
                    <Markdown>Add the module to your `nuxt.config.ts` file:</Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'typescript',
                                file: 'nuxt.config.ts',
                                code: dedent`
                                  export default defineNuxtConfig({
                                    modules: ['@hanzo/nuxt'],
                                    // Enable source maps generation in both vue and nitro
                                    sourcemap: {
                                      client: 'hidden'
                                    },
                                    nitro: {
                                      rollupConfig: {
                                        output: {
                                          sourcemapExcludeSources: false,
                                        },
                                      },
                                    },
                                    insightsConfig: {
                                      publicKey: '<ph_project_api_key>', // Find it in project settings https://insights.hanzo.ai/settings/project
                                      host: 'https://us.i.hanzo.ai', // Optional: defaults to https://us.i.hanzo.ai. Use https://eu.i.hanzo.ai for EU region
                                      clientConfig: {
                                        capture_exceptions: true, // Enables automatic exception capture on the client side (Vue)
                                      },
                                      serverConfig: {
                                        enableExceptionAutocapture: true, // Enables automatic exception capture on the server side (Nitro)
                                      },
                                      sourcemaps: {
                                        enabled: true,
                                        project: '<ph_project_id>', // Your project ID from Insights settings https://insights.hanzo.ai/settings/environment#variables
                                        personalApiKey: '<ph_personal_api_key>', // Your personal API key from Insights settings https://insights.hanzo.ai/settings/user-api-keys (requires organization:read and error_tracking:write scopes)
                                        releaseName: 'my-application', // Optional: defaults to git repository name
                                        releaseVersion: '1.0.0', // Optional: defaults to current git commit
                                      },
                                    },
                                  })
                                `,
                            },
                        ]}
                    />
                    <CalloutBox type="fyi" title="Personal API Key">
                        <Markdown>
                            Your Personal API Key will require `organization:read` and `error_tracking:write` scopes.
                        </Markdown>
                    </CalloutBox>
                    <Markdown>
                        {dedent`
                        The module will automatically:
                        - Initialize Insights on both Vue (client side) and Nitro (server side)
                        - Capture exceptions on both client and server
                        - Generate and upload source maps during build
                      `}
                    </Markdown>
                </>
            ),
        },
        {
            title: 'Manually capturing exceptions',
            badge: 'optional',
            content: (
                <>
                    <Markdown>
                        {dedent`
                            Our module if set up as shown above already captures both client and server side exceptions automatically.

                            To send errors manually on the client side, import it and use the \`captureException\` method like this:
                        `}
                    </Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'html',
                                file: 'Vue',
                                code: dedent`
                                  <script>
                                    const { $insights } = useNuxtApp()
                                    if ($insights) {
                                      const insights = $insights()
                                      insights.captureException(new Error("Important error message"))
                                    }
                                  </script>
                                `,
                            },
                        ]}
                    />
                    <Markdown>On the server side instantiate Insights using:</Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'javascript',
                                file: 'server/api/example.js',
                                code: dedent`
                                  const runtimeConfig = useRuntimeConfig()
                                  const insights = new Insights(
                                    runtimeConfig.public.insightsPublicKey,
                                    {
                                      host: runtimeConfig.public.insightsHost,
                                    }
                                  );
                                  try {
                                    const results = await DB.query.users.findMany()
                                    return results
                                  } catch (error) {
                                    insights.captureException(error)
                                  }
                                `,
                            },
                        ]}
                    />
                </>
            ),
        },
        {
            title: 'Build your project for production',
            badge: 'required',
            content: (
                <>
                    <Markdown>Build your project for production by running the following command:</Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'bash',
                                file: 'Terminal',
                                code: dedent`
                                    nuxt build
                                `,
                            },
                        ]}
                    />
                    <Markdown>
                        The Insights module will automatically **generate and upload source maps** to Insights during the
                        build process.
                    </Markdown>
                </>
            ),
        },
        {
            title: 'Verify source map upload',
            badge: 'recommended',
            checkpoint: true,
            content: (
                <Markdown>
                    {dedent`
                        Before proceeding, confirm that source maps are being properly uploaded.

                        You can verify the injection is successful by checking your \`.mjs.map\` source map files for \`//# chunkId=\` comments. Make sure to serve these injected files in production, Insights will check for the \`//# chunkId\` comments to display the correct stack traces.

                        [Check symbol sets in Insights](https://insights.hanzo.ai/settings/project-error-tracking#error-tracking-symbol-sets)
                    `}
                </Markdown>
            ),
        },
        {
            title: 'Verify error tracking',
            badge: 'recommended',
            checkpoint: true,
            content: (
                <Markdown>
                    {dedent`
                        Before proceeding, let's make sure exception events are being captured and sent to Insights. You should see events appear in the activity feed.

                        [Check for exceptions in Insights](https://insights.hanzo.ai/activity/explore)
                    `}
                </Markdown>
            ),
        },
    ]
}

export const Nuxt37Installation = createInstallation(getNuxt37Steps)
