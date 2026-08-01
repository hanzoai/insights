import { useActions, useValues } from 'kea'

import { IconChevronDown } from '@hanzo/icons'
import { Button, Card } from '@hanzo/elements'

import { newAccountMenuLogic } from 'lib/components/Account/newAccountMenuLogic'
import { OrgSwitcher } from 'lib/components/Account/OrgSwitcher'
import { HogWelder } from 'lib/components/mascots'
import { Popover } from 'lib/elements/Popover/Popover'
import { UploadedLogo } from 'lib/elements/UploadedLogo/UploadedLogo'
import { SupportModalButton } from 'scenes/authentication/shared/SupportModalButton'
import { organizationLogic } from 'scenes/organizationLogic'
import { SceneExport } from 'scenes/sceneTypes'
import { userLogic } from 'scenes/userLogic'

export const scene: SceneExport = {
    component: OrganizationPendingDeletion,
    logic: organizationLogic,
}

export function OrganizationPendingDeletion(): JSX.Element {
    const { currentOrganization } = useValues(organizationLogic)
    const { otherOrganizations } = useValues(userLogic)
    const { isOrgSwitcherOpen } = useValues(newAccountMenuLogic)
    const { openOrgSwitcher, closeOrgSwitcher } = useActions(newAccountMenuLogic)
    const hasOtherOrgs = otherOrganizations.length > 0

    return (
        <div className="max-w-[600px] mx-auto px-2 py-8">
            <Card>
                <div className="flex flex-col gap-4 items-center text-center">
                    <HogWelder className="h-80" />
                    <h3>
                        Disassembling {currentOrganization?.name ? `"${currentOrganization.name}"` : 'all'} data at the
                        circuit level
                    </h3>
                    <p className="text-secondary">
                        Our mascot engineer is carefully taking everything apart. Your organization will be completely
                        deleted shortly - this usually takes a couple of minutes.
                    </p>
                    {hasOtherOrgs && (
                        <Popover
                            visible={isOrgSwitcherOpen}
                            onClickOutside={closeOrgSwitcher}
                            overlay={
                                <div className="w-[320px]">
                                    <OrgSwitcher dialog={false} />
                                </div>
                            }
                            placement="bottom"
                        >
                            <Button
                                type="secondary"
                                onClick={() => (isOrgSwitcherOpen ? closeOrgSwitcher() : openOrgSwitcher())}
                                sideIcon={<IconChevronDown />}
                            >
                                {currentOrganization ? (
                                    <span className="flex items-center gap-2">
                                        <UploadedLogo
                                            name={currentOrganization.name}
                                            entityId={currentOrganization.id}
                                            mediaId={currentOrganization.logo_media_id}
                                            size="xsmall"
                                        />
                                        Switch organization
                                    </span>
                                ) : (
                                    'Switch organization'
                                )}
                            </Button>
                        </Popover>
                    )}
                    <SupportModalButton kind="support" target_area="login" label="Contact support" />
                </div>
            </Card>
        </div>
    )
}
