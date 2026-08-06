import './PreflightCheck.scss'

import clsx from 'clsx'
import { useActions, useValues } from 'kea'

import { IconCheckCircle, IconCollapse, IconExpand, IconRefresh, IconWarning } from '@hanzo/icons'
import { Link, Spinner } from '@hanzo/elements'

import { AnimatedCollapsible } from 'lib/components/AnimatedCollapsible'
import { BridgePage } from 'lib/components/BridgePage/BridgePage'
import { IconErrorOutline } from 'lib/elements/icons'
import { Button } from 'lib/elements/Button'
import { Divider } from 'lib/elements/Divider'
import { Row } from 'lib/elements/Row'
import { capitalizeFirstLetter } from 'lib/utils/strings'
import { SceneExport } from 'scenes/sceneTypes'

import { PreflightCheckStatus, PreflightItem, preflightLogic } from './preflightLogic'

export const scene: SceneExport = {
    component: PreflightCheck,
    logic: preflightLogic,
}

function PreflightCheckIcon({ status, loading }: { status: PreflightCheckStatus; loading?: boolean }): JSX.Element {
    if (loading) {
        return <Spinner textColored className="text-accent" />
    }
    if (status === 'validated') {
        return <IconCheckCircle />
    } else if (status === 'warning' || status === 'optional') {
        return <IconWarning />
    }
    return <IconErrorOutline />
}

function PreflightItemRow({ name, status, caption }: PreflightItem): JSX.Element {
    const { preflightLoading } = useValues(preflightLogic)
    return (
        <div className={clsx('PreflightItem', preflightLoading ? 'Preflight--loading' : `Preflight--${status}`)}>
            <div className="PreflightItem__icon-container">
                <PreflightCheckIcon status={status} loading={preflightLoading} />
            </div>
            <div className="PreflightItem__text-container">
                <p className="PreflightItem__item-name">{name}</p>
                {caption && (
                    <p data-attr="caption" className="text-secondary">
                        {caption}
                    </p>
                )}
            </div>

            <div>
                <p className="Preflight__status-text" data-attr="status-text">
                    {capitalizeFirstLetter(preflightLoading ? 'checking' : status)}
                </p>
            </div>
        </div>
    )
}

export function PreflightCheck(): JSX.Element {
    const { preflight, preflightLoading, preflightMode, checks, areChecksExpanded, checksSummary } =
        useValues(preflightLogic)
    const { setPreflightMode, handlePreflightFinished, setChecksManuallyExpanded, revalidatePreflight } =
        useActions(preflightLogic)

    return (
        <BridgePage
            view="preflight-check"
            footer={
                <p className="text-center mt-4 mb-0">
                    Need help? Take a look at our{' '}
                    <Link
                        to="https://hanzo.ai/docs/self-host/deploy/troubleshooting"
                        target="_blank"
                        targetBlankIcon={false}
                    >
                        documentation
                    </Link>{' '}
                    or{' '}
                    <Link to="https://hanzo.ai/support" target="_blank" targetBlankIcon={false}>
                        visit community support
                    </Link>
                    .
                </p>
            }
            fixedWidth={false}
        >
            <div className="Preflight">
                {!preflightMode ? (
                    <>
                        <div className="Preflight__header">
                            <p className="Preflight__header--title-text">Select a launch mode</p>
                            <p className="Preflight__header--secondary-text">
                                What's your plan for this installation? We'll make infrastructure checks accordingly.
                            </p>
                        </div>
                        <Button
                            fullWidth
                            center
                            type="primary"
                            className="mt-2"
                            size="large"
                            data-attr="preflight-live"
                            onClick={() => setPreflightMode('live')}
                        >
                            Live implementation
                        </Button>
                        <Button
                            type="secondary"
                            fullWidth
                            center
                            className="mt-2"
                            size="large"
                            data-attr="preflight-experimentation"
                            onClick={() => setPreflightMode('experimentation')}
                        >
                            Just experimenting
                        </Button>
                        <Divider thick dashed className="my-6" />
                        <p className="text-secondary text-center mb-0">
                            We will not enforce some security requirements in experimentation mode.
                        </p>
                    </>
                ) : (
                    <>
                        <div className="Preflight__header">
                            <p className="Preflight__header--title-text">Validate implementation</p>
                            <p className="Preflight__header--secondary-text">
                                Validation happens immediately. You can rerun validation checks by clicking “validate
                                requirements”. If you get stuck, try our{' '}
                                <Link to="https://hanzo.ai/docs/self-host/deploy/troubleshooting" target="_blank">
                                    troubleshooting guide
                                </Link>{' '}
                                or our{' '}
                                <Link to="https://hanzo.ai/docs/runbook" target="_blank">
                                    self-host runbook
                                </Link>
                                .
                            </p>
                        </div>

                        <div className="Preflight__checks-container">
                            <div className="Preflight__check-summary">
                                <div
                                    className={clsx(
                                        'Preflight__summary-icon-container',
                                        preflightLoading
                                            ? 'Preflight--loading'
                                            : `Preflight--${checksSummary.summaryStatus}`
                                    )}
                                >
                                    <PreflightCheckIcon
                                        status={checksSummary.summaryStatus}
                                        loading={preflightLoading}
                                    />
                                </div>
                                <div className="Preflight__summary-text-container">
                                    <p className="Preflight__summary-header">Validation checks</p>
                                    <p data-attr="caption" className="text-secondary Preflight__summary-description">
                                        {checksSummary.summaryString}
                                    </p>
                                </div>
                                <Button
                                    icon={
                                        areChecksExpanded ? (
                                            <IconCollapse style={{ color: 'var(--color-text-secondary)' }} />
                                        ) : (
                                            <IconExpand style={{ color: 'var(--color-text-secondary)' }} />
                                        )
                                    }
                                    onClick={() => {
                                        setChecksManuallyExpanded(!areChecksExpanded)
                                    }}
                                />
                            </div>
                            <AnimatedCollapsible collapsed={!areChecksExpanded}>
                                <>
                                    {checks.map((item) => (
                                        <PreflightItemRow key={item.id} {...item} />
                                    ))}
                                </>
                            </AnimatedCollapsible>
                            <Button
                                center
                                fullWidth
                                size="large"
                                data-attr="preflight-refresh"
                                onClick={() => revalidatePreflight()}
                                disabled={preflightLoading || !preflight}
                                icon={<IconRefresh />}
                            >
                                Validate requirements
                            </Button>
                        </div>
                        <Divider thick dashed className="my-6" />
                        {checksSummary.summaryStatus !== 'error' || preflightMode == 'experimentation' ? (
                            <Button
                                fullWidth
                                center
                                type="primary"
                                className="mt-2"
                                size="large"
                                data-attr="preflight-complete"
                                onClick={handlePreflightFinished}
                            >
                                Continue
                            </Button>
                        ) : (
                            <Row fullWidth center className="mt-2 Preflight__cannot-continue" size="large">
                                <p className="text-center text-secondary">
                                    All required checks must pass before you can continue
                                </p>
                            </Row>
                        )}
                    </>
                )}
            </div>
        </BridgePage>
    )
}

export default PreflightCheck
