import { IconCopy } from '@hanzo/icons'
import { Button, Card, Input, Tabs } from '@hanzo/elements'

import { InviteMembersButton } from 'lib/components/Account/InviteMembersButton'
import { copyToClipboard } from 'lib/utils/copyToClipboard'

import { SDKTag } from '~/types'

import { NextButton } from './NextButton'
import { SDKGridProps } from './types'

export function SDKGrid({
    filteredSDKs,
    searchTerm,
    selectedTag,
    tags,
    onSDKClick,
    onSearchChange,
    onTagChange,
    currentTeam,
    showTopControls = true,
    installationComplete,
    showTopSkipButton,
}: SDKGridProps): JSX.Element {
    return (
        <div className="flex flex-col gap-y-4">
            <div className="flex flex-col gap-y-2">
                {showTopControls && (
                    <div className="flex flex-col-reverse md:flex-row justify-between gap-4">
                        <Input
                            value={searchTerm}
                            onChange={onSearchChange}
                            placeholder="Search"
                            className="w-full max-w-[220px]"
                        />
                        <div className="flex flex-row flex-wrap gap-2">
                            <Button
                                size="small"
                                type="primary"
                                onClick={() => void copyToClipboard(currentTeam?.api_token || '', 'Project token')}
                                icon={<IconCopy />}
                                data-attr="copy-project-token"
                            >
                                Copy project token
                            </Button>
                            <InviteMembersButton
                                type="primary"
                                size="small"
                                fullWidth={false}
                                text="Invite developer"
                            />
                            {showTopSkipButton && (
                                <NextButton size="small" installationComplete={installationComplete} />
                            )}
                        </div>
                    </div>
                )}
                <Tabs
                    activeKey={selectedTag ?? 'All'}
                    onChange={(key) => onTagChange(key === 'All' ? null : (key as SDKTag))}
                    tabs={tags.map((tag) => ({
                        key: tag,
                        label: tag,
                    }))}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {(filteredSDKs ?? []).map((sdk) => (
                        <Card
                            key={sdk.key}
                            className="p-4 cursor-pointer flex flex-col items-start justify-center"
                            onClick={() => onSDKClick(sdk)}
                        >
                            <div className="w-8 h-8 mb-2">
                                {typeof sdk.image === 'string' ? (
                                    <img src={sdk.image} className="w-8 h-8" alt={`${sdk.name} logo`} />
                                ) : typeof sdk.image === 'object' && 'default' in sdk.image ? (
                                    <img src={sdk.image.default} className="w-8 h-8" alt={`${sdk.name} logo`} />
                                ) : (
                                    sdk.image
                                )}
                            </div>

                            <strong>{sdk.name}</strong>
                        </Card>
                    ))}

                    {/* This will open a survey to collect feedback on the SDKs we don't support yet */}
                    {/* https://us.hanzo.ai/project/2/surveys/019b47ab-5f19-0000-7f31-4f9681cde589 */}
                    {searchTerm && (
                        <Card className="p-4 cursor-pointer flex flex-col items-start justify-center col-span-1 sm:col-span-2">
                            <div className="flex flex-col items-start gap-2">
                                <span className="mb-2 text-muted">
                                    Don&apos;t see your SDK listed? We are always looking to expand our list of
                                    supported SDKs.
                                </span>
                                <Button
                                    data-attr="onboarding-reach-out-to-us-button"
                                    type="secondary"
                                    size="small"
                                    targetBlank
                                >
                                    Reach out to us
                                </Button>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
