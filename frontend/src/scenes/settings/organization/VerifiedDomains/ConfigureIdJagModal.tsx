import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'

import { Banner } from 'lib/elements/Banner'
import { Button } from 'lib/elements/Button'
import { Field } from 'lib/elements/Field'
import { Input } from 'lib/elements/Input/Input'
import { InputSelect } from 'lib/elements/InputSelect/InputSelect'
import { Modal } from 'lib/elements/Modal'

import { verifiedDomainsLogic } from './verifiedDomainsLogic'

export function ConfigureIdJagModal(): JSX.Element {
    const { configureIdJagModalId, isIdJagConfigSubmitting, idJagConfig } = useValues(verifiedDomainsLogic)
    const { setConfigureIdJagModalId } = useActions(verifiedDomainsLogic)

    const idJagReady = Boolean(idJagConfig.id_jag_issuer_url)

    const handleClose = (): void => {
        setConfigureIdJagModalId(null)
    }

    return (
        <Modal onClose={handleClose} isOpen={!!configureIdJagModalId} title="" simple>
            <Form logic={verifiedDomainsLogic} formKey="idJagConfig" enableFormOnSubmit className="Modal__layout ">
                <Modal.Header>
                    <h3>Configure XAA (ID-JAG)</h3>
                </Modal.Header>
                <Modal.Content className="deprecated-space-y-2">
                    <Field
                        name="id_jag_issuer_url"
                        label="IdP issuer URL"
                        info="The trusted identity provider issuer URL. Must match the iss claim on ID-JAG tokens for users on this domain."
                    >
                        <Input
                            className="ph-ignore-input"
                            placeholder="https://idp.example.com"
                            autoComplete="off"
                        />
                    </Field>
                    <Field
                        name="id_jag_jwks_url"
                        label="JWKS URL (optional)"
                        info="Override JWKS discovery. Leave empty to use OIDC discovery at the issuer URL."
                    >
                        <Input
                            className="ph-ignore-input"
                            placeholder="https://idp.example.com/.well-known/jwks.json"
                            autoComplete="off"
                        />
                    </Field>
                    <Field
                        name="id_jag_allowed_clients"
                        label="Allowed client IDs (optional)"
                        info="Restrict which client_id values are accepted. Leave empty to allow any client_id."
                    >
                        {({ value, onChange }) => (
                            <InputSelect
                                value={value ?? []}
                                onChange={onChange}
                                placeholder="Add client IDs..."
                                mode="multiple"
                                allowCustomValues
                                options={[]}
                            />
                        )}
                    </Field>
                    {!idJagReady && (
                        <Banner type="info">
                            XAA will not be enabled until you enter an IdP issuer URL. You can save partial settings as
                            a draft.
                        </Banner>
                    )}
                    <Banner type="info">
                        Configure your IdP to grant <code>user:read</code> plus the scopes each integration needs (for
                        project-scoped APIs, also <code>organization:read</code> and <code>project:read</code>). Tokens
                        issued without the required scopes are rejected with an insufficient-scope error.
                    </Banner>
                </Modal.Content>
                <Modal.Footer>
                    <Button loading={isIdJagConfigSubmitting} type="primary" htmlType="submit">
                        Save settings
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    )
}
