import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/OnboardingDocsContentWrapper'

import { StepDefinition } from '../steps'

export const getNextJSClientSteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
    const { CodeBlock, Markdown, CalloutBox, Tab, dedent } = ctx

    return [
        {
            title: 'Install the package',
            badge: 'required',
            content: (
                <>
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
            title: 'Add environment variables',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Add your Insights API key and host to your `.env.local` file and to your hosting provider (e.g.
                        Vercel, Netlify). These values need to start with `NEXT_PUBLIC_` to be accessible on the
                        client-side.
                    </Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'bash',
                                file: '.env.local',
                                code: dedent`
                                    NEXT_PUBLIC_INSIGHTS_KEY=<ph_project_api_key>
                                    NEXT_PUBLIC_INSIGHTS_HOST=<ph_client_api_host>
                                `,
                            },
                        ]}
                    />
                </>
            ),
        },
        {
            title: 'Initialize Insights',
            badge: 'required',
            content: (
                <>
                    <Markdown>Choose the integration method based on your Next.js version and router type.</Markdown>

                    <Tab.Group tabs={['Next.js 15.3+', 'App router', 'Pages router']}>
                        <Tab.List>
                            <Tab>Next.js 15.3+</Tab>
                            <Tab>App router</Tab>
                            <Tab>Pages router</Tab>
                        </Tab.List>
                        <Tab.Panels>
                            <Tab.Panel>
                                <Markdown>
                                    If you're using Next.js 15.3+, you can use `instrumentation-client.ts` for a
                                    lightweight, fast integration:
                                </Markdown>
                                <CodeBlock
                                    blocks={[
                                        {
                                            language: 'typescript',
                                            file: 'instrumentation-client.ts',
                                            code: dedent`
                                                import insights from '@hanzo/insights'

                                                insights.init(process.env.NEXT_PUBLIC_INSIGHTS_KEY!, {
                                                    api_host: process.env.NEXT_PUBLIC_INSIGHTS_HOST,
                                                    defaults: '2026-01-30'
                                                })
                                            `,
                                        },
                                    ]}
                                />
                            </Tab.Panel>
                            <Tab.Panel>
                                <Markdown>
                                    For the App router, create a `providers.tsx` file in your `app` folder. The
                                    `insights-js` library needs to be initialized on the client-side using the `'use
                                    client'` directive:
                                </Markdown>
                                <CodeBlock
                                    blocks={[
                                        {
                                            language: 'typescript',
                                            file: 'app/providers.tsx',
                                            code: dedent`
                                                'use client'

                                                import { usePathname, useSearchParams } from "next/navigation"
                                                import { useEffect } from "react"

                                                import insights from '@hanzo/insights'
                                                import { InsightsProvider as PHProvider } from '@hanzo/insights/react'

                                                export function InsightsProvider({ children }: { children: React.ReactNode }) {
                                                  useEffect(() => {
                                                    insights.init(process.env.NEXT_PUBLIC_INSIGHTS_KEY as string, {
                                                      api_host: process.env.NEXT_PUBLIC_INSIGHTS_HOST,
                                                      defaults: '2026-01-30'
                                                    })
                                                  }, [])

                                                  return (
                                                    <PHProvider client={insights}>
                                                      {children}
                                                    </PHProvider>
                                                  )
                                                }
                                            `,
                                        },
                                    ]}
                                />
                                <Markdown>
                                    Then import the `InsightsProvider` component in your `app/layout.tsx` and wrap your
                                    app with it:
                                </Markdown>
                                <CodeBlock
                                    blocks={[
                                        {
                                            language: 'typescript',
                                            file: 'app/layout.tsx',
                                            code: dedent`
                                                import './globals.css'
                                                import { InsightsProvider } from './providers'

                                                export default function RootLayout({ children }: { children: React.ReactNode }) {
                                                  return (
                                                    <html lang="en">
                                                      <body>
                                                        <InsightsProvider>
                                                          {children}
                                                        </InsightsProvider>
                                                      </body>
                                                    </html>
                                                  )
                                                }
                                            `,
                                        },
                                    ]}
                                />
                            </Tab.Panel>
                            <Tab.Panel>
                                <Markdown>
                                    For the Pages router, integrate Insights at the root of your app in `pages/_app.tsx`:
                                </Markdown>
                                <CodeBlock
                                    blocks={[
                                        {
                                            language: 'typescript',
                                            file: 'pages/_app.tsx',
                                            code: dedent`
                                                import { useEffect } from 'react'
                                                import { Router } from 'next/router'
                                                import insights from '@hanzo/insights'
                                                import { InsightsProvider } from '@hanzo/insights/react'
                                                import type { AppProps } from 'next/app'

                                                export default function App({ Component, pageProps }: AppProps) {

                                                  useEffect(() => {
                                                    insights.init(process.env.NEXT_PUBLIC_INSIGHTS_KEY as string, {
                                                      api_host: process.env.NEXT_PUBLIC_INSIGHTS_HOST,
                                                      defaults: '2026-01-30',
                                                      loaded: (insights) => {
                                                        if (process.env.NODE_ENV === 'development') insights.debug()
                                                      }
                                                    })
                                                  }, [])

                                                  return (
                                                    <InsightsProvider client={insights}>
                                                      <Component {...pageProps} />
                                                    </InsightsProvider>
                                                  )
                                                }
                                            `,
                                        },
                                    ]}
                                />
                            </Tab.Panel>
                        </Tab.Panels>
                    </Tab.Group>

                    <CalloutBox type="fyi" title="Defaults option">
                        <Markdown>
                            The `defaults` option automatically configures Insights with recommended settings for new
                            projects. See [SDK defaults](https://hanzo.ai/docs/libraries/js#sdk-defaults) for
                            details.
                        </Markdown>
                    </CalloutBox>
                </>
            ),
        },
        {
            title: 'Accessing Insights on the client',
            badge: 'recommended',
            content: (
                <>
                    <Tab.Group tabs={['Next.js 15.3+', 'App/Pages router']}>
                        <Tab.List>
                            <Tab>Next.js 15.3+</Tab>
                            <Tab>App/Pages router</Tab>
                        </Tab.List>
                        <Tab.Panels>
                            <Tab.Panel>
                                <Markdown>
                                    Once initialized in `instrumentation-client.ts`, import `insights` from `insights-js`
                                    anywhere and call the methods you need:
                                </Markdown>
                                <CodeBlock
                                    blocks={[
                                        {
                                            language: 'typescript',
                                            file: 'app/checkout/page.tsx',
                                            code: dedent`
                                                'use client'

                                                import insights from '@hanzo/insights'

                                                export default function CheckoutPage() {
                                                    function handlePurchase() {
                                                        insights.capture('purchase_completed', { amount: 99 })
                                                    }

                                                    return <button onClick={handlePurchase}>Complete purchase</button>
                                                }
                                            `,
                                        },
                                    ]}
                                />
                            </Tab.Panel>
                            <Tab.Panel>
                                <Markdown>Use the `useInsights` hook to access Insights in client components:</Markdown>
                                <CodeBlock
                                    blocks={[
                                        {
                                            language: 'typescript',
                                            file: 'app/checkout/page.tsx',
                                            code: dedent`
                                                'use client'

                                                import { useInsights } from '@hanzo/insights/react'

                                                export default function CheckoutPage() {
                                                    const insights = useInsights()

                                                    function handlePurchase() {
                                                        insights.capture('purchase_completed', { amount: 99 })
                                                    }

                                                    return <button onClick={handlePurchase}>Complete purchase</button>
                                                }
                                            `,
                                        },
                                    ]}
                                />
                            </Tab.Panel>
                        </Tab.Panels>
                    </Tab.Group>
                </>
            ),
        },
    ]
}

export const getNextJSServerSteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
    const { CodeBlock, Markdown, CalloutBox, Tab, dedent } = ctx

    return [
        {
            title: 'Server-side setup',
            badge: 'optional',
            content: (
                <>
                    <Markdown>To capture events from API routes or server actions, install `insights-node`:</Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'bash',
                                file: 'npm',
                                code: dedent`
                                    npm install insights-node
                                `,
                            },
                            {
                                language: 'bash',
                                file: 'yarn',
                                code: dedent`
                                    yarn add insights-node
                                `,
                            },
                            {
                                language: 'bash',
                                file: 'pnpm',
                                code: dedent`
                                    pnpm add insights-node
                                `,
                            },
                        ]}
                    />
                    <Markdown>
                        Then, initialize Insights in your API route or server action. Choose the method based on your
                        router type:
                    </Markdown>

                    <Tab.Group tabs={['App router', 'Pages router']}>
                        <Tab.List>
                            <Tab>App router</Tab>
                            <Tab>Pages router</Tab>
                        </Tab.List>
                        <Tab.Panels>
                            <Tab.Panel>
                                <Markdown>
                                    For the App router, you can use Insights in API routes or server actions. Create a
                                    new Insights client instance for each request, or reuse a singleton instance across
                                    requests:
                                </Markdown>
                                <CodeBlock
                                    blocks={[
                                        {
                                            language: 'typescript',
                                            file: 'app/api/example/route.ts',
                                            code: dedent`
                                                import { Insights } from 'insights-node'

                                                export async function POST(request: Request) {
                                                    const insights = new Insights(process.env.NEXT_PUBLIC_INSIGHTS_KEY!, {
                                                        host: process.env.NEXT_PUBLIC_INSIGHTS_HOST
                                                    })

                                                    insights.capture({
                                                        distinctId: 'distinct_id_of_the_user',
                                                        event: 'event_name'
                                                    })

                                                    await insights.shutdown()
                                                }
                                            `,
                                        },
                                    ]}
                                />
                                <Markdown>You can also use Insights in server actions:</Markdown>
                                <CodeBlock
                                    blocks={[
                                        {
                                            language: 'typescript',
                                            file: 'app/actions.ts',
                                            code: dedent`
                                                'use server'

                                                import { Insights } from 'insights-node'

                                                export async function myServerAction() {
                                                    const insights = new Insights(process.env.NEXT_PUBLIC_INSIGHTS_KEY!, {
                                                        host: process.env.NEXT_PUBLIC_INSIGHTS_HOST
                                                    })

                                                    insights.capture({
                                                        distinctId: 'distinct_id_of_the_user',
                                                        event: 'server_action_completed'
                                                    })

                                                    await insights.shutdown()
                                                }
                                            `,
                                        },
                                    ]}
                                />
                            </Tab.Panel>
                            <Tab.Panel>
                                <Markdown>For the Pages router, use Insights in your API routes:</Markdown>
                                <CodeBlock
                                    blocks={[
                                        {
                                            language: 'typescript',
                                            file: 'pages/api/example.ts',
                                            code: dedent`
                                                import { Insights } from 'insights-node'
                                                import type { NextApiRequest, NextApiResponse } from 'next'

                                                export default async function handler(
                                                    req: NextApiRequest,
                                                    res: NextApiResponse
                                                ) {
                                                    const insights = new Insights(process.env.NEXT_PUBLIC_INSIGHTS_KEY!, {
                                                        host: process.env.NEXT_PUBLIC_INSIGHTS_HOST
                                                    })

                                                    insights.capture({
                                                        distinctId: 'distinct_id_of_the_user',
                                                        event: 'event_name'
                                                    })

                                                    await insights.shutdown()

                                                    res.status(200).json({ success: true })
                                                }
                                            `,
                                        },
                                    ]}
                                />
                            </Tab.Panel>
                        </Tab.Panels>
                    </Tab.Group>

                    <CalloutBox type="fyi" title="Important">
                        <Markdown>
                            Always call `await insights.shutdown()` when you're done with the client to ensure all events
                            are flushed before the request completes. For better performance, consider creating a
                            singleton Insights instance that you reuse across requests.
                        </Markdown>
                    </CalloutBox>
                </>
            ),
        },
    ]
}

export const getNextJSSteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
    const { snippets } = ctx
    const JSEventCapture = snippets?.JSEventCapture

    return [
        ...getNextJSClientSteps(ctx),
        ...getNextJSServerSteps(ctx),
        {
            title: 'Send events',
            badge: 'recommended',
            content: <>{JSEventCapture && <JSEventCapture />}</>,
        },
    ]
}

export const NextJSInstallation = createInstallation(getNextJSSteps)
