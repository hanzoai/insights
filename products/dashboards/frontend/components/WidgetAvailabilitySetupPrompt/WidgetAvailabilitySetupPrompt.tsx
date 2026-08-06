import insights from 'insights-js'

import { Button } from '@hanzo/elements'

import type { WidgetAvailabilityConfig } from '../../widget_types/widgetAvailability'
import { WIDGET_AVAILABILITY_PRESENTATION } from '../../widget_types/widgetAvailability'
import { WidgetCardContent } from '../WidgetCard/WidgetCardBody'
import { WidgetCardProductIntroduction } from '../WidgetCardProductIntroduction/WidgetCardProductIntroduction'

type WidgetAvailabilitySetupPromptProps = {
    availability: WidgetAvailabilityConfig
    className?: string
    widgetType?: string
    widgetId?: string
    dashboardId?: number | null
}

export function WidgetAvailabilitySetupPrompt({
    availability,
    className,
    widgetType,
    widgetId,
    dashboardId,
}: WidgetAvailabilitySetupPromptProps): JSX.Element {
    const presentation = WIDGET_AVAILABILITY_PRESENTATION[availability.requirement]

    return (
        <WidgetCardContent className={className}>
            <WidgetCardProductIntroduction
                stacked
                className="border-none mb-0 mt-0 p-4"
                productName={presentation.productName}
                productKey={presentation.productKey}
                thingName={presentation.thingName}
                titleOverride={availability.unavailableTitle}
                description={availability.unavailableReason}
                isEmpty
                docsURL={availability.docsHref}
                actionElementOverride={
                    <div className="flex flex-col items-center gap-4">
                        <Button
                            type="primary"
                            to={presentation.settingsUrl}
                            onClick={() => {
                                insights.capture('dashboard widget cross product activated', {
                                    widget_type: widgetType,
                                    widget_id: widgetId,
                                    dashboard_id: dashboardId,
                                    cta: availability.requirement,
                                })
                            }}
                        >
                            {availability.setupActionLabel}
                        </Button>
                    </div>
                }
            />
        </WidgetCardContent>
    )
}
