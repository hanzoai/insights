import { LemonButton, LemonButtonWithoutSideActionProps } from 'lib/lemon-ui/LemonButton'
import { IconQueryEditor } from 'lib/lemon-ui/icons'
import { urls } from 'scenes/urls'

export interface EditInsightsQLButtonProps extends LemonButtonWithoutSideActionProps {
    insightsql: string
}

export function EditInsightsQLButton({ insightsql, ...props }: EditInsightsQLButtonProps): JSX.Element {
    return (
        <LemonButton
            data-attr="open-json-editor-button"
            type="secondary"
            to={urls.sqlEditor({ query: insightsql })}
            icon={<IconQueryEditor />}
            tooltip="Edit SQL directly"
            {...props}
        />
    )
}
