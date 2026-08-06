import { IconQueryEditor } from 'lib/elements/icons'
import { Button, ButtonWithoutSideActionProps } from 'lib/elements/Button'
import { urls } from 'scenes/urls'

export interface EditInsightsQLButtonProps extends ButtonWithoutSideActionProps {
    insightsql: string
}

export function EditInsightsQLButton({ insightsql, ...props }: EditInsightsQLButtonProps): JSX.Element {
    return (
        <Button
            data-attr="open-json-editor-button"
            type="secondary"
            to={urls.sqlEditor({ query: insightsql })}
            icon={<IconQueryEditor />}
            tooltip="Edit SQL directly"
            {...props}
        />
    )
}
