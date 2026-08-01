import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'

import { Button, Input, Modal } from '@hanzo/elements'

import { Field } from 'lib/elements/Field'

import { S3CompatibleSetupModalLogicProps, s3CompatibleSetupModalLogic } from './s3CompatibleSetupModalLogic'

export const S3CompatibleSetupModal = (props: S3CompatibleSetupModalLogicProps): JSX.Element => {
    const { isS3CompatibleIntegrationSubmitting } = useValues(s3CompatibleSetupModalLogic(props))
    const { submitS3CompatibleIntegration } = useActions(s3CompatibleSetupModalLogic(props))

    return (
        <Modal
            isOpen={props.isOpen}
            title="Configure S3-compatible storage connection"
            description="Connect Insights to any S3-compatible object storage (e.g. Cloudflare R2, DigitalOcean Spaces, Supabase). Credentials are stored encrypted and can be reused across exports."
            onClose={props.onComplete}
            footer={
                <>
                    <Button type="secondary" onClick={() => props.onComplete()}>
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        loading={isS3CompatibleIntegrationSubmitting}
                        onClick={submitS3CompatibleIntegration}
                    >
                        Save
                    </Button>
                </>
            }
        >
            <Form logic={s3CompatibleSetupModalLogic} formKey="s3CompatibleIntegration" className="flex flex-col gap-4">
                <Field name="name" label="Name" info="A name to identify this connection across exports.">
                    <Input placeholder="e.g. R2 data lake" />
                </Field>
                <Field
                    name="endpointUrl"
                    label="Endpoint URL"
                    info="The endpoint URL for your provider (e.g. Cloudflare R2, DigitalOcean Spaces, Supabase)."
                >
                    <Input placeholder="e.g. https://<account-id>.r2.cloudflarestorage.com" />
                </Field>
                <Field name="awsAccessKeyId" label="Access Key ID">
                    <Input placeholder="e.g. AKIAIOSFODNN7EXAMPLE" autoComplete="off" />
                </Field>
                <Field name="awsSecretAccessKey" label="Secret Access Key">
                    <Input type="password" placeholder="e.g. secret-key" autoComplete="new-password" />
                </Field>
            </Form>
        </Modal>
    )
}
