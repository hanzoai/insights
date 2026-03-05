import './BridgePage.scss'

import clsx from 'clsx'
import { useValues } from 'kea'

import { preflightLogic } from 'scenes/PreflightCheck/preflightLogic'
import { WelcomeLogo } from 'scenes/authentication/WelcomeLogo'

export type BridgePageCommonProps = {
    children?: React.ReactNode
    footer?: React.ReactNode
    header?: React.ReactNode
    view: string
    noLogo?: boolean
    sideLogo?: boolean
    fixedWidth?: boolean
    leftContainerContent?: JSX.Element
    mascot?: boolean // kept for call-site compat, ignored
    message?: React.ReactNode // kept for call-site compat, ignored
    theme?: 'default' | 'twig'
    style?: React.CSSProperties
}

export function BridgePage({
    children,
    header,
    footer,
    view,
    noLogo = false,
    sideLogo = false,
    fixedWidth = true,
    leftContainerContent,
    theme = 'default',
    style,
}: BridgePageCommonProps): JSX.Element {
    const { preflight: _preflight } = useValues(preflightLogic)

    return (
        <div
            className={clsx(
                'BridgePage',
                fixedWidth && 'BridgePage--fixed-width',
                theme === 'twig' && 'BridgePage--twig'
            )}
            style={style}
        >
            <div className="BridgePage__main">
                {leftContainerContent ? (
                    <div className="BridgePage__left-wrapper">
                        <div className="BridgePage__left">
                            {!noLogo && sideLogo && (
                                <div className="BridgePage__header-logo mb-16">
                                    <WelcomeLogo view={view} />
                                </div>
                            )}
                            {leftContainerContent}
                        </div>
                    </div>
                ) : null}
                <div className="BridgePage__content-wrapper">
                    {!noLogo && (
                        <div className={clsx('BridgePage__header-logo', { mobile: sideLogo })}>
                            <WelcomeLogo view={view} />
                        </div>
                    )}
                    <div className="BridgePage__header">{header}</div>
                    <div className="BridgePage__content">{children}</div>
                </div>
            </div>
            {footer && <div className="BridgePage__footer">{footer}</div>}
        </div>
    )
}
