import { useActions } from 'kea'

import { useOnMountEffect } from 'lib/hooks/useOnMountEffect'
import { Button, ButtonProps } from 'lib/elements/Button'
import { eventUsageLogic } from 'lib/utils/eventUsageLogic'

export function BillingUpgradeCTA({ children, ...props }: ButtonProps): JSX.Element {
    const { reportBillingCTAShown } = useActions(eventUsageLogic)
    useOnMountEffect(reportBillingCTAShown)

    return <Button {...props}>{children}</Button>
}
