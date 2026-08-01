import { useActions, useValues } from 'kea'
import { useState } from 'react'

import { Input } from '@hanzo/elements'

import { DOMAIN_REGEX } from 'lib/constants'
import { Button } from 'lib/elements/Button'
import { Modal } from 'lib/elements/Modal'

import { verifiedDomainsLogic } from './verifiedDomainsLogic'

export function AddDomainModal(): JSX.Element {
    const { addModalShown, verifiedDomainsLoading } = useValues(verifiedDomainsLogic)
    const { hideAddDomainModal, addVerifiedDomain } = useActions(verifiedDomainsLogic)
    const [newDomain, setNewDomain] = useState('')
    const [submitted, setSubmitted] = useState(false)

    const errored = !newDomain || !newDomain.match(DOMAIN_REGEX)

    const clean = (): void => {
        setNewDomain('')
        setSubmitted(false)
    }

    const handleClose = (): void => {
        hideAddDomainModal()
        clean()
    }

    const handleSubmit = (): void => {
        setSubmitted(true)
        if (!errored) {
            addVerifiedDomain(newDomain)
            clean()
        }
    }

    return (
        <Modal
            onClose={handleClose}
            isOpen={addModalShown}
            title="Add authentication domain"
            footer={
                <Button
                    type="primary"
                    disabled={newDomain === '' || (submitted && errored) || verifiedDomainsLoading}
                    onClick={handleSubmit}
                >
                    Add domain
                </Button>
            }
        >
            <Input
                placeholder="hanzo.ai"
                autoFocus
                value={newDomain}
                onChange={setNewDomain}
                onPressEnter={handleSubmit}
            />
            {submitted && errored && (
                <span className="text-danger text-xs">
                    Please enter a valid domain or subdomain name (e.g. my.hanzo.ai)
                </span>
            )}
        </Modal>
    )
}
