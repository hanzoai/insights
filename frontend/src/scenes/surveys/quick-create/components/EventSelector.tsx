import { useActions, useValues } from 'kea'

import { IconX } from '@hanzo/icons'
import { Button, Label } from '@hanzo/elements'

import { AddEventButton } from 'scenes/surveys/AddEventButton'
import { quickSurveyFormLogic } from 'scenes/surveys/quick-create/quickSurveyFormLogic'

export function EventSelector(): JSX.Element {
    const { selectedEvents } = useValues(quickSurveyFormLogic)
    const { updateConditions } = useActions(quickSurveyFormLogic)

    return (
        <div>
            <Label className="mb-2">Trigger on events (optional)</Label>
            {selectedEvents.length > 0 && (
                <div className="space-y-2 mb-2">
                    {selectedEvents.map((eventName) => (
                        <div
                            key={eventName}
                            className="flex items-center justify-between p-2 border rounded bg-bg-light"
                        >
                            <span className="text-sm font-medium">{eventName}</span>
                            <Button
                                size="xsmall"
                                icon={<IconX />}
                                onClick={() =>
                                    updateConditions({
                                        events: {
                                            values: selectedEvents
                                                .filter((e) => e !== eventName)
                                                .map((name) => ({ name })),
                                        },
                                    })
                                }
                                type="tertiary"
                                status="alt"
                            />
                        </div>
                    ))}
                </div>
            )}
            <AddEventButton
                onEventSelect={(eventName) =>
                    updateConditions({
                        events: {
                            values: [...selectedEvents, eventName].map((name) => ({ name })),
                        },
                    })
                }
                excludedEvents={selectedEvents}
            />
        </div>
    )
}
