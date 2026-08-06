import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { useActions, useValues } from 'kea'
import insights from 'insights-js'
import { useEffect, useState } from 'react'

import { Banner, Button, Modal } from '@hanzo/elements'

import { urls } from 'scenes/urls'

import { paymentEntryLogic } from './paymentEntryLogic'

const stripeJs = async (): Promise<typeof import('@stripe/stripe-js')> => await import('@stripe/stripe-js')

// Covers every way Stripe.js can fail to become usable: a blocked script, a network failure, or no
// publishable key at all on an instance without Stripe configured. Only the first is worth a retry,
// so the message offers a way out of the other two instead of looping the user on "try again".
const STRIPE_UNAVAILABLE_MESSAGE =
    "We couldn't load the payment form. Disable any ad blocker and reload the page. If it keeps failing, contact support."

export const PaymentForm = (): JSX.Element => {
    const { stripeError, isLoading, redirectPath } = useValues(paymentEntryLogic)
    const { setStripeError, clearErrors, hidePaymentEntryModal, pollAuthorizationStatus, setLoading } =
        useActions(paymentEntryLogic)

    const stripe = useStripe()
    const elements = useElements()

    const handleSubmit = async (event: React.MouseEvent<HTMLElement>): Promise<void> => {
        clearErrors()
        event.preventDefault()
        // Stripe.js never became usable: no publishable key, a blocked script, or a load failure.
        // Returning quietly leaves a button that does nothing at all, which reads as a broken app
        // and gives neither the user nor a support ticket anything to go on.
        if (!stripe || !elements) {
            setStripeError(STRIPE_UNAVAILABLE_MESSAGE)
            insights.captureException(new Error('payment entry stripe unavailable'), {
                has_stripe: !!stripe,
                has_elements: !!elements,
                has_public_key: !!window.STRIPE_PUBLIC_KEY,
            })
            return
        }
        setLoading(true)

        const returnUrl = `${window.location.origin}${urls.billingAuthorizationStatus()}`
        const queryParams = redirectPath ? `?postRedirectPath=${encodeURIComponent(redirectPath)}` : ''
        const result = await stripe.confirmPayment({
            elements,
            confirmParams: { return_url: `${returnUrl}${queryParams}` },
            redirect: 'if_required',
        })

        if (result.error) {
            setLoading(false)
            setStripeError(result.error.message)
            insights.captureException(new Error('payment entry stripe error', { cause: result.error }))
        } else {
            pollAuthorizationStatus(result.paymentIntent.id)
        }
    }

    return (
        <div>
            <PaymentElement />
            <p className="text-xs text-secondary mt-0.5">
                A temporary $0.50 authorization hold will be placed on your card to verify it. This hold will be
                automatically released within 7 days and you will not be charged.
            </p>
            {stripeError && <Banner type="error">{stripeError}</Banner>}
            <div className="flex justify-end deprecated-space-x-2 mt-2">
                <Button disabled={isLoading} type="secondary" onClick={hidePaymentEntryModal}>
                    Cancel
                </Button>
                <Button loading={isLoading} type="primary" onClick={(event) => void handleSubmit(event)}>
                    Submit
                </Button>
            </div>
        </div>
    )
}

export const PaymentEntryModal = (): JSX.Element => {
    const { clientSecret, paymentEntryModalOpen, apiError } = useValues(paymentEntryLogic)
    const { hidePaymentEntryModal, initiateAuthorization, setStripeError } = useActions(paymentEntryLogic)
    const [stripePromise, setStripePromise] = useState<any>(null)

    useEffect(() => {
        // Only load Stripe.js when the modal is opened
        if (paymentEntryModalOpen && !stripePromise) {
            const loadStripeJs = async (): Promise<void> => {
                const { loadStripe } = await stripeJs()
                const publicKey = window.STRIPE_PUBLIC_KEY!
                setStripePromise(await loadStripe(publicKey))
            }
            // `loadStripe` rejects outright when the key is missing (an instance without Stripe
            // configured, e.g. local dev), so without a catch this is an unhandled rejection and the
            // only symptom is an inert form.
            void loadStripeJs().catch((error) => {
                insights.captureException(new Error('payment entry stripe load failed', { cause: error }))
                // Surfaced now rather than on the first click: otherwise the modal just shows a
                // blank payment area, and the only way to find out is to submit it.
                setStripeError(STRIPE_UNAVAILABLE_MESSAGE)
            })
        }
    }, [paymentEntryModalOpen, stripePromise, setStripeError])

    useEffect(() => {
        if (paymentEntryModalOpen) {
            initiateAuthorization()
        }
    }, [paymentEntryModalOpen, initiateAuthorization])

    return (
        <Modal
            onClose={hidePaymentEntryModal}
            width="max(44vw)"
            isOpen={paymentEntryModalOpen}
            title="Add your payment details to subscribe"
            description=""
        >
            <div>
                {clientSecret ? (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <PaymentForm />
                    </Elements>
                ) : apiError ? (
                    <div className="flex flex-col gap-2 my-2">
                        <p className="text-md">
                            We could not complete your upgrade at this time. Please review the error below and contact
                            support if you need help.
                        </p>
                        <Banner type="error">{apiError}</Banner>
                    </div>
                ) : (
                    <div className="min-h-80 flex flex-col justify-center items-center">
                        <img src="/static/payment-loading.gif" alt="" aria-hidden="true" className="h-20 w-20" />
                        <p className="text-secondary text-md mt-4">We're contacting the mascots for approval.</p>
                    </div>
                )}
            </div>
        </Modal>
    )
}
