import { useActions, useValues } from 'kea'

import { Button } from '@hanzo/elements'

import { Card } from 'lib/elements/Card/Card'
import { SceneExport } from 'scenes/sceneTypes'
import { teamLogic } from 'scenes/teamLogic'

import { stripeConfirmInstallLogic } from './stripeConfirmInstallLogic'

export const scene: SceneExport = {
    component: StripeConfirmInstall,
    logic: stripeConfirmInstallLogic,
}

export function StripeConfirmInstall(): JSX.Element {
    const { params, hasRequiredParams, isSubmitting } = useValues(stripeConfirmInstallLogic)
    const { confirmInstall, cancelInstall } = useActions(stripeConfirmInstallLogic)
    const { currentTeam } = useValues(teamLogic)

    return (
        <div className="flex justify-center mt-8 px-4">
            <Card className="max-w-xl w-full" hoverEffect={false}>
                <h2 className="mb-2">Connect Stripe to Insights?</h2>
                {hasRequiredParams ? (
                    <>
                        <p>
                            You're about to link Stripe account{' '}
                            <code className="break-all">{params.stripe_user_id}</code> to{' '}
                            <strong>{currentTeam?.name ?? 'this project'}</strong>.
                        </p>
                        <p className="text-secondary text-sm">
                            If this isn't your Stripe account, click cancel and report this link to your Insights admin.
                        </p>
                        <div className="flex gap-2 mt-4">
                            <Button
                                type="primary"
                                onClick={confirmInstall}
                                loading={isSubmitting}
                                disabledReason={!hasRequiredParams ? 'Missing install parameters' : undefined}
                            >
                                Connect this Stripe account
                            </Button>
                            <Button type="secondary" onClick={cancelInstall} disabled={isSubmitting}>
                                Cancel
                            </Button>
                        </div>
                    </>
                ) : (
                    <p>
                        This Stripe install link is missing required parameters. Please restart the install from the
                        Stripe marketplace.
                    </p>
                )}
            </Card>
        </div>
    )
}

export default StripeConfirmInstall
