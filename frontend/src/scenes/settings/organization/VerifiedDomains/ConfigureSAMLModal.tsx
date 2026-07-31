import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'

import { Link } from '@hanzo/elements'

import { CopyToClipboardInline } from 'lib/components/CopyToClipboard'
import { Banner } from 'lib/elements/Banner'
import { Button } from 'lib/elements/Button'
import { Field } from 'lib/elements/Field'
import { Input } from 'lib/elements/Input/Input'
import { Modal } from 'lib/elements/Modal'
import { TextArea } from 'lib/elements/TextArea/TextArea'
import { preflightLogic } from 'scenes/PreflightCheck/preflightLogic'

import { verifiedDomainsLogic } from './verifiedDomainsLogic'

export function ConfigureSAMLModal(): JSX.Element {
    const { configureSAMLModalId, isSamlConfigSubmitting, samlConfig } = useValues(verifiedDomainsLogic)
    const { setConfigureSAMLModalId } = useActions(verifiedDomainsLogic)
    const { preflight } = useValues(preflightLogic)
    const siteUrl = preflight?.site_url ?? window.location.origin

    const samlReady = samlConfig.saml_acs_url && samlConfig.saml_entity_id && samlConfig.saml_x509_cert

    const handleClose = (): void => {
        setConfigureSAMLModalId(null)
        // clean()
    }

    return (
        <Modal onClose={handleClose} isOpen={!!configureSAMLModalId} title="" simple>
            <Form logic={verifiedDomainsLogic} formKey="samlConfig" enableFormOnSubmit className="Modal__layout ">
                <Modal.Header>
                    <h3>Configure SAML authentication and provisioning</h3>
                </Modal.Header>
                <Modal.Content className="deprecated-space-y-2">
                    <p>
                        <Link to="https://hanzo.ai/docs/data/sso#setting-up-saml" target="_blank" targetBlankIcon>
                            Read the docs
                        </Link>
                    </p>
                    <Field label="ACS Consumer URL" name="_ACSConsumerUrl">
                        <CopyToClipboardInline>{`${siteUrl}/complete/saml/`}</CopyToClipboardInline>
                    </Field>
                    <Field label="RelayState" name="_RelayState">
                        <CopyToClipboardInline>{configureSAMLModalId || 'unknown'}</CopyToClipboardInline>
                    </Field>
                    <Field label="Audience / Entity ID" name="_Audience">
                        <CopyToClipboardInline>{siteUrl}</CopyToClipboardInline>
                    </Field>
                    <Field name="saml_acs_url" label="SAML ACS URL">
                        <Input className="ph-ignore-input" placeholder="Your IdP's ACS or single sign-on URL." />
                    </Field>
                    <Field name="saml_entity_id" label="SAML Entity ID">
                        <Input className="ph-ignore-input" placeholder="Entity ID provided by your IdP." />
                    </Field>
                    <Field name="saml_x509_cert" label="SAML X.509 Certificate">
                        <TextArea
                            className="ph-ignore-input"
                            minRows={10}
                            placeholder={`Enter the public certificate of your IdP. Keep all line breaks.\n-----BEGIN CERTIFICATE-----\nMIICVjCCAb+gAwIBAgIBADANBgkqhkiG9w0BAQ0FADBIMQswCQYDVQQGEwJ1czEL\n-----END CERTIFICATE-----`}
                        />
                    </Field>
                    {!samlReady && (
                        <Banner type="info">
                            SAML will not be enabled unless you enter all attributes above. However you can still
                            settings as draft.
                        </Banner>
                    )}
                </Modal.Content>
                <Modal.Footer>
                    <Button loading={isSamlConfigSubmitting} type="primary" htmlType="submit">
                        Save settings
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    )
}
