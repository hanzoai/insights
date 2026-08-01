import { useActions, useValues } from 'kea'

import { Tabs } from '@hanzo/elements'

import { CodeSnippet, Language } from 'lib/components/CodeSnippet'
import { FEATURE_FLAGS } from 'lib/constants'
import { Link } from 'lib/elements/Link'
import { featureFlagLogic } from 'lib/logic/featureFlagLogic'
import { apiHostOrigin } from 'lib/utils/apiHost'
import SetupWizardBanner from 'scenes/onboarding/shared/SetupWizardBanner'
import { teamLogic } from 'scenes/teamLogic'

import { SDK_DEFAULTS_DATE } from '~/loadInsightsJS'

import { ReactInstallSnippet } from './js-web'
import { type NextJSRouter, nextJsInstructionsLogic } from './nextJsInstructionsLogic'

function NextEnvVarsSnippet(): JSX.Element {
    const { currentTeam } = useValues(teamLogic)

    return (
        <CodeSnippet language={Language.Bash}>
            {[
                `NEXT_PUBLIC_POSTFN_PROJECT_TOKEN=${currentTeam?.api_token}`,
                `NEXT_PUBLIC_POSTFN_HOST=${apiHostOrigin()}`,
            ].join('\n')}
        </CodeSnippet>
    )
}

function NextPagesRouterPageViewSnippet(): JSX.Element {
    const { featureFlags } = useValues(featureFlagLogic)
    const isPersonProfilesDisabled = featureFlags[FEATURE_FLAGS.PERSONLESS_EVENTS_NOT_SUPPORTED]
    return (
        <CodeSnippet language={Language.TypeScript}>
            {`// pages/_app.tsx
import { useEffect } from 'react'
import { Router } from 'next/router'
import insights from 'insights-js'
import { InsightsProvider } from '@hanzo/react'
import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {

  useEffect(() => {
    insights.init(process.env.NEXT_PUBLIC_POSTFN_PROJECT_TOKEN as string, {
      api_host: process.env.NEXT_PUBLIC_POSTFN_HOST || '${apiHostOrigin()}',
      ${
          isPersonProfilesDisabled
              ? ``
              : `person_profiles: 'identified_only', // or 'always' to create profiles for anonymous users as well`
      }
      defaults: '${SDK_DEFAULTS_DATE}',
      // Enable debug mode in development
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
}`}
        </CodeSnippet>
    )
}

function NextAppRouterLayoutSnippet(): JSX.Element {
    return (
        <CodeSnippet language={Language.TypeScript}>
            {`// app/layout.tsx

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
}`}
        </CodeSnippet>
    )
}

function NextAppRouterPageViewProviderSnippet(): JSX.Element {
    const { featureFlags } = useValues(featureFlagLogic)
    const isPersonProfilesDisabled = featureFlags[FEATURE_FLAGS.PERSONLESS_EVENTS_NOT_SUPPORTED]
    return (
        <CodeSnippet language={Language.TypeScript}>
            {`// app/providers.tsx
'use client'

import { usePathname, useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { useInsights } from '@hanzo/react'

import insights from 'insights-js'
import { InsightsProvider as PHProvider } from '@hanzo/react'

export function InsightsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    insights.init(process.env.NEXT_PUBLIC_POSTFN_PROJECT_TOKEN as string, {
      api_host: process.env.NEXT_PUBLIC_POSTFN_HOST || '${apiHostOrigin()}',
      ${
          isPersonProfilesDisabled
              ? ``
              : `person_profiles: 'identified_only', // or 'always' to create profiles for anonymous users as well`
      }
      defaults: '${SDK_DEFAULTS_DATE}'
    })
  }, [])

  return (
    <PHProvider client={insights}>
      {children}
    </PHProvider>
  )
}
`}
        </CodeSnippet>
    )
}

function NextInstrumentationClientSnippet(): JSX.Element {
    return (
        <CodeSnippet language={Language.TypeScript}>
            {`// instrumentation-client.js
import insights from 'insights-js'

insights.init(process.env.NEXT_PUBLIC_POSTFN_PROJECT_TOKEN, {
    api_host: process.env.NEXT_PUBLIC_POSTFN_HOST,
    defaults: '${SDK_DEFAULTS_DATE}'
});
            `}
        </CodeSnippet>
    )
}

export function SDKInstallNextJSInstructions({ hideWizard }: { hideWizard?: boolean }): JSX.Element {
    const { nextJsRouter } = useValues(nextJsInstructionsLogic)
    const { setNextJsRouter } = useActions(nextJsInstructionsLogic)

    return (
        <>
            <SetupWizardBanner integrationName="Next.js" hide={hideWizard} />
            <h3>Install insights-js and @hanzo/react using your package manager</h3>
            <ReactInstallSnippet />
            <h3>Add environment variables</h3>
            <p>
                Add your environment variables to your .env.local file and to your hosting provider (e.g. Vercel,
                Netlify, AWS). You can find your project token in your project settings.
            </p>
            <p>
                These values need to start with <code>NEXT_PUBLIC_</code> to be accessible on the client-side.
            </p>
            <NextEnvVarsSnippet />

            <h3>Initialize</h3>

            <Tabs
                activeKey={nextJsRouter}
                onChange={(key) => setNextJsRouter(key as NextJSRouter)}
                tabs={[
                    {
                        key: 'instrumentation-client',
                        label: 'Next.js 15.3+',
                    },
                    {
                        key: 'app',
                        label: 'App router',
                    },
                    {
                        key: 'pages',
                        label: 'Pages router',
                    },
                ]}
            />
            {nextJsRouter === 'instrumentation-client' && (
                <>
                    <p>
                        If you're using Next.js 15.3+ you can use <code>instrumentation-client.ts|js</code> for a
                        light-weight, fast integration
                    </p>
                    <NextInstrumentationClientSnippet />
                </>
            )}
            {nextJsRouter === 'app' && (
                <>
                    <p>
                        If your Next.js app uses the{' '}
                        <Link to="https://nextjs.org/docs/app" target="_blank">
                            app router
                        </Link>
                        , you can integrate Insights by creating a <code>providers</code> file in your <code>app</code>{' '}
                        folder. This is because the <code>insights-js</code> library needs to be initialized on the
                        client-side using the Next.js{' '}
                        <Link
                            to="https://nextjs.org/docs/getting-started/react-essentials#client-components"
                            target="_blank"
                        >
                            <code>'use client'</code> directive
                        </Link>
                        .
                    </p>
                    <NextAppRouterPageViewProviderSnippet />
                    <p>
                        Afterwards, import the <code>InsightsProvider</code> component in your{' '}
                        <code>app/layout.tsx</code> file and wrap your app with it.
                    </p>
                    <NextAppRouterLayoutSnippet />
                </>
            )}
            {nextJsRouter === 'pages' && (
                <>
                    <p>
                        If your Next.js app uses the{' '}
                        <Link to="https://nextjs.org/docs/pages" target="_blank">
                            pages router
                        </Link>
                        , you can integrate Insights at the root of your app.
                    </p>
                    <NextPagesRouterPageViewSnippet />
                </>
            )}
        </>
    )
}
