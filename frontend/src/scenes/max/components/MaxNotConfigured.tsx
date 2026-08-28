import { Link } from '@hanzo/elements'
import { IconLock } from '@hanzo/icons'

import { Logomark } from 'lib/brand'
import { CodeSnippet, Language } from 'lib/components/CodeSnippet'

/**
 * Shown when Insights AI is rendered on an instance that has nowhere to send a request.
 *
 * It asked for a vendor key, which is not how this is deployed: the client prefers our own
 * gateway (see build_async_anthropic_client) and falls back to a direct provider only if one
 * is set. Pointing people at a vendor sent them to buy a second bill for capacity the
 * platform already has, so the instructions name the gateway and keep the key as the escape
 * hatch it is.
 */
export function MaxNotConfigured(): JSX.Element {
    return (
        <div className="flex flex-col items-center justify-center text-center grow gap-4 px-4 py-8 max-w-prose mx-auto">
            <div className="flex p-2 select-none opacity-60">
                <Logomark size="md" />
            </div>
            <div>
                <h2 className="text-xl font-bold mb-2 flex items-center justify-center gap-2">
                    <IconLock />
                    Insights AI isn't set up yet
                </h2>
                <p className="text-sm text-tertiary text-pretty mb-0">
                    Insights AI needs somewhere to send a request. Point this instance at the Hanzo AI gateway and
                    restart Insights to start chatting.
                </p>
            </div>
            <CodeSnippet language={Language.Bash} className="w-full text-left">
                {'AI_GATEWAY_URL=https://api.hanzo.ai/v1\nAI_GATEWAY_API_KEY=hk-...'}
            </CodeSnippet>
            <p className="text-sm text-tertiary text-pretty mb-0">
                A direct provider key (<code>ANTHROPIC_API_KEY</code>) also works and is used when no gateway is set. On
                a hobby deploy, add either to your <code>.env</code> and run <code>./bin/upgrade-hobby</code>, or set it
                during install.{' '}
                <Link
                    to="https://hanzo.ai/docs/self-host/configure/environment-variables?utm_medium=in-product&utm_campaign=max-not-configured"
                    target="_blank"
                    targetBlankIcon
                    data-attr="max-not-configured-configure-key"
                >
                    Configuring environment variables
                </Link>
            </p>
        </div>
    )
}
