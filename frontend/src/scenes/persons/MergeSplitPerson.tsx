import { BindLogic, useActions, useValues } from 'kea'

import { Button, Modal, SegmentedButton, Select } from '@hanzo/elements'

import { Banner } from 'lib/elements/Banner'
import { InputSelect } from 'lib/elements/InputSelect/InputSelect'
import { pluralize } from 'lib/utils/strings'

import { PersonType } from '~/types'

import { mergeSplitPersonLogic, SplitMode } from './mergeSplitPersonLogic'
import { personsLogic } from './personsLogic'

export function MergeSplitPerson({ person }: { person: PersonType }): JSX.Element {
    const { urlId } = useValues(personsLogic)
    const logicProps = { person, urlId: urlId ?? '' }
    const { executedLoading, splitMode, distinctIdsToSplit } = useValues(mergeSplitPersonLogic(logicProps))
    const { execute, cancel } = useActions(mergeSplitPersonLogic(logicProps))

    const submitDisabledReason =
        splitMode === 'partial' && distinctIdsToSplit.length === 0
            ? 'Select at least one distinct ID to extract'
            : undefined

    return (
        <Modal
            isOpen
            width="40rem"
            title="Split persons"
            footer={
                <div className="flex items-center gap-2">
                    <Button onClick={cancel} disabledReason={executedLoading && 'Splitting the user'}>
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        onClick={execute}
                        loading={executedLoading}
                        disabledReason={submitDisabledReason}
                    >
                        Split persons
                    </Button>
                </div>
            }
            onClose={cancel}
        >
            {person.distinct_ids.length < 2 ? (
                'Only persons with more than two distinct IDs can be split.'
            ) : (
                <BindLogic logic={mergeSplitPersonLogic} props={logicProps}>
                    <SplitPerson />
                </BindLogic>
            )}
        </Modal>
    )
}

function SplitPerson(): JSX.Element | null {
    const { person, selectedPersonToAssignSplit, executedLoading, splitMode, distinctIdsToSplit } =
        useValues(mergeSplitPersonLogic)
    const { setSelectedPersonToAssignSplit, setSplitMode, setDistinctIdsToSplit } = useActions(mergeSplitPersonLogic)

    if (!person) {
        return null
    }

    const options = person.distinct_ids.map((distinctId: string) => ({
        label: distinctId,
        value: distinctId,
        key: distinctId,
    }))

    return (
        <>
            <SegmentedButton
                fullWidth
                value={splitMode}
                onChange={(value) => setSplitMode(value as SplitMode)}
                options={[
                    { value: 'all', label: 'Split all distinct IDs' },
                    { value: 'partial', label: 'Extract specific distinct IDs' },
                ]}
            />
            {splitMode === 'all' ? (
                <>
                    <p className="mt-4">This will split all distinct IDs for this person into unique persons.</p>
                    <p>
                        You can select a distinct ID for which all the current properties will be assigned (
                        <i>optional</i>). All other new users will start without any properties.
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
                        {pluralize(person.distinct_ids.length - 1, 'new person', undefined, false)}. This might change
                        the numbers in your charts, even historically. Please be certain.
                    </Banner>
                </>
            ) : (
                <>
                    <p className="mt-4">
                        Select the distinct IDs you want to extract from this person. Each one will become its own new
                        person. The original person keeps all other distinct IDs and its properties intact.
                    </p>
                    <InputSelect
                        mode="multiple"
                        options={options}
                        placeholder="Select distinct IDs to extract"
                        disabled={executedLoading}
                        value={distinctIdsToSplit}
                        onChange={(value) => setDistinctIdsToSplit(value)}
                    />
                    {distinctIdsToSplit.length > 0 && (
                        <Banner type="warning" className="mt-4">
                            This will create <strong>{distinctIdsToSplit.length}</strong>{' '}
                            {pluralize(distinctIdsToSplit.length, 'new person', undefined, false)} and move{' '}
                            {distinctIdsToSplit.length === 1 ? 'that distinct ID' : 'those distinct IDs'} off of this
                            person. The original person keeps all other distinct IDs and its properties. This might
                            change the numbers in your charts, even historically. Please be certain.
                        </Banner>
                    )}
                </>
            )}
        </>
    )
}
