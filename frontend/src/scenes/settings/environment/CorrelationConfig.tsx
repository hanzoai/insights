import { useActions, useValues } from 'kea'

import { IconPlus } from '@hanzo/icons'
import { Button } from '@hanzo/elements'

import { EventSelect } from 'lib/components/EventSelect/EventSelect'
import { PropertySelect } from 'lib/components/PropertySelect/PropertySelect'
import { TaxonomicFilterGroupType } from 'lib/components/TaxonomicFilter/types'
import { InputSelect } from 'lib/elements/InputSelect/InputSelect'
import { IconSelectEvents, IconSelectProperties } from 'lib/elements/icons'
import { teamLogic } from 'scenes/teamLogic'

export function CorrelationConfig(): JSX.Element {
    const { updateCurrentTeam } = useActions(teamLogic)
    const { currentTeam, funnelCorrelationConfig } = useValues(teamLogic)

    const handleChange = (
        excludedProperties?: string[],
        excludedEvents?: string[],
        excludedEventProperties?: string[]
    ): void => {
        if (currentTeam) {
            const updatedConfig = { ...funnelCorrelationConfig }
            if (excludedProperties !== undefined) {
                updatedConfig.excluded_person_property_names = excludedProperties
            }
            if (excludedEventProperties !== undefined) {
                updatedConfig.excluded_event_property_names = excludedEventProperties
            }
            if (excludedEvents !== undefined) {
                updatedConfig.excluded_event_names = excludedEvents
            }
            if (updatedConfig && JSON.stringify(updatedConfig) !== JSON.stringify(funnelCorrelationConfig)) {
                updateCurrentTeam({ correlation_config: updatedConfig })
            }
        }
    }

    return (
        <>
            {currentTeam && (
                <div className="deprecated-space-y-2">
                    <div>
                        <h3 className="flex items-center gap-2">
                            <IconSelectProperties className="text-lg" />
                            Excluded user properties
                        </h3>
                        <PropertySelect
                            taxonomicFilterGroup={TaxonomicFilterGroupType.PersonProperties}
                            onChange={(properties) => handleChange(properties)}
                            selectedProperties={funnelCorrelationConfig.excluded_person_property_names || []}
                            addText="Add exclusion"
                        />
                    </div>
                    <div>
                        <h3 className="flex items-center gap-2">
                            <IconSelectEvents className="text-lg" />
                            Excluded events
                        </h3>
                        <EventSelect
                            onChange={(excludedEvents) => handleChange(undefined, excludedEvents)}
                            selectedEvents={funnelCorrelationConfig.excluded_event_names || []}
                            addElement={
                                <Button size="small" type="secondary" icon={<IconPlus />} sideIcon={null}>
                                    Add exclusion
                                </Button>
                            }
                        />
                    </div>
                    <div>
                        <h3 className="flex items-center gap-2">
                            <IconSelectEvents className="text-lg" />
                            Excluded event properties
                        </h3>
                        <div className="max-w-160">
                            <InputSelect
                                mode="multiple"
                                allowCustomValues
                                onChange={(properties: string[]) => handleChange(undefined, undefined, properties)}
                                value={funnelCorrelationConfig.excluded_event_property_names || []}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
