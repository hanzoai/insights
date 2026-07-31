import { BindLogic, useActions, useValues } from 'kea'

import { Button, Modal, Select } from '@hanzo/elements'

import { Banner } from 'lib/elements/Banner'
import { pluralize } from 'lib/utils'

import { PersonType } from '~/types'

import { mergeSplitPersonLogic } from './mergeSplitPersonLogic'
import { personsLogic } from './personsLogic'

export function MergeSplitPerson({ person }: { person: PersonType }): JSX.Element {
    const { urlId } = useValues(personsLogic)
    const logicProps = { person, urlId: urlId ?? '' }
    const { executedLoading } = useValues(mergeSplitPersonLogic(logicProps))
    const { execute, cancel } = useActions(mergeSplitPersonLogic(logicProps))

    return (
        <Modal
            isOpen
            width="40rem"
            title="Split users"
            footer={
                <div className="flex items-center gap-2">
                    <Button onClick={cancel} disabledReason={executedLoading && 'Splitting the user'}>
                        Cancel
                    </Button>
                    <Button type="primary" onClick={execute} loading={executedLoading}>
                        Split users
                    </Button>
                </div>
            }
            onClose={cancel}
        >
            {person.distinct_ids.length < 2 ? (
                'Only users with more than two distinct IDs can be split.'
            ) : (
                <BindLogic logic={mergeSplitPersonLogic} props={logicProps}>
                    <SplitPerson />
                </BindLogic>
            )}
        </Modal>
    )
}

function SplitPerson(): JSX.Element | null {
    const { person, selectedPersonToAssignSplit, executedLoading } = useValues(mergeSplitPersonLogic)
    const { setSelectedPersonToAssignSplit } = useActions(mergeSplitPersonLogic)

    if (!person) {
        return null
    }

    const options = person.distinct_ids.map((distinctId: string) => ({
        label: distinctId,
        value: distinctId,
    }))

    return (
        <>
            <p>This will split all Distinct IDs for this user into unique users.</p>
            <p>
                You can select a distinct ID for which all the current properties will be assigned (<i>optional</i>).
                All other new users will start without any properties.
            </p>
            <Select
                fullWidth
                options={options}
                placeholder="Select a distinct ID to which to assign all properties (optional)"
                disabledReason={executedLoading && 'Splitting user'}
                value={selectedPersonToAssignSplit}
                onChange={(value) => setSelectedPersonToAssignSplit(value as string)}
            />
            <Banner type="warning" className="mt-4">
                This will create <strong>{person.distinct_ids.length - 1}</strong>{' '}
                {pluralize(person.distinct_ids.length - 1, 'new user', undefined, false)}. This might change the
                numbers in your charts, even historically. Please be certain.
            </Banner>
        </>
    )
}
