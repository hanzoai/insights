import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'

import { Button, FileInput, Input, Modal, Select, TextArea } from '@hanzo/elements'

import { Field } from 'lib/elements/Field'

import { SnowflakeSetupModalLogicProps, snowflakeSetupModalLogic } from './snowflakeSetupModalLogic'

export const SnowflakeSetupModal = (props: SnowflakeSetupModalLogicProps): JSX.Element => {
    const { isSnowflakeIntegrationSubmitting, snowflakeIntegration } = useValues(snowflakeSetupModalLogic(props))
    const { submitSnowflakeIntegration } = useActions(snowflakeSetupModalLogic(props))

    return (
        <Modal
            isOpen={props.isOpen}
            width={680}
            title="Configure Snowflake connection"
            description="Enter your Snowflake credentials to connect Insights to your account. They are stored encrypted and can be reused across exports."
            onClose={props.onComplete}
            footer={
                <>
                    <Button type="secondary" onClick={() => props.onComplete()}>
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        loading={isSnowflakeIntegrationSubmitting}
                        onClick={submitSnowflakeIntegration}
                    >
                        Save
                    </Button>
                </>
            }
        >
            <Form logic={snowflakeSetupModalLogic} formKey="snowflakeIntegration" className="flex flex-col gap-4">
                <Field name="name" label="Name" info="A name to identify this connection across exports.">
                    <Input placeholder="e.g. Production Snowflake account" />
                </Field>
                <Field name="account" label="Account">
                    <Input placeholder="my-account" autoComplete="off" />
                </Field>
                <Field name="user" label="User">
                    <Input placeholder="my-user" autoComplete="off" />
                </Field>
                <Field name="authentication_type" label="Authentication type">
                    <Select
                        options={[
                            { value: 'keypair', label: 'Key pair' },
                            { value: 'password', label: 'Password' },
                        ]}
                    />
                </Field>
                {snowflakeIntegration.authentication_type === 'keypair' ? (
                    <>
                        <Field
                            name="private_key_file"
                            label="Private key file"
                            help="Upload the key file you generated, or paste its contents below."
                        >
                            <FileInput accept=".p8,.pem,.key" multiple={false} />
                        </Field>
                        <Field name="private_key" label="Private key">
                            <TextArea className="ph-ignore-input" placeholder="my-private-key" minRows={8} />
                        </Field>
                        <Field name="private_key_passphrase" label="Private key passphrase" showOptional>
                            <Input type="password" placeholder="my-passphrase" autoComplete="new-password" />
                        </Field>
                    </>
                ) : (
                    <Field name="password" label="Password">
                        <Input type="password" placeholder="my-password" autoComplete="new-password" />
                    </Field>
                )}
            </Form>
        </Modal>
    )
}
