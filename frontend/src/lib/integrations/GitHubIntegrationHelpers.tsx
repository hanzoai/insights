import { useActions, useValues } from 'kea'
import { useEffect, useMemo } from 'react'

import { InputSelect, InputSelectOption } from '@hanzo/elements'

import { Field } from 'lib/elements/Field'

import { githubIntegrationLogic } from './githubIntegrationLogic'

export type GitHubRepositoryPickerProps = {
    integrationId: number
    value: string
    onChange: (value: string) => void
}

export const GitHubRepositoryPicker = ({
    value,
    onChange,
    integrationId,
}: GitHubRepositoryPickerProps): JSX.Element => {
    const { options, loading } = useRepositories(integrationId)

    return (
        <InputSelect
            onChange={(val) => onChange?.(val[0] ?? null)}
            value={value ? [value] : []}
            mode="single"
            data-attr="select-github-repository"
            placeholder="Select a repository..."
            options={options}
            loading={loading}
        />
    )
}

export const GitHubRepositorySelectField = ({ integrationId }: { integrationId: number }): JSX.Element => {
    const { options, loading } = useRepositories(integrationId)

    return (
        <Field name="repositories" label="Repository">
            <InputSelect
                mode="single"
                data-attr="select-github-repository"
                placeholder="Select a repository..."
                options={options}
                loading={loading}
            />
        </Field>
    )
}

export function useRepositories(integrationId: number): { options: InputSelectOption[]; loading: boolean } {
    const logic = githubIntegrationLogic({ id: integrationId })
    const { repositories, repositoriesLoading } = useValues(logic)
    const { loadRepositories } = useActions(logic)

    useEffect(() => {
        loadRepositories()
    }, [loadRepositories])

    const options = useMemo(() => repositories.map((r) => ({ key: r, label: r })), [repositories])

    return { options, loading: repositoriesLoading }
}
