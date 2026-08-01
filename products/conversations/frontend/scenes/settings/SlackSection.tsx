import { useActions, useValues } from 'kea'

import {
    Banner,
    Button,
    Card,
    Checkbox,
    Divider,
    Input,
    Tag,
    Link,
} from '@hanzo/elements'

import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { FEATURE_FLAGS, OrganizationMembershipLevel } from 'lib/constants'
import { Dialog } from 'lib/elements/Dialog'
import { InputSelect } from 'lib/elements/InputSelect/InputSelect'
import { featureFlagLogic } from 'lib/logic/featureFlagLogic'

import { SceneSection } from '~/layout/scenes/components/SceneSection'

import { supportSettingsLogic } from './supportSettingsLogic'

export function SlackSection(): JSX.Element {
    return (
        <SceneSection
            title="SupportHog Slack bot"
            description={
                <>
                    Add the SupportHog bot to your Slack workspace to create and manage support tickets directly from
                    Slack messages.{' '}
                    <Link to="https://hanzo.ai/docs/support/slack" target="_blank">
                        Docs
                    </Link>
                </>
            }
        >
            <Card hoverEffect={false} className="flex flex-col gap-y-2 max-w-[800px] px-4 py-3">
                <SlackChannelSection />
            </Card>
        </SceneSection>
    )
}

function SlackChannelSection(): JSX.Element {
    const {
        slackConnected,
        slackChannelIds,
        slackChannels,
        slackChannelsLoading,
        slackTicketEmoji,
        slackTicketEmojiValue,
        slackBotIconUrl,
        slackBotIconUrlValue,
        slackBotDisplayName,
        slackBotDisplayNameValue,
        slackNotifyOnJoin,
        slackNotifyOnLeave,
        slackAlertChannelId,
        slackNudgeEnabled,
        slackNeedsReconnect,
        currentTeamLoading,
    } = useValues(supportSettingsLogic)
    const { featureFlags } = useValues(featureFlagLogic)
    const memberAlertsEnabled = !!featureFlags[FEATURE_FLAGS.PRODUCT_SUPPORT_SLACK_NOTIFY_ON_MEMBERS]
    const {
        connectSlack,
        setSlackChannels,
        loadSlackChannelsWithToken,
        setSlackTicketEmojiValue,
        saveSlackTicketEmoji,
        setSlackBotIconUrlValue,
        setSlackBotDisplayNameValue,
        saveSlackBotSettings,
        setSlackNotifyOnJoin,
        setSlackNotifyOnLeave,
        setSlackAlertChannel,
        setSlackNudgeEnabled,
        disconnectSlack,
    } = useActions(supportSettingsLogic)
    const adminRestrictionReason = useRestrictedArea({
        scope: RestrictionScope.Organization,
        minimumAccessLevel: OrganizationMembershipLevel.Admin,
    })

    return (
        <div className="flex flex-col gap-y-2">
            <div>
                <label className="font-medium">Connection</label>
                <p className="text-xs text-muted-alt">
                    Install the SupportHog bot in your Slack workspace to enable support ticket creation from channels,
                    mentions, and emoji reactions. This is separate from the main Insights Slack integration.
                </p>
                {!slackConnected && (
                    <Button
                        className="mt-2"
                        type="primary"
                        size="small"
                        disabledReason={adminRestrictionReason}
                        onClick={() => connectSlack(window.location.pathname)}
                    >
                        Add SupportHog to Slack
                    </Button>
                )}
                {slackNeedsReconnect && (
                    <Banner
                        type="warning"
                        className="mt-2"
                        action={{
                            children: 'Reconnect',
                            disabledReason: adminRestrictionReason,
                            onClick: () => connectSlack(window.location.pathname),
                        }}
                    >
                        Files sent in Slack won't appear on tickets, and images you send from Insights arrive as links
                        instead of attachments. Reconnect SupportHog to give it access to files.
                    </Banner>
                )}
            </div>
            {slackConnected && (
                <>
                    <Divider />
                    <div className="gap-4">
                        <div>
                            <label className="font-medium">Support channels</label>
                            <p className="text-xs text-muted-alt">
                                Messages posted in any of these channels will automatically create support tickets.
                                Thread replies become ticket messages. Make sure the SupportHog bot is invited to every
                                selected channel.
                            </p>
                        </div>
                        <div className="flex gap-2 items-center">
                            <InputSelect
                                mode="multiple"
                                value={slackChannelIds}
                                options={slackChannels.map((c) => ({
                                    key: c.id,
                                    label: `#${c.name ?? c.id}`,
                                }))}
                                onChange={(newValue: string[]) => setSlackChannels(newValue)}
                                loading={slackChannelsLoading}
                                placeholder="Select channels"
                            />
                            <Button
                                type="secondary"
                                size="small"
                                onClick={loadSlackChannelsWithToken}
                                disabledReason={slackChannelsLoading ? 'Loading channels...' : undefined}
                            >
                                Refresh
                            </Button>
                        </div>
                    </div>
                    <Divider />
                    <div className="flex flex-col gap-2">
                        <div>
                            <label className="font-medium">Ticket nudges</label>
                            <p className="text-xs text-muted-alt">
                                When enabled, SupportHog replies in-thread asking whether the customer wants to open a
                                ticket. This means customers don't have to remember the emoji reaction or @mention.
                                'Support channels' will still have tickets created for every thread, and no nudge is
                                sent.
                            </p>
                        </div>
                        <Checkbox
                            checked={slackNudgeEnabled}
                            onChange={setSlackNudgeEnabled}
                            disabled={currentTeamLoading}
                            label="Nudge users to open tickets"
                        />
                    </div>
                    {memberAlertsEnabled && (
                        <>
                            <Divider />
                            <div className="flex flex-col gap-2">
                                <div>
                                    <label className="font-medium">Channel membership alerts</label>
                                    <p className="text-xs text-muted-alt">
                                        Notify a channel when someone joins or leaves any channel the SupportHog bot is
                                        in.
                                    </p>
                                </div>
                                <Checkbox
                                    checked={slackNotifyOnJoin}
                                    onChange={setSlackNotifyOnJoin}
                                    disabled={currentTeamLoading}
                                    label="Alert when someone joins a channel"
                                />
                                <Checkbox
                                    checked={slackNotifyOnLeave}
                                    onChange={setSlackNotifyOnLeave}
                                    disabled={currentTeamLoading}
                                    label="Alert when someone leaves a channel"
                                />
                                <div className="flex gap-2 items-center">
                                    <InputSelect
                                        mode="single"
                                        value={slackAlertChannelId ? [slackAlertChannelId] : []}
                                        options={slackChannels.map((c) => ({
                                            key: c.id,
                                            label: `#${c.name ?? c.id}`,
                                        }))}
                                        onChange={(newValue: string[]) => setSlackAlertChannel(newValue[0] ?? null)}
                                        loading={slackChannelsLoading}
                                        disabled={currentTeamLoading || (!slackNotifyOnJoin && !slackNotifyOnLeave)}
                                        placeholder="Select alerts channel"
                                    />
                                    <Button
                                        type="secondary"
                                        size="small"
                                        onClick={loadSlackChannelsWithToken}
                                        disabledReason={slackChannelsLoading ? 'Loading channels...' : undefined}
                                    >
                                        Refresh
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                    <Divider />
                    <div className="flex items-center gap-4 justify-between">
                        <div>
                            <label className="font-medium">Ticket emoji trigger</label>
                            <p className="text-xs text-muted-alt">
                                React with this emoji on any message to create a support ticket from it.
                            </p>
                        </div>
                        <div className="flex gap-2 items-center">
                            <Input
                                value={slackTicketEmojiValue ?? slackTicketEmoji}
                                onChange={setSlackTicketEmojiValue}
                                placeholder="ticket"
                                className="max-w-[200px]"
                            />
                            <Button
                                type="primary"
                                size="small"
                                onClick={saveSlackTicketEmoji}
                                disabledReason={!slackTicketEmojiValue ? 'Enter an emoji name' : undefined}
                            >
                                Save
                            </Button>
                        </div>
                    </div>
                    <Divider />
                    <div className="flex flex-col gap-2">
                        <div>
                            <label className="font-medium">Bot appearance</label>
                            <p className="text-xs text-muted-alt">
                                Override the bot's display name and icon when posting messages. Leave blank to use
                                defaults. Requires the bot to be re-authorized if it was connected before this feature
                                was available.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Input
                                value={slackBotDisplayNameValue ?? slackBotDisplayName ?? ''}
                                onChange={setSlackBotDisplayNameValue}
                                placeholder="Display name (e.g. SupportHog)"
                                className="flex-1"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Input
                                value={slackBotIconUrlValue ?? slackBotIconUrl ?? ''}
                                onChange={setSlackBotIconUrlValue}
                                placeholder="Icon URL (e.g. https://example.com/icon.png)"
                                className="flex-1"
                            />
                        </div>
                        <div>
                            <Button
                                type="primary"
                                size="small"
                                onClick={saveSlackBotSettings}
                                disabledReason={
                                    slackBotDisplayNameValue === null && slackBotIconUrlValue === null
                                        ? 'No changes to save'
                                        : undefined
                                }
                            >
                                Save
                            </Button>
                        </div>
                    </div>
                    <Divider />
                    <div className="flex items-center gap-4 justify-between">
                        <div>
                            <label className="font-medium">Bot mention</label>
                            <p className="text-xs text-muted-alt">
                                Users can @mention the bot in any channel to create a support ticket.
                            </p>
                        </div>
                        <Tag type="success">Active</Tag>
                    </div>
                    <Divider />
                    <div className="flex justify-end">
                        <Button
                            type="secondary"
                            status="danger"
                            size="small"
                            disabledReason={adminRestrictionReason}
                            onClick={() => {
                                Dialog.open({
                                    title: 'Remove SupportHog bot?',
                                    description:
                                        'This will stop creating tickets from Slack messages. Existing tickets will not be affected.',
                                    primaryButton: {
                                        status: 'danger',
                                        children: 'Remove',
                                        onClick: disconnectSlack,
                                    },
                                    secondaryButton: { children: 'Cancel' },
                                })
                            }}
                        >
                            Remove SupportHog bot
                        </Button>
                    </div>
                </>
            )}
        </div>
    )
}
