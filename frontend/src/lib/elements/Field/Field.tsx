import clsx from 'clsx'
import { Field as KeaField, FieldProps as KeaFieldProps } from 'kea-forms/lib/components'

import { Label } from 'lib/elements/Label/Label'
import { IconErrorOutline } from 'lib/elements/icons'
import { cn } from 'lib/utils/css-classes'

import { AvailableFeature } from '~/types'

export type PureFieldProps = {
    /** The label name to be displayed */
    label?: React.ReactNode
    /** Will show a muted (optional) next to the label */
    showOptional?: boolean
    /** Will show a clickable (what is this?) next to the label, useful if we want to toggle explanation modals on click */
    onExplanationClick?: () => void
    /** Info tooltip to be displayed next to the label */
    info?: React.ReactNode
    /** Help text to be shown directly beneath the input */
    help?: React.ReactNode
    /** Error message to be displayed */
    error?: React.ReactNode
    renderError?: (error: string) => React.ReactNode
    className?: string
    children?: React.ReactNode
    onClick?: () => void
    /** Flex the field as a row rather than columns */
    inline?: boolean
    /** The id of the input this field is for */
    htmlFor?: string
    /** The class name override for the label */
    labelClassName?: string
    /** Shows "locked" icon next to the label, opens payment on click */
    premiumFeature?: AvailableFeature
}

const FieldError = ({ error }: { error: string }): JSX.Element => {
    return (
        <div className="text-danger flex items-center gap-1 text-sm">
            <IconErrorOutline className="text-xl shrink-0" /> {error}
        </div>
    )
}

const PureField = ({
    label,
    info,
    error,
    help,
    htmlFor,
    showOptional,
    onExplanationClick,
    className,
    children,
    inline,
    onClick,
    renderError,
    labelClassName,
    premiumFeature,
}: PureFieldProps): JSX.Element => {
    return (
        <div
            onClick={onClick}
            className={cn(
                'Field flex',
                { 'gap-2': className ? className.indexOf('gap-') === -1 : true },
                className,
                error && 'Field--error',
                inline ? 'flex-row' : 'flex-col'
            )}
        >
            {label ? (
                <Label
                    info={info}
                    showOptional={showOptional}
                    onExplanationClick={onExplanationClick}
                    className={clsx(labelClassName, {
                        'cursor-pointer': !!onClick,
                    })}
                    htmlFor={htmlFor}
                    premiumFeature={premiumFeature}
                >
                    {label}
                </Label>
            ) : null}
            {children}
            {help ? <div className="text-secondary text-xs">{help}</div> : null}
            {typeof error === 'string' ? renderError ? renderError(error) : <FieldError error={error} /> : null}
        </div>
    )
}

export type FieldProps = Omit<PureFieldProps, 'children' | 'error'> & Pick<KeaFieldProps, 'children' | 'name'>

/** A field for use within a Kea form. Outside a form use `Field.Pure`. */
export const Field = ({
    name,
    help,
    className,
    showOptional,
    inline,
    info,
    renderError,
    labelClassName,
    premiumFeature,
    ...keaFieldProps
}: FieldProps): JSX.Element => {
    const template: KeaFieldProps['template'] = ({ label, kids, error }) => {
        return (
            <PureField
                label={label}
                error={error}
                help={help}
                className={className}
                showOptional={showOptional}
                inline={inline}
                info={info}
                renderError={renderError}
                labelClassName={labelClassName}
                premiumFeature={premiumFeature}
            >
                {kids as React.ReactNode}
            </PureField>
        )
    }
    return <KeaField {...keaFieldProps} name={name} template={template} noStyle />
}

/** A field without Kea form functionality. Within a form use `Field`. */
Field.Pure = PureField
Field.Error = FieldError
