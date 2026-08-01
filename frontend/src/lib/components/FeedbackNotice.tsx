import { useActions, useValues } from 'kea'

import { IconBug } from '@hanzo/icons'
import { Banner } from '@hanzo/elements'

import { IconFeedback } from 'lib/elements/icons'
import { Button } from 'lib/elements/Button'
import { preflightLogic } from 'lib/logic/preflightLogic'

import { supportLogic } from './Support/supportLogic'

export const FeedbackNotice = ({ text }: { text: string }): JSX.Element => {
    const { openSupportForm } = useActions(supportLogic)
    const { preflight } = useValues(preflightLogic)

    const showSupportOptions = preflight?.cloud

    return (
        <Banner type="info" className="my-4">
            <div className="flex items-center flex-wrap gap-2 justify-between">
                <div className="flex-1 min-w-full sm:min-w-0">{text}</div>
                {showSupportOptions ? (
                    <span className="flex items-center gap-2">
                        <Button
                            type="secondary"
                            icon={<IconBug />}
                            onClick={() => openSupportForm({ kind: 'bug', isEmailFormOpen: true })}
                        >
                            Report a bug
                        </Button>
                        <Button
                            type="secondary"
                            icon={<IconFeedback />}
                            onClick={() => openSupportForm({ kind: 'feedback', isEmailFormOpen: true })}
                        >
                            Give feedback
                        </Button>
                    </span>
                ) : null}
            </div>
        </Banner>
    )
}
