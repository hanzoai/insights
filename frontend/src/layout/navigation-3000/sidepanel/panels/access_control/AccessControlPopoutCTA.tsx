import { useActions } from 'kea'

import { IconOpenSidebar } from '@hanzo/icons'
import { Banner, Button } from '@hanzo/elements'

import { captureAccessControlEvent, resourceTypeToString } from 'lib/utils/accessControlUtils'
import { toSentenceCase } from 'lib/utils/strings'

import { sidePanelStateLogic } from '~/layout/navigation-3000/sidepanel/sidePanelStateLogic'
import { AccessControlResourceType, SidePanelTab } from '~/types'

interface AccessControlPopoutCTAProps {
    callback?: () => void
    resourceType: AccessControlResourceType
}

export const AccessControlPopoutCTA = ({ callback, resourceType }: AccessControlPopoutCTAProps): JSX.Element => {
    const { openSidePanel } = useActions(sidePanelStateLogic)

    return (
        <div>
            <h3>Access control</h3>
            <Banner type="info" className="mb-4">
                {toSentenceCase(resourceTypeToString(resourceType))} permissions are moving. We're rolling out our new
                access control system. Click below to open it.
            </Banner>
            <Button
                type="primary"
                icon={<IconOpenSidebar />}
                onClick={() => {
                    captureAccessControlEvent('access control popout cta clicked', { resourceType })
                    openSidePanel(SidePanelTab.AccessControl)
                    callback?.()
                }}
            >
                Open access control
            </Button>
        </div>
    )
}
