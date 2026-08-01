import { InsightsQLEditor } from 'lib/components/InsightsQLEditor/InsightsQLEditor'
import { TaxonomicFilterValue } from 'lib/components/TaxonomicFilter/types'

import { AnyDataNode } from '~/queries/schema/schema-general'

export interface InlineInsightsQLEditorProps {
    value?: TaxonomicFilterValue
    onChange: (value: TaxonomicFilterValue, item?: any) => void
    metadataSource?: AnyDataNode
    globals?: Record<string, any>
    showBreakdownLabelHint?: boolean
}

export function InlineInsightsQLEditor({
    value,
    onChange,
    metadataSource,
    globals,
    showBreakdownLabelHint,
}: InlineInsightsQLEditorProps): JSX.Element {
    return (
        <>
            <div className="taxonomic-group-title">SQL expression</div>
            <div className="px-2 pt-2">
                <InsightsQLEditor
                    onChange={onChange}
                    value={String(value ?? '')}
                    metadataSource={metadataSource}
                    globals={globals}
                    submitText={value ? 'Update SQL expression' : 'Add SQL expression'}
                    showBreakdownLabelHint={showBreakdownLabelHint}
                    disableAutoFocus // :TRICKY: No autofocus here. It's controlled in the TaxonomicFilter.
                />
            </div>
        </>
    )
}
