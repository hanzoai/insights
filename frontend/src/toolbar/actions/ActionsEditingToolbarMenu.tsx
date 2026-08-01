import { useActions, useValues } from 'kea'
import { Field, Form, Group } from 'kea-forms'

import { IconPencil, IconPlus, IconSearch, IconTrash } from '@hanzo/icons'
import { Divider, Tag } from '@hanzo/elements'

import { Button } from 'lib/elements/Button'
import { Input } from 'lib/elements/Input'

import { actionsTabLogic } from '~/toolbar/actions/actionsTabLogic'
import { SelectorEditingModal } from '~/toolbar/actions/SelectorEditingModal'
import { StepField } from '~/toolbar/actions/StepField'
import { ToolbarMenu } from '~/toolbar/bar/ToolbarMenu'
import { SelectorQualityWarning } from '~/toolbar/elements/SelectorQualityWarning'
import { toolbarInsightsJS } from '~/toolbar/toolbarInsightsJS'

export const ActionsEditingToolbarMenu = (): JSX.Element => {
    const {
        selectedActionId,
        inspectingElement,
        editingSelector,
        elementsChainBeingEdited,
        editingSelectorValue,
        actionForm,
    } = useValues(actionsTabLogic)
    const { setActionFormValue, selectAction, inspectForElementWithIndex, setElementSelector, editSelectorWithIndex } =
        useActions(actionsTabLogic)

    return (
        <ToolbarMenu>
            <SelectorEditingModal
                isOpen={editingSelector !== null}
                setIsOpen={() => editSelectorWithIndex(null)}
                activeElementChain={elementsChainBeingEdited}
                startingSelector={editingSelectorValue}
                onChange={(selector) => {
                    if (selector && editingSelector !== null) {
                        toolbarInsightsJS.capture('toolbar_manual_selector_applied', {
                            chosenSelector: selector,
                        })
                        setElementSelector(selector, editingSelector)
                    }
                }}
            />
            <Form
                name="action_step"
                logic={actionsTabLogic}
                formKey="actionForm"
                enableFormOnSubmit
                className="flex flex-col overflow-hidden flex-1"
            >
                <ToolbarMenu.Header className="border-b">
                    <h1 className="p-1 font-bold text-sm mb-0">
                        {selectedActionId === 'new' ? 'New ' : 'Edit '}
                        action
                    </h1>
                </ToolbarMenu.Header>
                <ToolbarMenu.Body>
                    <div className="p-1">
                        <div>
                            <p>What did your user do?</p>
                            <Field name="name">
                                <Input
                                    placeholder="E.g: Clicked Sign Up"
                                    className="action-title-field"
                                    stopPropagation={true}
                                />
                            </Field>
                        </div>

                        {actionForm.steps?.map((step, index) => (
                            <Group key={index} name={['steps', index]}>
                                <Divider />
                                <div key={index} className="p-1 flex flex-col gap-2">
                                    <div className="flex flex-row justify-between">
                                        <h3>
                                            {index > 0 ? 'OR ' : null}Element #{index + 1}
                                        </h3>
                                        <Button
                                            type="tertiary"
                                            size="small"
                                            onClick={() =>
                                                setActionFormValue(
                                                    'steps',
                                                    //actionForm.steps without the step at index
                                                    actionForm.steps?.filter((_, i) => i !== index)
                                                )
                                            }
                                            sideIcon={<IconTrash />}
                                        >
                                            Remove
                                        </Button>
                                    </div>

                                    <div className="action-inspect">
                                        <Button
                                            size="small"
                                            type={inspectingElement === index ? 'primary' : 'secondary'}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                inspectForElementWithIndex(inspectingElement === index ? null : index)
                                            }}
                                            icon={<IconSearch />}
                                        >
                                            {step?.event === '$autocapture' ? 'Change Element' : 'Select Element'}
                                        </Button>
                                    </div>

                                    {step?.event === '$autocapture' || inspectingElement === index ? (
                                        <>
                                            <StepField
                                                step={step}
                                                item="selector"
                                                label="Selector"
                                                caption="CSS selector that uniquely identifies your element"
                                            />
                                            <SelectorQualityWarning selector={step?.selector} />
                                            <div className="flex flex-row justify-end mb-2">
                                                <Button
                                                    size="small"
                                                    type="secondary"
                                                    icon={<IconPencil />}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        toolbarInsightsJS.capture(
                                                            'toolbar_manual_selector_modal_opened',
                                                            {
                                                                selector: step?.selector ?? null,
                                                            }
                                                        )
                                                        editSelectorWithIndex(index)
                                                    }}
                                                >
                                                    Edit the selector
                                                </Button>
                                            </div>
                                            <StepField
                                                step={step}
                                                item="href"
                                                label="Link target"
                                                caption={
                                                    <>
                                                        If your element is a link, the location that the link opens (
                                                        <code>href</code> tag)
                                                    </>
                                                }
                                            />
                                            <Tag type="highlight">
                                                <span className="uppercase">and</span>
                                            </Tag>
                                            <StepField
                                                step={step}
                                                item="text"
                                                label="Text"
                                                caption="Text content inside your element"
                                            />
                                            <Tag type="highlight">
                                                <span className="uppercase">and</span>
                                            </Tag>
                                            <StepField
                                                step={step}
                                                item="url"
                                                label="Page URL"
                                                caption="Elements will match only when triggered from the URL."
                                            />
                                        </>
                                    ) : null}

                                    {index === (actionForm.steps?.length || 0) - 1 ? (
                                        <div className="text-right mt-4">
                                            <Button
                                                type="secondary"
                                                size="small"
                                                sideIcon={<IconPlus />}
                                                onClick={() =>
                                                    setActionFormValue('steps', [...(actionForm.steps || []), {}])
                                                }
                                            >
                                                Add Another Element
                                            </Button>
                                        </div>
                                    ) : null}
                                </div>
                            </Group>
                        ))}

                        {(actionForm.steps || []).length === 0 ? (
                            <Button
                                icon={<IconPlus />}
                                size="small"
                                type="primary"
                                onClick={() => setActionFormValue('steps', [...(actionForm.steps || []), {}])}
                                className="my-2"
                            >
                                Add An Element
                            </Button>
                        ) : null}
                    </div>
                </ToolbarMenu.Body>
                <ToolbarMenu.Footer>
                    <span className="flex-1" />
                    <Button type="secondary" size="small" onClick={() => selectAction(null)}>
                        Cancel
                    </Button>
                    <Button type="primary" htmlType="submit" size="small">
                        {selectedActionId === 'new' ? 'Create ' : 'Save '}
                        action
                    </Button>
                </ToolbarMenu.Footer>
            </Form>
        </ToolbarMenu>
    )
}
