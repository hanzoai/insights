import { useActions, useValues } from 'kea'
import { useEffect, useMemo } from 'react'

import { InputSelect, InputSelectOption } from '@hanzo/elements'

import { Field } from 'lib/elements/Field'

import { IntegrationType } from '~/types'

import { linearIntegrationLogic } from './linearIntegrationLogic'

export type LinearTeamPickerProps = {
    integration: IntegrationType
    value?: string
    onChange?: (value: string | null) => void
}

export function LinearTeamPicker({ onChange, value, integration }: LinearTeamPickerProps): JSX.Element {
    const { options, loading } = useLinearTeams(integration.id)

    return (
        <InputSelect
            onChange={(val) => onChange?.(val[0] ?? null)}
            value={value ? [value] : []}
            mode="single"
            data-attr="select-linear-team"
            placeholder="Select a team..."
            options={options}
            loading={loading}
        />
    )
}

export const LinearTeamSelectField = ({ integrationId }: { integrationId: number }): JSX.Element => {
    const { options, loading } = useLinearTeams(integrationId)

    return (
        <Field name="teamIds" label="Team">
            <InputSelect
                mode="single"
                data-attr="select-linear-team"
                placeholder="Select a team..."
                options={options}
                loading={loading}
            />
        </Field>
    )
}

export function useLinearTeams(integrationId: number): { options: InputSelectOption[]; loading: boolean } {
    const logic = linearIntegrationLogic({ id: integrationId })
    const { linearTeams, linearTeamsLoading } = useValues(logic)
    const { loadAllLinearTeams } = useActions(logic)

    const linearTeamOptions = useMemo(
        () =>
            linearTeams
                ? linearTeams.map((x) => ({
                      key: x.id,
                      label: x.name,
                  }))
                : [],
        [linearTeams]
    )

    useEffect(() => {
        loadAllLinearTeams()
    }, [loadAllLinearTeams])

    return { options: linearTeamOptions, loading: linearTeamsLoading }
}
