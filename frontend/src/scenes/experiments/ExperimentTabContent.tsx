import { useValues } from 'kea'

import { Banner, Skeleton, Link } from '@hanzo/elements'

import type { FeatureFlagType } from '~/types'

import { CreateDraftExperimentCard } from './ExperimentTabContent/CreateDraftExperimentCard'
import { RelatedExperimentsTable } from './ExperimentTabContent/RelatedExperimentsTable'
import { experimentTabLogic } from './experimentTabLogic'
import { featureFlagEligibleForExperiment } from './utils'

type ExperimentTabContentProps = {
    featureFlag: FeatureFlagType
    multipleExperimentsBannerMessage: React.ReactNode
}

export const ExperimentTabContent = ({
    featureFlag,
    multipleExperimentsBannerMessage,
}: ExperimentTabContentProps): JSX.Element | null => {
    /**
     * we only operate with existing feature flags, so id will never be null.
     */
    const { relatedExperiments, relatedExperimentsLoading } = useValues(
        experimentTabLogic({ featureFlagId: featureFlag.id! })
    )

    let eligibilityError: string | null = null
    try {
        featureFlagEligibleForExperiment(featureFlag)
    } catch (error) {
        eligibilityError = (error as Error).message
    }

    if (eligibilityError) {
        return (
            <div className="space-y-6">
                <Banner type="warning">
                    <div className="flex flex-col gap-3">
                        <div>
                            {eligibilityError}&nbsp;
                            <Link to="https://hanzo.ai/docs/experiments/creating-an-experiment">
                                Learn more in the docs
                            </Link>
                            .
                        </div>
                    </div>
                </Banner>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {relatedExperimentsLoading ? (
                <div className="border rounded p-4 bg-bg-light space-y-3">
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-9 w-32" />
                </div>
            ) : (
                relatedExperiments.length === 0 && <CreateDraftExperimentCard featureFlag={featureFlag} />
            )}
            <RelatedExperimentsTable
                relatedExperiments={relatedExperiments}
                relatedExperimentsLoading={relatedExperimentsLoading}
                multipleExperimentsBannerMessage={multipleExperimentsBannerMessage}
            />
        </div>
    )
}
