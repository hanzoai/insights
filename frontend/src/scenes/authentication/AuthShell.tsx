import { ReactNode } from 'react'

import { useValues } from 'kea'

import { BridgePage } from 'lib/components/BridgePage/BridgePage'
import { preflightLogic } from 'scenes/PreflightCheck/preflightLogic'

import twigAuthBg from 'public/twig-auth-bg.png'
import { TwigAuthLeftPanel } from './TwigAuthLeftPanel'

interface AuthShellProps {
    view: string
    children: ReactNode
    header?: ReactNode
    footer?: ReactNode
    message?: ReactNode
    leftContainerContent?: JSX.Element
    fixedWidth?: boolean
    sideLogo?: boolean
    showMascot?: boolean // kept for call-site compat, ignored
    hideFooterForTwig?: boolean
}

export function AuthShell({
    view,
    children,
    header,
    footer,
    leftContainerContent,
    fixedWidth,
    sideLogo,
    hideFooterForTwig,
}: AuthShellProps): JSX.Element {
    const { preflight } = useValues(preflightLogic)
    const isTwig = preflight?.auth_brand === 'twig'

    if (isTwig) {
        return (
            <BridgePage
                view={view}
                noLogo
                theme="twig"
                header={header}
                footer={hideFooterForTwig ? undefined : footer}
                leftContainerContent={<TwigAuthLeftPanel />}
                fixedWidth={fixedWidth}
                sideLogo={false}
                style={{
                    backgroundImage: `url(${twigAuthBg})`,
                }}
            >
                {children}
            </BridgePage>
        )
    }

    return (
        <BridgePage
            view={view}
            header={header}
            footer={footer}
            leftContainerContent={leftContainerContent}
            fixedWidth={fixedWidth}
            sideLogo={sideLogo}
        >
            {children}
        </BridgePage>
    )
}
