import { useEffect, useState } from 'react'

import { Link } from '@hanzo/elements'

import { CLICK_OUTSIDE_BLOCK_CLASS } from 'lib/hooks/useOutsideClickHandler'
import { Button } from 'lib/elements/Button'
import { CodeEditorInline } from 'lib/monaco/CodeEditorInline'

import { AnyDataNode } from '~/queries/schema/schema-general'
import { isActorsQuery } from '~/queries/utils'

export interface InsightsQLEditorProps {
    onChange: (value: string) => void
    value: string | undefined | null
    metadataSource?: AnyDataNode
    globals?: Record<string, any>
    disablePersonProperties?: boolean
    disableAutoFocus?: boolean
    disableCmdEnter?: boolean
    submitText?: string
    placeholder?: string
}

export function InsightsQLEditor({
    onChange,
    value,
    metadataSource,
    globals,
    disableAutoFocus,
    disableCmdEnter,
    submitText,
    placeholder,
}: InsightsQLEditorProps): JSX.Element {
    const [bufferedValue, setBufferedValue] = useState(value ?? '')
    useEffect(() => {
        setBufferedValue(value ?? '')
    }, [value])

    return (
        <>
            <CodeEditorInline
                data-attr="inline-insightsql-editor"
                value={bufferedValue || ''}
                onChange={(newValue) => {
                    setBufferedValue(newValue ?? '')
                }}
                language="insightsQLExpr"
                className={CLICK_OUTSIDE_BLOCK_CLASS}
                minHeight="78px"
                autoFocus={!disableAutoFocus}
                sourceQuery={metadataSource}
                globals={globals}
                onPressCmdEnter={
                    disableCmdEnter
                        ? undefined
                        : (value) => {
                              onChange(value)
                          }
                }
            />
            <div className="text-secondary pt-2 text-xs">
                <pre>
                    {placeholder ??
                        (metadataSource && isActorsQuery(metadataSource)
                            ? "Enter SQL expression, such as:\n- properties.$geoip_country_name\n- toInt(properties.$browser_version) * 10\n- concat(properties.name, ' <', properties.email, '>')\n- toBool(is_identified) ? 'user' : 'anon'"
                            : "Enter SQL Expression, such as:\n- properties.$current_url\n- person.properties.email\n- toInt(properties.`Long Field Name`) * 10\n- concat(event, ' ', distinct_id)")}
                </pre>
            </div>
            <Button
                className="mt-2"
                fullWidth
                type="primary"
                onClick={() => onChange(bufferedValue)}
                disabledReason={!bufferedValue ? 'Please enter a SQL expression' : null}
                center
            >
                {submitText ?? 'Update SQL expression'}
            </Button>
            <div className="flex mt-1 gap-1">
                <div className={`w-full text-right select-none ${CLICK_OUTSIDE_BLOCK_CLASS}`}>
                    <Link to="https://hanzo.ai/docs/sql" target="_blank">
                        Learn more about SQL
                    </Link>
                </div>
            </div>
        </>
    )
}
