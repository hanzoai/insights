import './Label.scss'

import clsx from 'clsx'

import { IconInfo } from '@hanzo/icons'

import { PayGateIcon } from 'lib/components/PayGateMini/PayGateButton'

import { AvailableFeature } from '~/types'

import { Link, LinkProps } from '../Link'
import { Tooltip } from '../Tooltip'

export interface LabelProps
    extends Pick<
        React.LabelHTMLAttributes<HTMLLabelElement>,
        'id' | 'htmlFor' | 'form' | 'children' | 'className' | 'onClick'
    > {
    info?: React.ReactNode
    infoLink?: LinkProps['to']
    showOptional?: boolean
    onExplanationClick?: () => void
    htmlFor?: string
    premiumFeature?: AvailableFeature
}

export function Label({
    children,
    info,
    className,
    showOptional,
    onExplanationClick,
    infoLink,
    htmlFor,
    premiumFeature,
    ...props
}: LabelProps): JSX.Element {
    return (
        <label className={clsx('Label', className)} htmlFor={htmlFor} {...props}>
            {children}

            {showOptional ? <span className="Label__extra">(optional)</span> : null}

            {onExplanationClick ? (
                <Link onClick={onExplanationClick}>
                    <span className="Label__extra">(what is this?)</span>
                </Link>
            ) : null}

            {info ? (
                <Tooltip title={info} interactive>
                    {infoLink ? (
                        <Link to={infoLink} target="_blank" className="inline-flex">
                            <IconInfo className="text-xl text-secondary shrink-0" />
                        </Link>
                    ) : (
                        <IconInfo className="text-xl text-secondary shrink-0" />
                    )}
                </Tooltip>
            ) : null}

            {premiumFeature && <PayGateIcon feature={premiumFeature} />}
        </label>
    )
}
