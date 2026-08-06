import { Markdown } from 'lib/elements/Markdown'

import { SignalCardShell } from './SignalCardShell'
import type { SignalCardProps } from './types'

export function GenericSignalCard({ signal }: SignalCardProps): JSX.Element {
    return (
        <SignalCardShell signal={signal}>
            {signal.content && (
                <Markdown className="text-sm text-secondary mb-2" disableImages>
                    {signal.content}
                </Markdown>
            )}
        </SignalCardShell>
    )
}
