import { useActions, useValues } from 'kea'
import { useEffect, useMemo } from 'react'

import { InputSelect, InputSelectOption } from '@hanzo/elements'

import { Field } from 'lib/elements/Field'

import { jiraIntegrationLogic } from './jiraIntegrationLogic'

export type JiraProjectPickerProps = {
    integrationId: number
    value: string
    onChange: (value: string) => void
}

export const JiraProjectPicker = ({ value, onChange, integrationId }: JiraProjectPickerProps): JSX.Element => {
    const { options, loading } = useJiraProjects(integrationId)

    return (
        <InputSelect
            onChange={(val) => onChange?.(val[0] ?? '')}
            value={value ? [value] : []}
            mode="single"
            data-attr="select-jira-project"
            placeholder="Select a project..."
            options={options}
            loading={loading}
        />
    )
}

export const JiraProjectSelectField = ({ integrationId }: { integrationId: number }): JSX.Element => {
    const { options, loading } = useJiraProjects(integrationId)

    return (
        <Field name="projectKeys" label="Project">
            <InputSelect
                mode="single"
                data-attr="select-jira-project"
                placeholder="Select a project..."
                options={options}
                loading={loading}
            />
        </Field>
    )
}

export function useJiraProjects(integrationId: number): { options: InputSelectOption[]; loading: boolean } {
    const logic = jiraIntegrationLogic({ id: integrationId })
    const { jiraProjects, jiraProjectsLoading } = useValues(logic)
    const { loadJiraProjects } = useActions(logic)

    useEffect(() => {
        loadJiraProjects()
    }, [loadJiraProjects])

    const options = useMemo(
        () => jiraProjects.map((p) => ({ key: p.key, label: `${p.name} (${p.key})` })),
        [jiraProjects]
    )

    return { options, loading: jiraProjectsLoading }
}
