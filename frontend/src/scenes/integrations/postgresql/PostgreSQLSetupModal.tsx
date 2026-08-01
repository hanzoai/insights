import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'

import { Button, Checkbox, Input, Modal, Select, toast } from '@hanzo/elements'

import { Field } from 'lib/elements/Field'
import { FileInput } from 'lib/elements/FileInput/FileInput'

import IconPostgres from 'public/services/postgres.png'

import { PostgreSQLSetupModalLogicProps, postgreSQLSetupModalLogic } from './postgreSQLSetupModalLogic'

export const PostgreSQLSetupModal = (props: PostgreSQLSetupModalLogicProps): JSX.Element => {
    const { postgreSQLIntegration, isPostgreSQLIntegrationSubmitting } = useValues(postgreSQLSetupModalLogic(props))
    const { submitPostgreSQLIntegration, setPostgreSQLIntegrationValue } = useActions(postgreSQLSetupModalLogic(props))

    return (
        <Modal
            isOpen={props.isOpen}
            title={
                <div className="flex items-center gap-2">
                    <img src={IconPostgres} alt="PostgreSQL" className="w-6 h-6" />
                    <span>Configure PostgreSQL integration</span>
                </div>
            }
            onClose={props.onComplete}
        >
            <Form logic={postgreSQLSetupModalLogic} props={props} formKey="postgreSQLIntegration">
                <div className="gap-4 flex flex-col">
                    <Field name="host" label="Host">
                        <Input placeholder="my-host" />
                    </Field>

                    <Field name="port" label="Port">
                        <Input placeholder="5432" type="number" min="0" max="65535" />
                    </Field>

                    <Field name="user" label="User">
                        <Input placeholder="postgres" />
                    </Field>

                    <Field name="password" label="Password">
                        <Input type="password" />
                    </Field>

                    <Field
                        name="ssl_mode"
                        label="Verify server identity?"
                        info={
                            <>
                                Verifies that the certificate presented by the database server is signed by a trusted
                                certificate authority — and, optionally, that its hostname matches the host you entered.
                                This guards against man-in-the-middle attacks.
                                <br />
                                <br />
                                The connection is always encrypted regardless of this setting, because Insights requires
                                TLS. These options only add verification of the server certificate.
                            </>
                        }
                    >
                        <Select
                            options={[
                                { value: 'no', label: 'No' },
                                { value: 'verify-ca', label: 'Verify certificate authority' },
                                { value: 'verify-full', label: 'Verify certificate authority and server hostname' },
                            ]}
                        />
                    </Field>

                    {postgreSQLIntegration.ssl_mode !== 'no' && (
                        <>
                            <Field name="use_system_ca">
                                {({ value, onChange }) => (
                                    <Checkbox
                                        bordered
                                        checked={!!value}
                                        onChange={onChange}
                                        label="Use the system certificate authorities"
                                    />
                                )}
                            </Field>

                            {!postgreSQLIntegration.use_system_ca && (
                                <Field name="ssl_root_cert" label="Root certificate">
                                    {() => (
                                        <FileInput
                                            accept=".crt,.pem,.cer,.ca-bundle"
                                            multiple={false}
                                            onChange={(files) => {
                                                if (files[0]) {
                                                    void files[0]
                                                        .text()
                                                        .then((text) =>
                                                            setPostgreSQLIntegrationValue('ssl_root_cert', text)
                                                        )
                                                        .catch(() => {
                                                            toast.error('Failed to read the certificate file')
                                                            setPostgreSQLIntegrationValue('ssl_root_cert', null)
                                                        })
                                                } else {
                                                    setPostgreSQLIntegrationValue('ssl_root_cert', null)
                                                }
                                            }}
                                        />
                                    )}
                                </Field>
                            )}
                        </>
                    )}

                    <div className="flex justify-end">
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={isPostgreSQLIntegrationSubmitting}
                            onClick={submitPostgreSQLIntegration}
                        >
                            Connect
                        </Button>
                    </div>
                </div>
            </Form>
        </Modal>
    )
}
