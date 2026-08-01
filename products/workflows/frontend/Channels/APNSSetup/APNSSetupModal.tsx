import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'

import { Button, Input, Modal, SegmentedButton, TextArea, Link } from '@hanzo/elements'

import { Field } from 'lib/elements/Field'
import { FileInput } from 'lib/elements/FileInput'

import { PushIdentityVerificationField } from '../PushIdentityVerificationField'
import { APNSSetupModalLogicProps, apnsSetupModalLogic } from './apnsSetupModalLogic'

export const APNSSetupModal = (props: APNSSetupModalLogicProps): JSX.Element => {
    const { isApnsIntegrationSubmitting, apnsIntegration, signingKeyFileError } = useValues(apnsSetupModalLogic(props))
    const { submitApnsIntegration, setSigningKeyFiles } = useActions(apnsSetupModalLogic(props))

    return (
        <Modal
            title={
                <div className="flex items-center gap-2">
                    <span>Configure Apple Push Notification Service</span>
                </div>
            }
            onClose={props.onClose}
        >
            <Form logic={apnsSetupModalLogic} formKey="apnsIntegration">
                <div className="gap-4 flex flex-col">
                    <p className="text-secondary">
                        You can find these values in your{' '}
                        <Link to="https://developer.apple.com/account/resources/authkeys/list" target="_blank">
                            Apple Developer account
                        </Link>{' '}
                        under Certificates, Identifiers & Profiles &gt; Keys.
                    </p>
                    <div className="flex flex-col gap-2">
                        <Field
                            name="signingKey"
                            label="Signing key (.p8)"
                            help="Paste the contents of the key file, or upload the .p8 you downloaded from Apple."
                        >
                            <TextArea
                                placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                                minRows={4}
                            />
                        </Field>
                        <FileInput
                            accept=".p8"
                            multiple={false}
                            onChange={setSigningKeyFiles}
                            callToAction={
                                <Button type="secondary" size="small">
                                    Upload .p8 file
                                </Button>
                            }
                        />
                        {signingKeyFileError && <p className="text-danger text-xs mb-0">{signingKeyFileError}</p>}
                    </div>
                    <Field name="keyId" label="Key ID">
                        <Input type="text" placeholder="ABC123DEFG" />
                    </Field>
                    <Field name="teamId" label="Apple team ID">
                        <Input type="text" placeholder="ABCDE12345" />
                    </Field>
                    <Field name="bundleId" label="Bundle ID">
                        <Input type="text" placeholder="com.example.app" />
                    </Field>
                    <Field name="environment" label="Environment">
                        <SegmentedButton
                            options={[
                                { value: 'production', label: 'Production' },
                                { value: 'sandbox', label: 'Sandbox' },
                            ]}
                            fullWidth
                        />
                    </Field>
                    <PushIdentityVerificationField mode={apnsIntegration.identityVerification} />
                    <div className="flex justify-end">
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={isApnsIntegrationSubmitting}
                            onClick={submitApnsIntegration}
                        >
                            Connect
                        </Button>
                    </div>
                </div>
            </Form>
        </Modal>
    )
}
