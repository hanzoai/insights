import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'

import { Button, Input, Modal } from '@hanzo/elements'

import { Field } from 'lib/elements/Field'

import { AzureBlobSetupModalLogicProps, azureBlobSetupModalLogic } from './azureBlobSetupModalLogic'

export const AzureBlobSetupModal = (props: AzureBlobSetupModalLogicProps): JSX.Element => {
    const { isAzureBlobIntegrationSubmitting } = useValues(azureBlobSetupModalLogic(props))
    const { submitAzureBlobIntegration } = useActions(azureBlobSetupModalLogic(props))

    return (
        <Modal
            isOpen={props.isOpen}
            title="Configure Azure Blob Storage"
            description="Enter your Azure Storage connection string to connect Insights to your Azure Blob Storage account."
            onClose={props.onComplete}
            footer={
                <>
                    <Button type="secondary" onClick={() => props.onComplete()}>
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        loading={isAzureBlobIntegrationSubmitting}
                        onClick={submitAzureBlobIntegration}
                    >
                        Save
                    </Button>
                </>
            }
        >
            <Form logic={azureBlobSetupModalLogic} formKey="azureBlobIntegration">
                <Field
                    name="connectionString"
                    label="Connection string"
                    info={
                        <>
                            Find your connection string in the Azure Portal under Storage Account &rarr; Access keys. It
                            starts with "DefaultEndpointsProtocol=https;AccountName=...".
                        </>
                    }
                >
                    <Input
                        type="password"
                        placeholder="DefaultEndpointsProtocol=https;AccountName=..."
                        className="ph-ignore-input"
                    />
                </Field>
            </Form>
        </Modal>
    )
}
