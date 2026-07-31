import { useActions } from 'kea'
import { Field, Form } from 'kea-forms'
import { useState } from 'react'

import { Link } from '@hanzo/elements'

import { AnimatedCollapsible } from 'lib/components/AnimatedCollapsible'
import { Button } from 'lib/elements/Button'
import { Input } from 'lib/elements/Input/Input'
import { Modal } from 'lib/elements/Modal'
import { asyncMigrationParameterFormLogic } from 'scenes/instance/AsyncMigrations/asyncMigrationParameterFormLogic'
import { AsyncMigrationModalProps, asyncMigrationsLogic } from 'scenes/instance/AsyncMigrations/asyncMigrationsLogic'

export function AsyncMigrationParametersModal(props: AsyncMigrationModalProps): JSX.Element {
    const { closeAsyncMigrationsModal } = useActions(asyncMigrationsLogic)

    const [collapsed, setCollapsed] = useState(true)

    return (
        <Modal title="" onClose={closeAsyncMigrationsModal} isOpen={true} simple>
            <Form
                logic={asyncMigrationParameterFormLogic}
                props={props}
                formKey="parameters"
                enableFormOnSubmit
                id="async-migration-parameters-form"
                className="Modal__layout"
            >
                <Modal.Header>
                    <h3>Advanced migration configuration</h3>
                </Modal.Header>
                <Modal.Content>
                    <p>
                        This async migration allows tuning parameters used in the async migration.
                        {collapsed && (
                            <>
                                <br />
                                <Link
                                    onClick={() => {
                                        setCollapsed(!collapsed)
                                    }}
                                >
                                    Show advanced configuration
                                </Link>
                            </>
                        )}
                    </p>

                    <AnimatedCollapsible collapsed={collapsed}>
                        {Object.entries(props.migration.parameter_definitions).map(
                            ([parameterName, [defaultValue, parameterDescription]]) => (
                                <Field name={parameterName} key={parameterName} label={<>{parameterDescription}</>}>
                                    {/* TODO: Send the parameter type from the backend */}
                                    <Input type={typeof defaultValue === 'number' ? 'number' : 'text'} />
                                </Field>
                            )
                        )}
                    </AnimatedCollapsible>
                </Modal.Content>
                <Modal.Footer>
                    <Button
                        form="async-migration-parameters-form"
                        type="secondary"
                        data-attr="async-migration-parameters-cancel"
                        className="mr-2"
                        onClick={closeAsyncMigrationsModal}
                    >
                        Cancel
                    </Button>
                    <Button
                        form="async-migration-parameters-form"
                        htmlType="submit"
                        type="primary"
                        data-attr="async-migration-parameters-submit"
                    >
                        Run migration
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    )
}
