import clsx from 'clsx'
import { useEffect, useState } from 'react'

import {
    Button,
    Divider,
    Dropdown,
    Input,
    InputPropsText,
    TextArea,
} from '@hanzo/elements'

import { KeyboardShortcut } from '~/layout/navigation-3000/components/KeyboardShortcut'

export interface InlineEditableFieldProps extends Pick<InputPropsText, 'value' | 'onChange'> {
    value?: string
    onChange?: (value: string) => void
    className?: string
    multiline?: boolean
}

export function InlineEditableField({ value, onChange, className, multiline }: InlineEditableFieldProps): JSX.Element {
    const [editingValue, setEditingValue] = useState(value)
    const [isEditing, setIsEditing] = useState(false)

    useEffect(() => {
        setEditingValue(value)
    }, [value])

    useEffect(() => {
        if (isEditing) {
            setEditingValue(value)
        }
    }, [isEditing, value])

    const save = (): void => {
        onChange?.(editingValue ?? '')
        setIsEditing(false)
    }

    const cancel = (): void => {
        setEditingValue(value)
        setIsEditing(false)
    }

    return (
        <Dropdown
            closeOnClickInside={false}
            visible={isEditing}
            onVisibilityChange={(visible) => setIsEditing(visible)}
            overlay={
                <div>
                    {multiline ? (
                        <TextArea
                            value={editingValue}
                            onChange={(val) => setEditingValue(val)}
                            autoFocus
                            className="border-none w-120"
                            onPressEnter={save}
                        />
                    ) : (
                        <Input
                            type="text"
                            value={editingValue}
                            onChange={(val) => setEditingValue(val)}
                            autoFocus
                            className="border-none w-120"
                            onPressEnter={save}
                            autoWidth
                        />
                    )}
                    <Divider className="my-1" />

                    <div className="flex flex-row gap-2 justify-end">
                        <Button
                            size="xsmall"
                            type="secondary"
                            onClick={cancel}
                            sideIcon={<KeyboardShortcut escape />}
                        >
                            Cancel
                        </Button>
                        <Button size="xsmall" type="primary" onClick={save} sideIcon={<KeyboardShortcut enter />}>
                            Save
                        </Button>
                    </div>
                </div>
            }
            showArrow
        >
            <span
                className={clsx(
                    className,
                    'p-1 -m-1 rounded-sm transition-colors hover:bg-fill-button-tertiary-hover',
                    multiline && 'whitespace-pre-wrap'
                )}
                onClick={() => setIsEditing(true)}
            >
                {value}
            </span>
        </Dropdown>
    )
}
