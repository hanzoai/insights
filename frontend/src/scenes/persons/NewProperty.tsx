import { useState } from 'react'

import { Input, Label, Modal, SegmentedButton } from '@hanzo/elements'

import { Button } from 'lib/elements/Button'

interface NewPropertyInterface {
    creating: boolean
    propertyType: 'string' | 'boolean'
    key?: string | null
    value?: string | number
}

export interface NewPropertyProps {
    onSave: (key: string, newValue?: string | number) => void
}

export function NewProperty({ onSave }: NewPropertyProps): JSX.Element {
    const initialState = { creating: false, propertyType: 'string', value: '' } as NewPropertyInterface
    const [state, setState] = useState(initialState)

    const saveProperty = (): void => {
        if (state.key && state.value !== undefined) {
            onSave(state.key, state.value)
            setState(initialState)
        }
    }

    return (
        <>
            <Button
                data-attr="add-prop-button"
                onClick={() => setState({ ...state, creating: true })}
                type="primary"
            >
                New property
            </Button>
            <Modal
                isOpen={state.creating}
                onClose={() => setState(initialState)}
                title="Add new property"
                footer={
                    <Button
                        disabledReason={(!state.key || state.value === undefined) && 'Set a key and a value'}
                        type="secondary"
                        onClick={saveProperty}
                    >
                        Save
                    </Button>
                }
            >
                <div className="deprecated-space-y-2">
                    <div>
                        <Label>Key</Label>
                        <Input
                            id="propertyKey"
                            autoFocus
                            placeholder="try email, first_name, is_verified, membership_level, total_revenue"
                            onChange={(key) => setState({ ...state, key: key })}
                            autoComplete="off"
                            autoCapitalize="off"
                        />
                    </div>
                    <div>
                        <Label>Type of Property</Label>
                        <SegmentedButton
                            onChange={(value: 'string' | 'boolean') =>
                                setState({
                                    ...state,
                                    propertyType: value,
                                    value: value === 'string' ? '' : 'true',
                                })
                            }
                            value={state.propertyType}
                            options={[
                                {
                                    value: 'string',
                                    label: 'Text or Number',
                                },
                                {
                                    value: 'boolean',
                                    label: 'Boolean or Null',
                                },
                            ]}
                            fullWidth
                        />
                    </div>
                    <div>
                        <Label>Value</Label>
                        {state.propertyType === 'boolean' ? (
                            <SegmentedButton
                                onChange={(value) =>
                                    setState({
                                        ...state,
                                        value: value,
                                    })
                                }
                                fullWidth
                                value={state.value}
                                options={[
                                    {
                                        value: 'true',
                                        label: 'True',
                                    },
                                    {
                                        value: 'false',
                                        label: 'False',
                                    },
                                    {
                                        value: 'null',
                                        label: 'Null',
                                    },
                                ]}
                                size="small"
                            />
                        ) : (
                            <Input
                                id="propertyValue"
                                placeholder="try email@example.com, gold, 1"
                                onChange={(value) => setState({ ...state, value: value })}
                                onKeyDown={(e) => e.key === 'Enter' && saveProperty()}
                                autoComplete="off"
                                autoCapitalize="off"
                            />
                        )}
                    </div>
                </div>
            </Modal>
        </>
    )
}
