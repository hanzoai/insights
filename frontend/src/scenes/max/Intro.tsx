import { useValues } from 'kea'
import { useState } from 'react'

import { Logomark } from 'lib/brand/Logomark'

import { AILiabilityNotice } from './components/AILiabilityNotice'
import { MaxChangelog } from './components/MaxChangelog'
import { maxLogic } from './maxLogic'

const LOGOMARK_AIRTIME_MS = 400 // Sync with --logomark-airtime in base.scss

export function Intro(): JSX.Element {
    const { headline } = useValues(maxLogic)
    const [logoLastJumped, setLogoLastJumped] = useState<number | null>(() => Date.now())
    const [logoJumpIteration, setLogoJumpIteration] = useState(0)

    const handleLogomarkClick = (): void => {
        const now = Date.now()
        if (logoLastJumped && now - logoLastJumped < LOGOMARK_AIRTIME_MS) {
            return // Disallows interrupting the jump animation!
        }
        setLogoJumpIteration(logoJumpIteration + 1)
        setLogoLastJumped(null)
        requestAnimationFrame(() => setLogoLastJumped(now))
    }

    return (
        <>
            <div
                className={`flex *:h-full *:w-12 p-2 cursor-pointer ${logoLastJumped ? 'animate-logomark-jump' : ''}`}
                // eslint-disable-next-line react/forbid-dom-props
                style={
                    {
                        '--logomark-jump-magnitude': logoJumpIteration
                            ? 1.5 ** ((logoJumpIteration % 8) - 2)
                            : 1,
                    } as React.CSSProperties
                }
                onClick={handleLogomarkClick}
            >
                <Logomark />
            </div>
            <div className="text-center mb-1">
                <h2 className="text-xl @2xl/main-content:text-2xl font-bold mb-2 text-balance">{headline}</h2>
                <div className="text-sm italic text-tertiary text-pretty py-0.5">Build something people want.</div>
            </div>
            <AILiabilityNotice />
            <MaxChangelog />
        </>
    )
}
