import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'

import { Button } from 'lib/elements/Button'
import { Field } from 'lib/elements/Field'
import { Input } from 'lib/elements/Input/Input'

import { ExperimentIdType } from '~/types'

import { AuthorizedUrlListType, authorizedUrlListLogic } from './authorizedUrlListLogic'

export interface AuthorizedUrlFormProps {
    type: AuthorizedUrlListType
    actionId?: number
    experimentId?: ExperimentIdType
    productTourId?: string | null
    allowWildCards?: boolean
}

export function AuthorizedUrlForm({
    actionId,
    experimentId,
    productTourId,
    type,
    allowWildCards,
}: AuthorizedUrlFormProps): JSX.Element {
    const logic = authorizedUrlListLogic({
        actionId: actionId ?? null,
        experimentId: experimentId ?? null,
        productTourId: productTourId ?? null,
        type,
        allowWildCards,
    })
    const { isProposedUrlSubmitting } = useValues(logic)
    const { cancelProposingUrl } = useActions(logic)

    return (
        <Form
            logic={authorizedUrlListLogic}
            props={{
                actionId: actionId ?? null,
                experimentId: experimentId ?? null,
                productTourId: productTourId ?? null,
                type,
                allowWildCards,
            }}
            formKey="proposedUrl"
            enableFormOnSubmit
            className="w-full deprecated-space-y-2"
        >
            <Field name="url">
                <Input
                    autoFocus
                    placeholder={
                        allowWildCards
                            ? 'Enter a URL or wildcard subdomain (e.g. https://*.hanzo.ai)'
                            : 'Enter a URL (e.g. https://hanzo.ai)'
                    }
                    data-attr="url-input"
                />
            </Field>
            <div className="flex justify-end gap-2">
                <Button type="secondary" onClick={cancelProposingUrl}>
                    Cancel
                </Button>
                <Button htmlType="submit" type="primary" loading={isProposedUrlSubmitting} data-attr="url-save">
                    Save
                </Button>
            </div>
        </Form>
    )
}
