import { useValues } from 'kea'
import { Form } from 'kea-forms'

import { Button, Skeleton, TextArea } from '@hanzo/elements'

import { Field } from 'lib/elements/Field'
import { projectLogic } from 'scenes/projectLogic'

import { maxSettingsLogic } from './maxSettingsLogic'

export function MaxMemorySettings(): JSX.Element {
    const { currentProject, currentProjectLoading } = useValues(projectLogic)
    const { isLoading, isUpdating } = useValues(maxSettingsLogic)

    return (
        <Form
            logic={maxSettingsLogic}
            formKey="coreMemoryForm"
            enableFormOnSubmit
            className="w-full deprecated-space-y-4"
        >
            {currentProjectLoading || isLoading ? (
                <div className="gap-2 flex flex-col">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-16" />
                </div>
            ) : (
                <Field name="text" label="Insights AI's memory">
                    <TextArea
                        id="product-description-textarea" // Slightly dirty ID for .focus() elsewhere
                        placeholder={`What should Insights AI know about ${
                            currentProject ? currentProject.name : 'your company or this product'
                        }?`}
                        maxLength={10000}
                        maxRows={5}
                    />
                </Field>
            )}
            <Button
                type="primary"
                htmlType="submit"
                disabledReason={!currentProject || isLoading ? 'Loading project and memory...' : undefined}
                loading={isUpdating}
            >
                Save memory
            </Button>
        </Form>
    )
}
