import { randomUUID } from 'crypto'

import { InsightsFlow, InsightsFlowAction, InsightsFlowEdge } from '~/cdp/schema/hogflow'
import { findActionByType } from '~/cdp/services/insightsflows/hogflow-utils'
import { logger } from '~/common/utils/logger'

import { FN_FILTERS_EXAMPLES } from '../examples'

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
export type SimpleInsightsFlowRepresentation = {
    actions: Record<string, Pick<InsightsFlowAction, 'type' | 'config'> & Partial<Omit<InsightsFlowAction, 'type' | 'config'>>>
    edges: InsightsFlowEdge[]
}

export class FixtureInsightsFlowBuilder {
    private hogFlow: InsightsFlow

    constructor() {
        this.hogFlow = {
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

    build(): InsightsFlow {
        if (this.hogFlow.actions.length === 0) {
            this.withSimpleWorkflow()
        }
        const triggerAction = findActionByType(this.hogFlow, 'trigger')
        this.hogFlow.trigger = this.hogFlow.trigger ?? (triggerAction ? triggerAction.config : undefined)

        if (!this.hogFlow.trigger) {
            logger.error('[InsightsFlowBuilder] No trigger action found. Indicates a faulty built workflow')
        }

        // Compute billable_action_types based on actions
        const billableTypes = new Set(['function', 'function_email', 'function_sms', 'function_push'])
        const uniqueBillableTypes = new Set<string>()

        for (const action of this.hogFlow.actions) {
            if (billableTypes.has(action.type)) {
                uniqueBillableTypes.add(action.type)
            }
        }

        this.hogFlow.billable_action_types = Array.from(uniqueBillableTypes).sort()

        return this.hogFlow
    }

    withName(name: string): this {
        this.hogFlow.name = name
        return this
    }

    withTeamId(teamId: number): this {
        this.hogFlow.team_id = teamId
        return this
    }

    withStatus(status: InsightsFlow['status']): this {
        this.hogFlow.status = status
        return this
    }

    withExitCondition(exitCondition: InsightsFlow['exit_condition']): this {
        this.hogFlow.exit_condition = exitCondition
        return this
    }

    withWorkflow(workflow: SimpleInsightsFlowRepresentation): this {
        this.hogFlow.actions = Object.entries(workflow.actions).map(([id, action]) => ({
            id,
            name: action.type,
            description: action.type,
            created_at: Date.now(),
            updated_at: Date.now(),
            on_error: 'continue',
            ...(action as any), // TRICKY: Nasty cast as the union types are beyond me get right
        }))

        this.hogFlow.edges = workflow.edges

        return this
    }

    withConversion(conversion: InsightsFlow['conversion']): this {
        this.hogFlow.conversion = conversion
        return this
    }

    withSimpleWorkflow({ trigger }: { trigger?: InsightsFlow['trigger'] } = {}): this {
        return this.withWorkflow({
            actions: {
                trigger: {
                    type: 'trigger',
                    config: trigger ?? {
                        type: 'event',
                        filters: FN_FILTERS_EXAMPLES.no_filters.filters ?? {},
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
