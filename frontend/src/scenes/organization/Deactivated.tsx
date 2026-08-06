import { useValues } from 'kea'

import * as stopPng from '@hanzo/brand/hoggies/png/stop'
import { Card } from '@hanzo/elements'

import { pngHoggie } from 'lib/brand/hoggies'
import { SupportModalButton } from 'scenes/authentication/shared/SupportModalButton'
import { organizationLogic } from 'scenes/organizationLogic'
import { SceneExport } from 'scenes/sceneTypes'

const MascotStop = pngHoggie(stopPng)

export const scene: SceneExport = {
    component: OrganizationDeactivated,
    logic: organizationLogic,
}

export function OrganizationDeactivated(): JSX.Element {
    const { isNotActiveReason } = useValues(organizationLogic)

    return (
        <div className="max-w-[600px] mx-auto px-2 py-8">
            <Card>
                <div className="flex flex-col gap-4 items-center text-center">
                    <MascotStop className="w-52 h-52" />
                    <h3>Your organization has been deactivated. {isNotActiveReason}</h3>
                    <SupportModalButton kind="support" target_area="billing" label="Contact support" />
                </div>
            </Card>
        </div>
    )
}
