import { useActions, useValues } from 'kea'
import { Form, Group } from 'kea-forms'

import { IconPlus } from '@hanzo/icons'

import { Banner } from 'lib/elements/Banner'
import { Button } from 'lib/elements/Button'
import { Collapse } from 'lib/elements/Collapse'
import { Input } from 'lib/elements/Input'
import { Label } from 'lib/elements/Label'

import { ToolbarMenu } from '~/toolbar/bar/ToolbarMenu'
import { WebExperimentVariant } from '~/toolbar/experiments/WebExperimentVariant'
import { WebExperimentVariantHeader } from '~/toolbar/experiments/WebExperimentVariantHeader'
import { experimentsTabLogic } from '~/toolbar/experiments/experimentsTabLogic'

export const ExperimentsEditingToolbarMenu = (): JSX.Element => {
    const { selectedExperimentId, experimentForm, addVariantAvailable, selectedVariant, experimentFormErrors } =
        useValues(experimentsTabLogic)
    const { selectExperiment, selectVariant, addNewVariant, applyVariant, setExperimentFormValue } =
        useActions(experimentsTabLogic)

    return (
        <ToolbarMenu>
            <Form
                name="experiment"
                logic={experimentsTabLogic}
                formKey="experimentForm"
                enableFormOnSubmit
                className="flex flex-col overflow-hidden flex-1"
            >
                <ToolbarMenu.Header className="border-b">
                    {selectedExperimentId === 'new' ? (
                        <div className="w-full px-2 pb-4 pt-2">
                            <Label>Experiment name</Label>
                            <Input
                                className="w-2/3 mt-1"
                                placeholder="Example: Pricing page conversion"
                                onChange={(newName: string) => {
                                    setExperimentFormValue('name', newName)
                                }}
                                value={experimentForm.name}
                                status={experimentFormErrors.name ? 'danger' : 'default'}
                            />
                        </div>
                    ) : (
                        <h2 className="p-2 font-bold">{experimentForm.name}</h2>
                    )}
                    <div id="errorcontainer">
                        {Object.keys(experimentFormErrors).length > 0 &&
                            !Object.values(experimentFormErrors).every((el) => el === undefined) && (
                                <Banner type="error">
                                    <ol>
                                        {experimentFormErrors.name && <li>{experimentFormErrors.name}</li>}
                                        {experimentFormErrors.variants && (
                                            <li>{String(experimentFormErrors.variants)}</li>
                                        )}
                                    </ol>
                                </Banner>
                            )}
                    </div>
                </ToolbarMenu.Header>
                <ToolbarMenu.Body>
                    <div className="deprecated-space-y-6 p-2">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <Label>Variants</Label>
                                {addVariantAvailable && (
                                    <Button
                                        type="secondary"
                                        size="xsmall"
                                        icon={<IconPlus />}
                                        onClick={addNewVariant}
                                    >
                                        Add variant
                                    </Button>
                                )}
                            </div>
                            <Group name="variants">
                                <div>
                                    <Collapse
                                        size="medium"
                                        activeKey={selectedVariant}
                                        onChange={(newVariant) => {
                                            if (newVariant) {
                                                selectVariant(newVariant)
                                                applyVariant(newVariant)
                                            }
                                        }}
                                        panels={Object.keys(experimentForm.variants || {})
                                            .sort((a, b) => (b === 'control' ? 0 : a.localeCompare(b)))
                                            .map((variant) => {
                                                return {
                                                    key: variant,
                                                    header: <WebExperimentVariantHeader variant={variant} />,
                                                    content:
                                                        variant == 'control' ? (
                                                            <span className="m-2">
                                                                {' '}
                                                                The control variant represents your page in its original
                                                                state.{' '}
                                                            </span>
                                                        ) : (
                                                            <WebExperimentVariant variant={variant} />
                                                        ),
                                                }
                                            })}
                                    />
                                </div>
                            </Group>
                        </div>
                    </div>
                </ToolbarMenu.Body>
                <ToolbarMenu.Footer>
                    <div className="flex justify-between items-center w-full">
                        <Button type="secondary" size="small" onClick={() => selectExperiment(null)}>
                            Cancel
                        </Button>

                        <Button type="primary" htmlType="submit" size="small">
                            {selectedExperimentId === 'new' ? 'Save as  draft' : 'Save experiment'}
                        </Button>
                    </div>
                </ToolbarMenu.Footer>
            </Form>
        </ToolbarMenu>
    )
}
