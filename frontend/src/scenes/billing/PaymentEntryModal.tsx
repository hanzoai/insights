import { useActions, useValues } from 'kea'
import { useEffect } from 'react'

import { LemonBanner, LemonButton, LemonModal } from '@hanzo/lemon-ui'

import { paymentEntryLogic } from './paymentEntryLogic'

const PAY_URL = process.env.HANZO_PAY_URL ?? 'https://pay.hanzo.ai'

/**
 * Card-entry modal. The user's browser is bounced to @hanzoai/pay
 * (pay.hanzo.ai) which terminates the actual payment with the
 * Hanzo Commerce backend. We do not host Stripe Elements anymore.
 *
 * The insights backend still returns a `clientSecret` from
 * /api/billing/activate/authorize — that token is now a Hanzo Commerce
 * checkout-session token. Pay forwards it back through commerce.
 */
export const PaymentEntryModal = (): JSX.Element => {
    const { clientSecret, paymentEntryModalOpen, apiError, isLoading } = useValues(paymentEntryLogic)
    const { hidePaymentEntryModal, initiateAuthorization } = useActions(paymentEntryLogic)

    useEffect(() => {
        if (paymentEntryModalOpen) {
            initiateAuthorization()
        }
    }, [paymentEntryModalOpen, initiateAuthorization])

    const goToPay = (): void => {
        if (!clientSecret) {
            return
        }
        const returnUrl = `${window.location.origin}/billing/authorization_status`
        const target = `${PAY_URL}/checkout?session=${encodeURIComponent(clientSecret)}&return_url=${encodeURIComponent(returnUrl)}`
        window.location.assign(target)
    }

    return (
        <LemonModal
            onClose={hidePaymentEntryModal}
            width="max(44vw)"
            isOpen={paymentEntryModalOpen}
            title="Add your payment details to subscribe"
            description=""
        >
            <div>
                {apiError ? (
                    <div className="flex flex-col gap-2 my-2">
                        <p className="text-md">
                            We could not complete your upgrade at this time. Please review the error below and contact
                            support if you need help.
                        </p>
                        <LemonBanner type="error">{apiError}</LemonBanner>
                    </div>
                ) : clientSecret ? (
                    <div className="flex flex-col gap-3 my-2">
                        <p className="text-md">
                            You will be redirected to {new URL(PAY_URL).host} to add your payment details securely. A
                            temporary $0.50 authorization hold will be placed on your card to verify it. The hold is
                            automatically released within 7 days.
                        </p>
                        <div className="flex justify-end deprecated-space-x-2 mt-2">
                            <LemonButton disabled={isLoading} type="secondary" onClick={hidePaymentEntryModal}>
                                Cancel
                            </LemonButton>
                            <LemonButton loading={isLoading} type="primary" onClick={goToPay}>
                                Continue to checkout
                            </LemonButton>
                        </div>
                    </div>
                ) : (
                    <div className="min-h-80 flex flex-col justify-center items-center">
                        <div className="text-4xl">
                            <img
                                src="https://res.cloudinary.com/dmukukwp6/image/upload/loading_bdba47912e.gif"
                                alt="Loading animation"
                            />
                        </div>
                        <p className="text-secondary text-md mt-4">Processing your request...</p>
                    </div>
                )}
            </div>
        </LemonModal>
    )
}
