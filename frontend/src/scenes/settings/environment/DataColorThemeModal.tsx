import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'

import { IconCopy, IconPlus, IconTrash } from '@hanzo/icons'
import { Button, ColorGlyph, Input, Label, Modal, Table } from '@hanzo/elements'

import { Field } from 'lib/elements/Field'

import { dataColorThemesModalLogic } from './dataColorThemeModalLogic'

export function DataColorThemeModal(): JSX.Element {
    const { theme, themeChanged, isOpen } = useValues(dataColorThemesModalLogic)
    const { submitTheme, closeModal, addColor, duplicateColor, removeColor } = useActions(dataColorThemesModalLogic)

    const isNew = theme?.id == null
    const isOfficial = theme?.is_global
    const title = isOfficial ? 'Official theme' : isNew ? 'Add theme' : 'Edit theme'

    return (
        <Modal
            title={title}
            onClose={closeModal}
            isOpen={isOpen}
            width={768}
            footer={
                isOfficial ? (
                    <div className="flex justify-between items-center w-full">
                        <span className="italic text-secondary">Official themes can't be edited.</span>
                        <Button type="secondary" onClick={closeModal}>
                            Close
                        </Button>
                    </div>
                ) : (
                    <Button type="primary" onClick={submitTheme}>
                        Save
                    </Button>
                )
            }
            hasUnsavedInput={themeChanged}
        >
            <Form logic={dataColorThemesModalLogic} formKey="theme" className="flex flex-col gap-2">
                <Field name="name" label="Name">
                    <Input placeholder="My custom theme" autoFocus={isNew} disabled={isOfficial} />
                </Field>
                <Label>Colors</Label>
                <Table
                    dataSource={theme?.colors?.map((color, index) => ({
                        name: `preset-${index + 1}`,
                        color,
                        index,
                    }))}
                    columns={[
                        {
                            title: '',
                            dataIndex: 'color',
                            key: 'glyph',
                            render: (_, { color }) => <ColorGlyph color={color} />,
                            width: 24,
                        },
                        {
                            title: 'Name',
                            dataIndex: 'name',
                            key: 'name',
                        },
                        {
                            title: 'Color',
                            dataIndex: 'color',
                            render: (_, { index }) => (
                                <Field key={index} name={['colors', index]}>
                                    <Input className="max-w-20 font-mono" disabled={isOfficial} />
                                </Field>
                            ),
                        },
                        {
                            title: '',
                            key: 'actions',
                            width: 24,
                            render: (_, { index }) =>
                                isOfficial ? null : (
                                    <div className="flex">
                                        <Button onClick={() => duplicateColor(index)}>
                                            <IconCopy className="text-lg" />
                                        </Button>
                                        <Button onClick={() => removeColor(index)}>
                                            <IconTrash className="text-danger text-lg" />
                                        </Button>
                                    </div>
                                ),
                        },
                    ]}
                />
                {!isOfficial && (
                    <Button
                        type="secondary"
                        className="self-start"
                        onClick={addColor}
                        icon={<IconPlus className="text-lg" />}
                    >
                        Add color
                    </Button>
                )}
            </Form>
        </Modal>
    )
}
