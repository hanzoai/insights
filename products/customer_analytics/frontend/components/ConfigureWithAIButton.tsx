import { useActions } from 'kea'

import { IconSparkles } from '@hanzo/icons'
import { Button, ButtonProps } from '@hanzo/elements'

import { eventUsageLogic } from 'lib/utils/eventUsageLogic'
import { useOpenAi } from 'scenes/max/useOpenAi'

import { customerAnalyticsDashboardEventsLogic } from '../scenes/CustomerAnalyticsConfigurationScene/events/customerAnalyticsDashboardEventsLogic'

type ConfigureWithAIButtonProps = ButtonProps & {
    prompt: string
    event?: string
    eventToHighlight?: string
    children?: React.ReactNode
}

export function ConfigureWithAIButton({
    prompt,
    event,
    eventToHighlight,
    children,
    ...props
}: ConfigureWithAIButtonProps): JSX.Element {
    const { openAi } = useOpenAi()
    const { addEventToHighlight } = useActions(customerAnalyticsDashboardEventsLogic)
    const { reportCustomerAnalyticsDashboardConfigureEventWithAIClicked } = useActions(eventUsageLogic)

    const handleClick = (): void => {
        openAi(prompt)
        if (eventToHighlight) {
            addEventToHighlight(eventToHighlight)
        }
        reportCustomerAnalyticsDashboardConfigureEventWithAIClicked({ event: event || eventToHighlight })
    }

    return (
        <Button
            size="small"
            type="tertiary"
            icon={<IconSparkles className="text-accent" />}
            tooltip="Configure with Insights AI"
            onClick={handleClick}
            className="border border-accent border-dashed p-1"
            data-attr="customer-analytics-configure-event-with-ai"
            noPadding
            {...props}
        >
            {children}
        </Button>
    )
}
