import { useActions, useValues } from 'kea'

import { IconEllipsis } from '@hanzo/icons'

import { Button } from 'lib/elements/Button'
import { Modal } from 'lib/elements/Modal'
import { Skeleton } from 'lib/elements/Skeleton'
import { ProfileBubbles } from 'lib/elements/ProfilePicture'
import { IconSlack } from 'lib/elements/icons'
import { capitalizeFirstLetter, pluralize } from 'lib/utils'

import { SubscriptionType } from '~/types'

import { subscriptionsLogic } from '../subscriptionsLogic'
import { SubscriptionBaseProps } from '../utils'

interface SubscriptionListItemProps {
    subscription: SubscriptionType
    onClick: () => void
    onDelete?: () => void
}

export function SubscriptionListItem({ subscription, onClick, onDelete }: SubscriptionListItemProps): JSX.Element {
    return (
        <Button
            type="secondary"
            onClick={onClick}
            data-attr="subscription-list-item"
            fullWidth
            sideAction={{
                icon: <IconEllipsis />,

                dropdown: {
                    overlay: (
                        <>
                            {onDelete && (
                                <Button
                                    onClick={onDelete}
                                    data-attr="subscription-list-item-delete"
                                    status="danger"
                                    fullWidth
                                >
                                    Delete Subscription
                                </Button>
                            )}
                        </>
                    ),
                },
            }}
        >
            <div className="flex justify-between flex-auto items-center p-2">
                <div>
                    <div className="text-link font-medium">{subscription.title}</div>
                    <div className="text-sm text-text-3000">{capitalizeFirstLetter(subscription.summary)}</div>
                </div>
                {subscription.target_type === 'email' ? (
                    <ProfileBubbles
                        limit={4}
                        people={subscription.target_value.split(',').map((email) => ({ email }))}
                    />
                ) : null}
                {subscription.target_type === 'slack' ? <IconSlack /> : null}
            </div>
        </Button>
    )
}

interface ManageSubscriptionsProps extends SubscriptionBaseProps {
    onCancel: () => void
    onSelect: (value: number | 'new') => void
}

export function ManageSubscriptions({
    insightShortId,
    dashboardId,
    onCancel,
    onSelect,
}: ManageSubscriptionsProps): JSX.Element {
    const logic = subscriptionsLogic({
        insightShortId,
        dashboardId,
    })

    const { subscriptions, subscriptionsLoading } = useValues(logic)
    const { deleteSubscription } = useActions(logic)

    return (
        <>
            <Modal.Header>
                <h3> Manage Subscriptions</h3>
            </Modal.Header>
            <Modal.Content>
                {subscriptionsLoading && !subscriptions.length ? (
                    <div className="deprecated-space-y-2">
                        <Skeleton className="w-1/2 h-4" />
                        <Skeleton.Row repeat={2} />
                    </div>
                ) : subscriptions.length ? (
                    <div className="deprecated-space-y-2">
                        <div>
                            <strong>{subscriptions?.length}</strong>
                            {' active '}
                            {pluralize(subscriptions.length || 0, 'subscription', 'subscriptions', false)}
                        </div>

                        <div className="max-h-[50vh] overflow-y-auto flex flex-col gap-2">
                            {subscriptions.map((sub) => (
                                <SubscriptionListItem
                                    key={sub.id}
                                    subscription={sub}
                                    onClick={() => onSelect(sub.id)}
                                    onDelete={() => deleteSubscription(sub.id)}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col p-4 items-center text-center">
                        <h3>There are no subscriptions for this insight</h3>

                        <p>Once subscriptions are created they will display here. </p>

                        <Button type="primary" onClick={() => onSelect('new')}>
                            Add subscription
                        </Button>
                    </div>
                )}
            </Modal.Content>

            <Modal.Footer>
                <div className="flex-1">
                    {subscriptions.length ? (
                        <Button type="secondary" onClick={() => onSelect('new')}>
                            Add subscription
                        </Button>
                    ) : null}
                </div>
                <Button type="secondary" onClick={onCancel}>
                    Close
                </Button>
            </Modal.Footer>
        </>
    )
}
