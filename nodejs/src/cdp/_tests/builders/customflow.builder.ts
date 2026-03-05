import { randomUUID } from 'crypto'

import { findActionByType } from '~/cdp/services/customflows/customflow-utils'
import { CustomFlow, CustomFlowAction, CustomFlowEdge } from '~/schema/customflow'
import { logger } from '~/utils/logger'

import { CUSTOM_SCRIPT_FILTERS_EXAMPLES } from '../examples'

/**
 * Helps us build like this
    actions: {
        'action-1': {
            type: 'trigger',
            config: {
                filters: {},
            },
        },
        'action-2': {
            type: 'delay',
            config: {
                delay_duration: '1h',
            },
        },
    },
    edges: {
        'edge-1': {
            from: 'action-1',
            to: 'action-2',
            type: 'continue',
        },
        'edge-2': {
            from: 'action-2',
            to: 'action-1',
            type: 'continue',
        },
    }
 */
export type SimpleCustomFlowRepresentation = {
    actions: Record<string, Pick<CustomFlowAction, 'type' | 'config'> & Partial<Omit<CustomFlowAction, 'type' | 'config'>>>
    edges: CustomFlowEdge[]
}

export class FixtureCustomFlowBuilder {
    private customFlow: CustomFlow

    constructor() {
        this.customFlow = {
            id: randomUUID(),
            version: 1,
            name: 'Custom Flow',
            team_id: 1,
            status: 'active',
            trigger: undefined as any,
            exit_condition: 'exit_on_conversion',
            edges: [],
            actions: [],
        }
    }

    build(): CustomFlow {
        if (this.customFlow.actions.length === 0) {
            this.withSimpleWorkflow()
        }
        const triggerAction = findActionByType(this.customFlow, 'trigger')
        this.customFlow.trigger = this.customFlow.trigger ?? (triggerAction ? triggerAction.config : undefined)

        if (!this.customFlow.trigger) {
            logger.error('[CustomFlowBuilder] No trigger action found. Indicates a faulty built workflow')
        }

        // Compute billable_action_types based on actions
        const billableTypes = new Set(['function', 'function_email', 'function_sms', 'function_push'])
        const uniqueBillableTypes = new Set<string>()

        for (const action of this.customFlow.actions) {
            if (billableTypes.has(action.type)) {
                uniqueBillableTypes.add(action.type)
            }
        }

        this.customFlow.billable_action_types = Array.from(uniqueBillableTypes).sort()

        return this.customFlow
    }

    withName(name: string): this {
        this.customFlow.name = name
        return this
    }

    withTeamId(teamId: number): this {
        this.customFlow.team_id = teamId
        return this
    }

    withStatus(status: CustomFlow['status']): this {
        this.customFlow.status = status
        return this
    }

    withExitCondition(exitCondition: CustomFlow['exit_condition']): this {
        this.customFlow.exit_condition = exitCondition
        return this
    }

    withWorkflow(workflow: SimpleCustomFlowRepresentation): this {
        this.customFlow.actions = Object.entries(workflow.actions).map(([id, action]) => ({
            id,
            name: action.type,
            description: action.type,
            created_at: Date.now(),
            updated_at: Date.now(),
            on_error: 'continue',
            ...(action as any), // TRICKY: Nasty cast as the union types are beyond me get right
        }))

        this.customFlow.edges = workflow.edges

        return this
    }

    withConversion(conversion: CustomFlow['conversion']): this {
        this.customFlow.conversion = conversion
        return this
    }

    withSimpleWorkflow({ trigger }: { trigger?: CustomFlow['trigger'] } = {}): this {
        return this.withWorkflow({
            actions: {
                trigger: {
                    type: 'trigger',
                    config: trigger ?? {
                        type: 'event',
                        filters: CUSTOM_SCRIPT_FILTERS_EXAMPLES.no_filters.filters ?? {},
                    },
                },
                exit: {
                    type: 'exit',
                    config: {},
                },
            },
            edges: [
                {
                    from: 'trigger',
                    to: 'exit',
                    type: 'continue',
                },
            ],
        })
    }
}
