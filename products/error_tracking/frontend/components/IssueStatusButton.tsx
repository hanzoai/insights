import { Button, MenuOverlay } from '@hanzo/elements'

import { useConfetti } from 'lib/components/Confetti/Confetti'

import { ErrorTrackingIssue } from '~/queries/schema/schema-general'

import { STATUS_INTENT_LABEL } from './Indicators'

export const IssueStatusButton = ({
    status,
    onChange,
}: {
    status: ErrorTrackingIssue['status']
    onChange: (status: ErrorTrackingIssue['status']) => void
}): JSX.Element => {
    const { trigger, ConfettiComponent } = useConfetti()

    const handleResolve = (): void => {
        if (status === 'active') {
            onChange('resolved')
            ;[0, 400, 800].forEach((delay) => setTimeout(trigger, delay))
        } else {
            onChange('active')
        }
    }

    return (
        <>
            <ConfettiComponent />
            <Button
                type="primary"
                onClick={handleResolve}
                tooltip={status === 'active' ? STATUS_INTENT_LABEL['resolved'] : STATUS_INTENT_LABEL['active']}
                data-attr="error-tracking-resolve"
                sideAction={
                    status === 'active'
                        ? {
                              dropdown: {
                                  placement: 'bottom-end',
                                  overlay: (
                                      <MenuOverlay
                                          items={[
                                              {
                                                  label: 'Suppress',
                                                  onClick: () => onChange('suppressed'),
                                                  tooltip: STATUS_INTENT_LABEL['suppressed'],
                                              },
                                          ]}
                                      />
                                  ),
                              },
                          }
                        : undefined
                }
                size="small"
            >
                {status === 'active' ? 'Resolve' : 'Reopen'}
            </Button>
        </>
    )
}
