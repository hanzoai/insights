import { useActions, useValues } from 'kea'

import { Button, Modal } from '@hanzo/elements'

import { PayGateMini } from 'lib/components/PayGateMini/PayGateMini'

import { LaptopMascot3 } from '../mascots'
import { upgradeModalLogic } from './upgradeModalLogic'

export function UpgradeModal(): JSX.Element {
    const {
        upgradeModalFeatureKey,
        upgradeModalFeatureUsage,
        upgradeModalIsGrandfathered,
        projectLimit,
        shouldShowPlatformAddonMessage,
    } = useValues(upgradeModalLogic)
    const { hideUpgradeModal } = useActions(upgradeModalLogic)

    if (!upgradeModalFeatureKey) {
        return <></>
    }

    if (shouldShowPlatformAddonMessage) {
        return (
            <Modal onClose={hideUpgradeModal} isOpen={!!upgradeModalFeatureKey}>
                <div className="max-w-2xl mt-8">
                    <div className="PayGateMini rounded flex flex-col items-center p-4 text-center bg-primary border border-primary">
                        <div className="mb-3 max-w-72">
                            <LaptopMascot3 />
                        </div>
                        <p className="max-w-140 mb-4">
                            You've reached your usage limit for <b>projects</b>. To create more than{' '}
                            <b>{projectLimit} projects</b>, you need to subscribe to the Boost, Scale, or Enterprise
                            plan.
                        </p>
                        <Button
                            type="primary"
                            center
                            to="/organization/billing?products=platform_and_support"
                            onClick={hideUpgradeModal}
                        >
                            Upgrade now
                        </Button>
                    </div>
                </div>
            </Modal>
        )
    }

    return (
        <Modal onClose={hideUpgradeModal} isOpen={!!upgradeModalFeatureKey}>
            <div className="max-w-2xl">
                <PayGateMini
                    feature={upgradeModalFeatureKey}
                    currentUsage={upgradeModalFeatureUsage ?? undefined}
                    isGrandfathered={upgradeModalIsGrandfathered ?? undefined}
                    background={false}
                    handleSubmit={hideUpgradeModal}
                >
                    <div className="pr-7">
                        You should have access to this feature already. If you are still seeing this modal, please let
                        us know 🙂
                    </div>
                </PayGateMini>
            </div>
        </Modal>
    )
}
