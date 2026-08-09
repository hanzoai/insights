import { randomUUID } from 'crypto'

import { Flow, FlowAction, FlowEdge } from '~/cdp/schema/flow'
import { findActionByType } from '~/cdp/services/flows/flow-utils'
import { logger } from '~/common/utils/logger'

import { INSIGHTS_FILTERS_EXAMPLES } from '../examples'

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
export type SimpleFlowRepresentation = {
    actions: Record<string, Pick<FlowAction, 'type' | 'config'> & Partial<Omit<FlowAction, 'type' | 'config'>>>
    edges: FlowEdge[]
}

export class FixtureFlowBuilder {
    private flow: Flow

    constructor() {
        this.flow = {
            id: randomUUID(),
            version: 1,
            name: 'Script Flow',
            team_id: 1,
            status: 'active',
            trigger: undefined as any,
            exit_condition: 'exit_on_conversion',
            edges: [],
            actions: [],
        }
    }

    build(): Flow {
        if (this.flow.actions.length === 0) {
            this.withSimpleWorkflow()
        }
        const triggerAction = findActionByType(this.flow, 'trigger')
        this.flow.trigger = this.flow.trigger ?? (triggerAction ? triggerAction.config : undefined)

        if (!this.flow.trigger) {
            logger.error('[FlowBuilder] No trigger action found. Indicates a faulty built workflow')
        }

        // Compute billable_action_types based on actions
        const billableTypes = new Set(['function', 'function_email', 'function_sms', 'function_push'])
        const uniqueBillableTypes = new Set<string>()

        for (const action of this.flow.actions) {
            if (billableTypes.has(action.type)) {
                uniqueBillableTypes.add(action.type)
            }
        }

        this.flow.billable_action_types = Array.from(uniqueBillableTypes).sort()

        return this.flow
    }

    withName(name: string): this {
        this.flow.name = name
        return this
    }

    withTeamId(teamId: number): this {
        this.flow.team_id = teamId
        return this
    }

    withStatus(status: Flow['status']): this {
        this.flow.status = status
        return this
    }

    withExitCondition(exitCondition: Flow['exit_condition']): this {
        this.flow.exit_condition = exitCondition
        return this
    }

    withWorkflow(workflow: SimpleFlowRepresentation): this {
        this.flow.actions = Object.entries(workflow.actions).map(([id, action]) => ({
            id,
            name: action.type,
            description: action.type,
            created_at: Date.now(),
            updated_at: Date.now(),
            on_error: 'continue',
            ...(action as any), // TRICKY: Nasty cast as the union types are beyond me get right
        }))

        this.flow.edges = workflow.edges

        return this
    }

    withConversion(conversion: Flow['conversion']): this {
        this.flow.conversion = conversion
        return this
    }

    withSimpleWorkflow({ trigger }: { trigger?: Flow['trigger'] } = {}): this {
        return this.withWorkflow({
            actions: {
                trigger: {
                    type: 'trigger',
                    config: trigger ?? {
                        type: 'event',
                        filters: INSIGHTS_FILTERS_EXAMPLES.no_filters.filters ?? {},
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
