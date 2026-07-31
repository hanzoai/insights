import { useActions, useValues } from 'kea'
import { router } from 'kea-router'

import { Button, ButtonWithDropdown } from '@hanzo/elements'

import { Modal } from 'lib/elements/Modal'
import { Spinner } from 'lib/elements/Spinner/Spinner'
import { userLogic } from 'scenes/userLogic'

import { AvailableFeature } from '~/types'

import { PayGateMini } from '../PayGateMini/PayGateMini'
import { SubscriptionBaseProps, urlForSubscription, urlForSubscriptions } from './utils'
import { EditSubscription } from './views/EditSubscription'
import { ManageSubscriptions } from './views/ManageSubscriptions'

export interface SubscriptionsModalProps extends SubscriptionBaseProps {
    isOpen: boolean
    closeModal: () => void
    subscriptionId: number | 'new' | null
    inline?: boolean
}

export function SubscriptionsModal(props: SubscriptionsModalProps): JSX.Element {
    const { closeModal, dashboardId, insightShortId, subscriptionId, isOpen, inline } = props
    const { push } = useActions(router)
    const { userLoading } = useValues(userLogic)

    if (userLoading) {
        return <Spinner className="text-2xl" />
    }
    return (
        <Modal onClose={closeModal} isOpen={isOpen} width={600} simple title="" inline={inline}>
            <PayGateMini
                feature={AvailableFeature.SUBSCRIPTIONS}
                handleSubmit={closeModal}
                background={false}
                className="py-8"
                docsLink="https://hanzo.ai/docs/user-guides/subscriptions"
            >
                {!subscriptionId ? (
                    <ManageSubscriptions
                        insightShortId={insightShortId}
                        dashboardId={dashboardId}
                        onCancel={closeModal}
                        onSelect={(id) => push(urlForSubscription(id, props))}
                    />
                ) : (
                    <EditSubscription
                        id={subscriptionId}
                        insightShortId={insightShortId}
                        dashboardId={dashboardId}
                        onCancel={() => push(urlForSubscriptions(props))}
                        onDelete={() => push(urlForSubscriptions(props))}
                    />
                )}
            </PayGateMini>
        </Modal>
    )
}

export function SubscribeButton(props: SubscriptionBaseProps): JSX.Element {
    const { push } = useActions(router)

    return (
        <ButtonWithDropdown
            fullWidth
            dropdown={{
                actionable: true,
                closeParentPopoverOnClickInside: true,
                placement: 'right-start',
                overlay: (
                    <>
                        <Button onClick={() => push(urlForSubscription('new', props))} fullWidth>
                            New subscription
                        </Button>
                        <Button onClick={() => push(urlForSubscriptions(props))} fullWidth>
                            Manage subscriptions
                        </Button>
                    </>
                ),
            }}
        >
            Subscribe
        </ButtonWithDropdown>
    )
}
