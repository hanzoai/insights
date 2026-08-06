import { IconPreview } from 'lib/elements/icons'
import { Button, ButtonWithoutSideActionProps } from 'lib/elements/Button'
import { urls } from 'scenes/urls'

import { Node } from '~/queries/schema/schema-general'

export interface OpenEditorButtonProps extends ButtonWithoutSideActionProps {
    query: Node | null
}

export function OpenEditorButton({ query, ...props }: OpenEditorButtonProps): JSX.Element {
    return (
        <Button
            data-attr="open-json-editor-button"
            type="secondary"
            to={query ? urls.insightNew({ query }) : undefined}
            icon={<IconPreview />}
            tooltip="Open as a new insight"
            size="small"
            {...props}
        />
    )
}
