import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'
import React from 'react'

import { Button, Modal } from '@hanzo/elements'

import { Field } from 'lib/elements/Field'
import { ModalContent, ModalFooter, ModalHeader } from 'lib/elements/Modal/Modal'

import { DatasetItem } from '~/types'

import { JSONEditor } from '../components/JSONEditor'
import { DatasetItemModalLogicProps, datasetItemModalLogic } from './datasetItemModalLogic'

export interface DatasetItemModalProps {
    isOpen: boolean
    onClose: (refetchDatasetItems?: boolean) => void
    datasetId: string
    partialDatasetItem?: Partial<DatasetItem> | null
    /**
     * Whether the modal should display the "Save and add another" button.
     */
    displayBulkCreationButton?: boolean
    title?: string
}

export const DatasetItemModal = React.memo(function DatasetItemModal({
    isOpen,
    onClose,
    partialDatasetItem,
    datasetId,
    displayBulkCreationButton,
    title,
}: DatasetItemModalProps): JSX.Element {
    const logicProps: DatasetItemModalLogicProps = {
        datasetId,
        partialDatasetItem,
        closeModal: onClose,
        isModalOpen: isOpen,
    }
    const { isDatasetItemFormSubmitting, refetchDatasetItems } = useValues(datasetItemModalLogic(logicProps))
    const { submitDatasetItemForm, setShouldCloseModal } = useActions(datasetItemModalLogic(logicProps))

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => onClose(refetchDatasetItems)}
            maxWidth="40rem"
            simple
            className="w-full"
        >
            <Form
                logic={datasetItemModalLogic}
                props={logicProps}
                formKey="datasetItemForm"
                enableFormOnSubmit
                className="flex flex-col overflow-y-hidden"
            >
                <ModalHeader>
                    <h3>{title ?? (partialDatasetItem?.id ? 'Edit dataset item' : 'New dataset item')}</h3>
                </ModalHeader>

                <ModalContent className="flex flex-col gap-4">
                    <Field name="input" label="Input">
                        <JSONEditor />
                    </Field>
                    <Field name="output" label="Output">
                        <JSONEditor />
                    </Field>
                    <Field name="metadata" label="Metadata">
                        <JSONEditor />
                    </Field>
                </ModalContent>

                <ModalFooter>
                    {displayBulkCreationButton && !partialDatasetItem?.id && (
                        <Button
                            type="secondary"
                            loading={isDatasetItemFormSubmitting}
                            htmlType="submit"
                            onClick={(e) => {
                                e.preventDefault()
                                setShouldCloseModal(false)
                                submitDatasetItemForm()
                            }}
                        >
                            Save and add another
                        </Button>
                    )}
                    <Button type="primary" htmlType="submit" loading={isDatasetItemFormSubmitting}>
                        Save
                    </Button>
                </ModalFooter>
            </Form>
        </Modal>
    )
})
