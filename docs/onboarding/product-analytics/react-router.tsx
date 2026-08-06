import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/shared/OnboardingDocsContentWrapper'

import { StepDefinition } from '../steps'
import { SDK_DEFAULTS_DATE } from './_snippets/sdkDefaults'

export const getReactRouterSteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
    const { CodeBlock, Markdown, dedent, snippets } = ctx

    const JSEventCapture = snippets?.JSEventCapture

    return [
        {
            title: 'Install the package',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Install the Insights JavaScript library and React SDK using your package manager:
                    </Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'bash',
                                file: 'npm',
                                code: dedent`
                                    npm install --save insights-js @hanzo/react
                                `,
                            },
                            {
                                language: 'bash',
                                file: 'yarn',
                                code: dedent`
                                    yarn add insights-js @hanzo/react
                                `,
                            },
                            {
                                language: 'bash',
                                file: 'pnpm',
                                code: dedent`
                                    pnpm add insights-js @hanzo/react
                                `,
                            },
                        ]}
                    />
                </>
            ),
        },
        {
            title: 'Configure Vite',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Add `insights-js` and `@hanzo/react` to `ssr.noExternal` in your `vite.config.ts` to avoid SSR
                        errors:
                    </Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'typescript',
                                file: 'vite.config.ts',
                                code: dedent`
                                    // ... imports

                                    export default defineConfig({
                                      plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
                                      ssr: {
                                        noExternal: ['insights-js', '@hanzo/react'],
                                      },
                                    });
                                `,
                            },
                        ]}
                    />
                </>
            ),
        },
        {
            title: 'Add the InsightsProvider',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Initialize Insights and wrap your app with the `InsightsProvider` in your `app/entry.client.tsx`
                        file:
                    </Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'typescript',
                                file: 'app/entry.client.tsx',
                                code: dedent`
                                    import { startTransition, StrictMode } from "react";
                                    import { hydrateRoot } from "react-dom/client";
                                    import { HydratedRouter } from "react-router/dom";
                                    import insights from "insights-js";
                                    import { InsightsProvider } from "@hanzo/react";

                                    insights.init("<ph_project_token>", {
                                      api_host: "<ph_client_api_host>",
                                      defaults: "${SDK_DEFAULTS_DATE}",
                                    });

                                    startTransition(() => {
                                      hydrateRoot(
                                        document,
                                        <InsightsProvider client={insights}>
                                          <StrictMode>
                                            <HydratedRouter />
                                          </StrictMode>
                                        </InsightsProvider>,
                                      );
                                    });
                                `,
                            },
                        ]}
                    />
                </>
            ),
        },
        {
            title: 'Send events',
            badge: undefined,
            content: <>{JSEventCapture && <JSEventCapture />}</>,
        },
    ]
}

export const ReactRouterInstallation = createInstallation(getReactRouterSteps)
