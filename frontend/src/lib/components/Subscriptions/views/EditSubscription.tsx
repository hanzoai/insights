import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'

import { IconChevronLeft } from '@hanzo/icons'
import { Input, TextArea, Link } from '@hanzo/elements'

import { UserActivityIndicator } from 'lib/components/UserActivityIndicator/UserActivityIndicator'
import { usersSelectOptions } from 'lib/components/UserSelectItem'
import { dayjs } from 'lib/dayjs'
import { SlackChannelPicker, SlackNotConfiguredBanner } from 'lib/integrations/SlackIntegrationHelpers'
import { integrationsLogic } from 'lib/integrations/integrationsLogic'
import { Banner } from 'lib/elements/Banner'
import { Button } from 'lib/elements/Button'
import { Field } from 'lib/elements/Field'
import { InputSelect } from 'lib/elements/InputSelect/InputSelect'
import { Label } from 'lib/elements/Label/Label'
import { Modal } from 'lib/elements/Modal'
import { Select } from 'lib/elements/Select'
import { Skeleton } from 'lib/elements/Skeleton'
import { preflightLogic } from 'scenes/PreflightCheck/preflightLogic'
import { membersLogic } from 'scenes/organization/membersLogic'

import { subscriptionLogic } from '../subscriptionLogic'
import { subscriptionsLogic } from '../subscriptionsLogic'
import {
    SubscriptionBaseProps,
    bysetposOptions,
    frequencyOptionsPlural,
    frequencyOptionsSingular,
    intervalOptions,
    monthlyWeekdayOptions,
    targetTypeOptions,
    timeOptions,
    weekdayOptions,
} from '../utils'

interface EditSubscriptionProps extends SubscriptionBaseProps {
    id: number | 'new'
    onCancel: () => void
    onDelete: () => void
}

export function EditSubscription({
    id,
    insightShortId,
    dashboardId,
    onCancel,
    onDelete,
}: EditSubscriptionProps): JSX.Element {
    const logicProps = {
        id,
        insightShortId,
        dashboardId,
    }
    const logic = subscriptionLogic(logicProps)
    const subscriptionslogic = subscriptionsLogic({
        insightShortId,
        dashboardId,
    })

    const { meFirstMembers, membersLoading } = useValues(membersLogic)
    const { subscription, subscriptionLoading, isSubscriptionSubmitting, subscriptionChanged } = useValues(logic)
    const { preflight, siteUrlMisconfigured } = useValues(preflightLogic)
    const { deleteSubscription } = useActions(subscriptionslogic)
    const { slackIntegrations } = useValues(integrationsLogic)
    // TODO: Fix this so that we use the appropriate config...
    const firstSlackIntegration = slackIntegrations?.[0]

    const emailDisabled = !preflight?.email_service_available

    const _onDelete = (): void => {
        if (id !== 'new') {
            deleteSubscription(id)
            onDelete()
        }
    }

    const formatter = new Intl.DateTimeFormat('en-US', { timeZoneName: 'shortGeneric' })
    const parts = formatter.formatToParts(new Date())
    const currentTimezone = parts?.find((part) => part.type === 'timeZoneName')?.value

    return (
        <Form
            logic={subscriptionLogic}
            props={logicProps}
            formKey="subscription"
            enableFormOnSubmit
            className="Modal__layout"
        >
            <Modal.Header>
                <div className="flex items-center gap-2">
                    <Button icon={<IconChevronLeft />} onClick={onCancel} size="xsmall" />

                    <h3>{id === 'new' ? 'New' : 'Edit '} Subscription</h3>
                </div>
            </Modal.Header>

            <Modal.Content className="deprecated-space-y-2">
                {!subscription ? (
                    subscriptionLoading ? (
                        <div className="deprecated-space-y-4">
                            <Skeleton className="w-1/2 h-4" />
                            <Skeleton.Row />
                            <Skeleton className="w-1/2 h-4" />
                            <Skeleton.Row />
                            <Skeleton className="w-1/2 h-4" />
                            <Skeleton.Row />
                        </div>
                    ) : (
                        <div className="p-4 text-center">
                            <h2>Not found</h2>
                            <p>This subscription could not be found. It may have been deleted.</p>
                        </div>
                    )
                ) : (
                    <>
                        {subscription?.created_by ? (
                            <UserActivityIndicator
                                at={subscription.created_at}
                                by={subscription.created_by}
                                prefix="Created"
                                className="mb-4"
                            />
                        ) : null}

                        {siteUrlMisconfigured && (
                            <Banner type="warning">
                                <>
                                    Your <code>SITE_URL</code> environment variable seems misconfigured. Your{' '}
                                    <code>SITE_URL</code> is set to{' '}
                                    <b>
                                        <code>{preflight?.site_url}</code>
                                    </b>{' '}
                                    but you're currently browsing this page from{' '}
                                    <b>
                                        <code>{window.location.origin}</code>
                                    </b>
                                    . <br />
                                    If this value is not configured correctly Insights may be unable to correctly send
                                    Subscriptions.{' '}
                                    <Link
                                        to="https://hanzo.ai/docs/configuring-insights/environment-variables?utm_medium=in-product&utm_campaign=subcriptions-system-status-site-url-misconfig"
                                        target="_blank"
                                        targetBlankIcon
                                    >
                                        Learn more
                                    </Link>
                                </>
                            </Banner>
                        )}

                        <Field name="title" label="Name">
                            <Input placeholder="e.g. Weekly team report" />
                        </Field>

                        <Field name="target_type" label="Destination">
                            <Select options={targetTypeOptions} />
                        </Field>

                        {subscription.target_type === 'email' ? (
                            <>
                                {emailDisabled && (
                                    <Banner type="error">
                                        <>
                                            Email subscriptions are not currently possible as this Insights instance
                                            isn't{' '}
                                            <Link
                                                to="https://hanzo.ai/docs/self-host/configure/email"
                                                target="_blank"
                                                targetBlankIcon
                                            >
                                                configured&nbsp;to&nbsp;send&nbsp;emails&nbsp;
                                            </Link>
                                            .
                                        </>
                                    </Banner>
                                )}

                                <Field
                                    name="target_value"
                                    label="Who do you want to subscribe"
                                    help="Enter the email addresses of the users you want to share with"
                                >
                                    {({ value, onChange }) => (
                                        <InputSelect
                                            onChange={(val) => onChange(val.join(','))}
                                            value={value?.split(',').filter(Boolean)}
                                            disabled={emailDisabled}
                                            mode="multiple"
                                            allowCustomValues
                                            data-attr="subscribed-emails"
                                            options={usersSelectOptions(meFirstMembers.map((x) => x.user))}
                                            loading={membersLoading}
                                            placeholder="Enter an email address"
                                        />
                                    )}
                                </Field>

                                <Field name="invite_message" label="Message" showOptional>
                                    <TextArea placeholder="Your message to new subscribers (optional)" />
                                </Field>
                            </>
                        ) : null}

                        {subscription.target_type === 'slack' ? (
                            <>
                                {!firstSlackIntegration ? (
                                    <SlackNotConfiguredBanner />
                                ) : (
                                    <>
                                        <Field
                                            name="target_value"
                                            label="Which Slack channel to send reports to"
                                            help={
                                                <>
                                                    Private channels are only shown if you have{' '}
                                                    <Link to="https://hanzo.ai/docs/webhooks/slack" target="_blank">
                                                        added the Insights Slack App
                                                    </Link>{' '}
                                                    to them. You can also paste the channel ID (e.g.{' '}
                                                    <code>C1234567890</code>) to search for channels.
                                                </>
                                            }
                                        >
                                            {({ value, onChange }) => (
                                                <SlackChannelPicker
                                                    value={value}
                                                    onChange={onChange}
                                                    integration={firstSlackIntegration}
                                                />
                                            )}
                                        </Field>
                                    </>
                                )}
                            </>
                        ) : null}

                        {subscription.target_type === 'webhook' ? (
                            <>
                                <Field name="target_value" label="Webhook URL">
                                    <Input placeholder="https://example.com/webhooks/1234" />
                                </Field>
                                <div className="text-xs text-secondary mt-2">
                                    Webhooks will be called with a HTTP POST request. The webhook endpoint should
                                    respond with a healthy HTTP code (2xx).
                                </div>
                            </>
                        ) : null}

                        <div>
                            <div className="flex items-baseline justify-between w-full">
                                <Label className="mb-2">Recurrence</Label>
                                <div className="text-xs text-secondary text-right">{currentTimezone}</div>
                            </div>
                            <div className="flex gap-2 items-center rounded border p-2 flex-wrap">
                                <span>Send every</span>
                                <Field name="interval">
                                    <Select options={intervalOptions} />
                                </Field>
                                <Field name="frequency">
                                    <Select
                                        options={
                                            subscription.interval === 1
                                                ? frequencyOptionsSingular
                                                : frequencyOptionsPlural
                                        }
                                    />
                                </Field>

                                {subscription.frequency === 'weekly' && (
                                    <>
                                        <span>on</span>
                                        <Field name="byweekday">
                                            {({ value, onChange }) => (
                                                <Select
                                                    options={weekdayOptions}
                                                    value={value ? value[0] : null}
                                                    onChange={(val) => onChange([val])}
                                                />
                                            )}
                                        </Field>
                                    </>
                                )}

                                {subscription.frequency === 'monthly' && (
                                    <>
                                        <span>on the</span>
                                        <Field name="bysetpos">
                                            {({ value, onChange }) => (
                                                <Select
                                                    options={bysetposOptions}
                                                    value={value ? String(value) : null}
                                                    onChange={(val) => {
                                                        onChange(typeof val === 'string' ? parseInt(val, 10) : null)
                                                    }}
                                                />
                                            )}
                                        </Field>
                                        <Field name="byweekday">
                                            {({ value, onChange }) => (
                                                <Select
                                                    dropdownMatchSelectWidth={false}
                                                    options={monthlyWeekdayOptions}
                                                    // "day" is a special case where it is a list of all available days
                                                    value={value ? (value.length === 1 ? value[0] : 'day') : null}
                                                    onChange={(val) =>
                                                        onChange(
                                                            val === 'day'
                                                                ? Object.values(weekdayOptions).map((v) => v.value)
                                                                : [val]
                                                        )
                                                    }
                                                />
                                            )}
                                        </Field>
                                    </>
                                )}
                                <span>by</span>
                                <Field name="start_date">
                                    {({ value, onChange }) => (
                                        <Select
                                            options={timeOptions}
                                            value={dayjs(value).hour().toString()}
                                            onChange={(val) => {
                                                onChange(
                                                    dayjs()
                                                        .hour(typeof val === 'string' ? parseInt(val, 10) : 0)
                                                        .minute(0)
                                                        .second(0)
                                                        .toISOString()
                                                )
                                            }}
                                        />
                                    )}
                                </Field>
                            </div>
                        </div>
                    </>
                )}
            </Modal.Content>

            <Modal.Footer>
                <div className="flex-1">
                    {subscription && id !== 'new' && (
                        <Button
                            type="secondary"
                            status="danger"
                            onClick={_onDelete}
                            disabled={subscriptionLoading}
                        >
                            Delete subscription
                        </Button>
                    )}
                </div>
                <Button type="secondary" onClick={onCancel}>
                    Cancel
                </Button>
                <Button
                    type="primary"
                    htmlType="submit"
                    loading={isSubscriptionSubmitting}
                    disabled={!subscriptionChanged || subscriptionLoading}
                >
                    {id === 'new' ? 'Create subscription' : 'Save'}
                </Button>
            </Modal.Footer>
        </Form>
    )
}
