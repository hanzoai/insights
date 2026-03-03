import { randomUUID } from 'crypto'

import { findActionByType } from '~/cdp/services/insightsflows/customflow-utils'
import { InsightsFlow, InsightsFlowAction, InsightsFlowEdge } from '~/schema/insightsflow'
import { logger } from '~/utils/logger'

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
    private insightsFlow: InsightsFlow

    constructor() {
        this.insightsFlow = {
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

    build(): InsightsFlow {
        if (this.insightsFlow.actions.length === 0) {
            this.withSimpleWorkflow()
        }
        const triggerAction = findActionByType(this.insightsFlow, 'trigger')
        this.insightsFlow.trigger = this.insightsFlow.trigger ?? (triggerAction ? triggerAction.config : undefined)

        if (!this.insightsFlow.trigger) {
            logger.error('[InsightsFlowBuilder] No trigger action found. Indicates a faulty built workflow')
        }

        // Compute billable_action_types based on actions
        const billableTypes = new Set(['function', 'function_email', 'function_sms', 'function_push'])
        const uniqueBillableTypes = new Set<string>()

        for (const action of this.insightsFlow.actions) {
            if (billableTypes.has(action.type)) {
                uniqueBillableTypes.add(action.type)
            }
        }

        this.insightsFlow.billable_action_types = Array.from(uniqueBillableTypes).sort()

        return this.insightsFlow
    }

    withName(name: string): this {
        this.insightsFlow.name = name
        return this
    }

    withTeamId(teamId: number): this {
        this.insightsFlow.team_id = teamId
        return this
    }

    withStatus(status: InsightsFlow['status']): this {
        this.insightsFlow.status = status
        return this
    }

    withExitCondition(exitCondition: InsightsFlow['exit_condition']): this {
        this.insightsFlow.exit_condition = exitCondition
        return this
    }

    withWorkflow(workflow: SimpleInsightsFlowRepresentation): this {
        this.insightsFlow.actions = Object.entries(workflow.actions).map(([id, action]) => ({
            id,
            name: action.type,
            description: action.type,
            created_at: Date.now(),
            updated_at: Date.now(),
            on_error: 'continue',
            ...(action as any), // TRICKY: Nasty cast as the union types are beyond me get right
        }))

        this.insightsFlow.edges = workflow.edges

        return this
    }

    withConversion(conversion: InsightsFlow['conversion']): this {
        this.insightsFlow.conversion = conversion
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
