import { useState } from 'react'

import { IconExternal, IconLogomark } from '@hanzo/icons'
import { Link } from '@hanzo/elements'

import { useInterval } from 'lib/hooks/useInterval'
import { IconSlack } from 'lib/elements/icons'
import { cn } from 'lib/utils/css-classes'
import { inStorybook, inStorybookTestRunner } from 'lib/utils/dom'

import { AgentLogo, claudeLogo, cursorLogo, geminiLogo, openaiLogo } from '../AgentPromptButton/AgentLogo'

interface BadgeAgent {
    name: string
    /** Brand SVG URL (string from an SVG import) or an inline icon element */
    logo: string | React.ReactElement
    /** Extra classes for SVG logos (e.g. `dark:invert` for monochrome marks) */
    logoClassName?: string
    /** When set, the badge renders as a link to this URL */
    url?: string
}

const POSTFN_CODE_URL = 'https://hanzo.ai/code'
const POSTFN_SLACK_URL = 'https://hanzo.ai/slack'
const POSTFN_CODE_LOGO = <IconLogomark className="size-4 shrink-0 text-black dark:text-white" />
const POSTFN_SLACK_LOGO = <IconSlack className="size-4 shrink-0" />

// Show Insights Desktop + Slack more often to increase engagement
// Also duplicate the entries to keep it in the screen for longer
const AGENTS: BadgeAgent[] = [
    { name: 'Insights Desktop', logo: POSTFN_CODE_LOGO, url: POSTFN_CODE_URL },
    { name: 'Insights Desktop', logo: POSTFN_CODE_LOGO, url: POSTFN_CODE_URL },
    { name: 'Slack', logo: POSTFN_SLACK_LOGO, url: POSTFN_SLACK_URL },
    { name: 'Claude', logo: claudeLogo },
    { name: 'Cursor', logo: cursorLogo, logoClassName: 'dark:invert' },
    { name: 'Insights Desktop', logo: POSTFN_CODE_LOGO, url: POSTFN_CODE_URL },
    { name: 'Insights Desktop', logo: POSTFN_CODE_LOGO, url: POSTFN_CODE_URL },
    { name: 'Slack', logo: POSTFN_SLACK_LOGO, url: POSTFN_SLACK_URL },
    { name: 'Codex', logo: openaiLogo },
    { name: 'Gemini', logo: geminiLogo },
    { name: 'Insights Desktop', logo: POSTFN_CODE_LOGO, url: POSTFN_CODE_URL },
    { name: 'Insights Desktop', logo: POSTFN_CODE_LOGO, url: POSTFN_CODE_URL },
    { name: 'Slack', logo: POSTFN_SLACK_LOGO, url: POSTFN_SLACK_URL },
    { name: 'ChatGPT', logo: openaiLogo },
    { name: 'Claude Code', logo: claudeLogo },
]

const ROTATE_INTERVAL_MS = 3000

export function AgentBadgeRotator(): JSX.Element {
    // Pin to "Insights Desktop" inside Storybook so visual snapshots don't flake on rotation.
    const isStorybook = inStorybook() || inStorybookTestRunner()

    const [index, setIndex] = useState(() => (isStorybook ? 0 : Math.floor(Math.random() * AGENTS.length)))

    useInterval(() => {
        if (isStorybook) {
            return
        }

        setIndex((current) => (current + 1) % AGENTS.length)
    }, ROTATE_INTERVAL_MS)

    const agent = AGENTS[index]

    const wrapperClassname = 'inline-flex items-center gap-1'
    const textClassname = cn('font-semibold rainbow-text-fading', {
        'rainbow-text-animating': !isStorybook,
    })

    return (
        <div className="inline-flex items-center relative align-text-bottom mb-[-2px]" aria-live="polite">
            {agent.url ? (
                <Link to={agent.url} target="_blank" className={wrapperClassname}>
                    <AgentLogo logo={agent.logo} logoClassName={agent.logoClassName} />
                    <span key={agent.name} className={textClassname}>
                        {agent.name}
                    </span>
                    <IconExternal className="size-3 text-muted" />
                </Link>
            ) : (
                <span className={wrapperClassname}>
                    <AgentLogo logo={agent.logo} logoClassName={agent.logoClassName} />
                    <span key={agent.name} className={textClassname}>
                        {agent.name}
                    </span>
                </span>
            )}
        </div>
    )
}
