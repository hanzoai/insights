import { Label } from 'lib/elements/Label'
import { DefaultExperimentConfidenceLevel } from 'scenes/settings/environment/DefaultExperimentConfidenceLevel'
import { DefaultExperimentStatsMethod } from 'scenes/settings/environment/DefaultExperimentStatsMethod'
import { ExperimentRecalculationTime } from 'scenes/settings/environment/ExperimentRecalculationTime'

/**
 * although this works fine for now, if we keep adding more settings we need to refactor this to use the
 * <Settings /> component. That will require we create a new section for experiments on the SettingsMap.
 */
export function ExperimentsSettings(): JSX.Element {
    return (
        <div className="space-y-8">
            <div>
                <Label className="text-base">Default statistical method</Label>
                <p className="text-secondary mt-2">
                    Choose the default statistical method for experiment analysis. This setting applies to all new
                    experiments in this environment and can be overridden per experiment.
                </p>
                <DefaultExperimentStatsMethod />
            </div>
            <DefaultExperimentConfidenceLevel />
            <ExperimentRecalculationTime />
        </div>
    )
}
