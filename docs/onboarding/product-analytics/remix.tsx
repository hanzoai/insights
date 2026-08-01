import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/shared/OnboardingDocsContentWrapper'

import { StepDefinition } from '../steps'
import { SDK_DEFAULTS_DATE } from './_snippets/sdkDefaults'

export const getRemixSteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
    const { CodeBlock, Markdown, CalloutBox, dedent, snippets } = ctx

    const JSEventCapture = snippets?.JSEventCapture

    return [
        {
            title: 'Install the package',
            badge: 'required',
            content: (
                <>
                    <CalloutBox type="fyi" title="Remix version">
                        <Markdown>
                            This guide is for Remix v2. For Remix v3, see our [React Router v7
                            docs](https://hanzo.ai/docs/libraries/react-router).
                        </Markdown>
                    </CalloutBox>
                    <Markdown>Install the Insights JavaScript library using your package manager:</Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'bash',
                                file: 'npm',
                                code: dedent`
                                    npm install insights-js
                                `,
                            },
                            {
                                language: 'bash',
                                file: 'yarn',
                                code: dedent`
                                    yarn add insights-js
                                `,
                            },
                            {
                                language: 'bash',
                                file: 'pnpm',
                                code: dedent`
                                    pnpm add insights-js
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
                        Add `insights-js` and `@hanzo/react` to `ssr.noExternal` in your `vite.config.ts` so they get
                        bundled for SSR:
                    </Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'typescript',
                                file: 'vite.config.ts',
                                code: dedent`
                                    // ... imports and rest of config

                                    export default defineConfig({
                                      plugins: [
                                        remix({
                                          future: {
                                            v3_fetcherPersist: true,
                                            v3_relativeSplatPath: true,
                                            v3_throwAbortReason: true,
                                            v3_singleFetch: true,
                                            v3_lazyRouteDiscovery: true,
                                          },
                                        }),
                                        tsconfigPaths(),
                                      ],
                                      ssr: {
                                        noExternal: ["insights-js", "@hanzo/react"],
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
            title: 'Create a provider',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Create a `provider.tsx` file in the app folder. Set up the Insights provider to initialize after
                        hydration:
                    </Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'typescript',
                                file: 'app/provider.tsx',
                                code: dedent`
                                    import { useEffect, useState } from "react";
                                    import insights from "insights-js";
                                    import { InsightsProvider } from "@hanzo/react";

                                    export function PHProvider({ children }: { children: React.ReactNode }) {
                                      const [hydrated, setHydrated] = useState(false);

                                      useEffect(() => {
                                        insights.init("<ph_project_token>", {
                                          api_host: "<ph_client_api_host>",
                                          defaults: "${SDK_DEFAULTS_DATE}"
                                        });

                                        setHydrated(true);
                                      }, []);

                                      if (!hydrated) return <>{children}</>;
                                      return <InsightsProvider client={insights}>{children}</InsightsProvider>;
                                    }
                                `,
                            },
                        ]}
                    />
                </>
            ),
        },
        {
            title: 'Wrap your app',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Import the `PHProvider` component in your `app/root.tsx` file and use it to wrap your app:
                    </Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'typescript',
                                file: 'app/root.tsx',
                                code: dedent`
                                    // ... imports
                                    import { PHProvider } from "./provider";

                                    // ... links, meta, etc.

                                    export function Layout({ children }: { children: React.ReactNode }) {
                                      return (
                                        <html lang="en">
                                          <head>
                                            <meta charSet="utf-8" />
                                            <meta name="viewport" content="width=device-width, initial-scale=1" />
                                            <Meta />
                                            <Links />
                                          </head>
                                          <body>
                                            <PHProvider>
                                              {children}
                                              <ScrollRestoration />
                                              <Scripts />
                                            </PHProvider>
                                          </body>
                                        </html>
                                      );
                                    }

                                    export default function App() {
                                      return <Outlet />;
                                    }
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

export const RemixInstallation = createInstallation(getRemixSteps)
