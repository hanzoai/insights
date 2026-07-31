import { useValues } from 'kea'
import { useEffect } from 'react'

import { Spinner } from '@hanzo/elements'

import { useConfetti } from 'lib/components/Confetti/Confetti'
import { SupermanMascot } from 'lib/components/mascots'
import { billingLogic } from 'scenes/billing/billingLogic'

import { type BillingProductV2Type, OnboardingStepKey } from '~/types'

import { OnboardingStep } from '../OnboardingStep'
import { OnboardingStepComponentType } from '../onboardingLogic'
import PlanCards from './PlanCards'

type OnboardingUpgradeStepProps = {
    product: BillingProductV2Type
}

export const OnboardingUpgradeStep: OnboardingStepComponentType<OnboardingUpgradeStepProps> = ({ product }) => {
    const { billingLoading } = useValues(billingLogic)

    if (billingLoading) {
        return (
            <div className="flex items-center justify-center my-20">
                <Spinner className="text-2xl text-muted w-10 h-10" />
            </div>
        )
    }

    return (
        <OnboardingStep title="Select a plan" stepKey={OnboardingStepKey.PLANS} showContinue={!!product.subscribed}>
            {!product.subscribed && <PlanCards product={product} />}
            {product.subscribed && <ProductSubscribed product={product} />}
        </OnboardingStep>
    )
}
OnboardingUpgradeStep.stepKey = OnboardingStepKey.PLANS

const ProductSubscribed = ({ product }: { product: BillingProductV2Type }): JSX.Element => {
    const { trigger, ConfettiComponent } = useConfetti({ count: 100, duration: 3000 })

    useEffect(() => {
        const run = async (): Promise<void> => {
            trigger()
            await new Promise((resolve) => setTimeout(resolve, 1000))
            trigger()
            await new Promise((resolve) => setTimeout(resolve, 1000))
            trigger()
        }

        void run()
    }, [trigger])

    return (
        <div className="relative flex flex-col items-center text-center">
            <ConfettiComponent />

            {/* Superman floating animation */}
            <div className="w-40 h-40 animate-float">
                <SupermanMascot className="w-full h-full object-contain" />
            </div>

            {/* Text Below */}
            <h3 className="text-2xl font-bold mt-6">Go forth and build amazing products!</h3>
            <p className="text-gray-700">
                You've unlocked all features for <strong>{product.name}</strong>.
            </p>
        </div>
    )
}
