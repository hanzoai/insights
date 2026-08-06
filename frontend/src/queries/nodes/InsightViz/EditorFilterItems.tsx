import { Fragment } from 'react'

import { Field } from 'lib/elements/Field'

import type { InsightEditorFilter, InsightLogicProps } from '~/types'

export interface EditorFilterItemsProps {
    editorFilters: InsightEditorFilter[]
    insightProps: InsightLogicProps
}

export function EditorFilterItems({ editorFilters, insightProps }: EditorFilterItemsProps): JSX.Element {
    return (
        <>
            {editorFilters.map(({ label: Label, tooltip, showOptional, key, component: Component }) => {
                if (Component && Component.name === 'component') {
                    throw new Error(
                        `Component for filter ${key} is an anonymous function, which is not a valid React component! Use a named function instead.`
                    )
                }
                return (
                    <Fragment key={key}>
                        <Field.Pure
                            label={typeof Label === 'function' ? <Label insightProps={insightProps} /> : Label}
                            info={tooltip}
                            showOptional={showOptional}
                        >
                            {Component ? <Component insightProps={insightProps} /> : null}
                        </Field.Pure>
                    </Fragment>
                )
            })}
        </>
    )
}
