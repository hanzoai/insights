import { useActions } from 'kea'

import { IconCopy } from '@hanzo/icons'

import { IconLink } from 'lib/elements/icons'
import { Button } from 'lib/elements/Button'
import { More } from 'lib/elements/Button/More'
import { copyToClipboard } from 'lib/utils/copyToClipboard'

import { ParsedLogMessage } from 'products/logs/frontend/types'

import { logsViewerLogic } from './logsViewerLogic'

interface LogsViewerRowActionsProps {
    log: ParsedLogMessage
}

export function LogsViewerRowActions({ log }: LogsViewerRowActionsProps): JSX.Element {
    const { copyLinkToLog } = useActions(logsViewerLogic)

    return (
        <More
            overlay={
                <>
                    <Button
                        onClick={() => copyToClipboard(log.body, 'log message')}
                        fullWidth
                        sideIcon={<IconCopy />}
                        data-attr="logs-viewer-copy-message"
                    >
                        Copy log message
                    </Button>
                    <Button
                        onClick={() => copyLinkToLog(log.uuid)}
                        fullWidth
                        sideIcon={<IconLink />}
                        data-attr="logs-viewer-copy-link"
                    >
                        Copy link to log
                    </Button>
                </>
            }
        />
    )
}
