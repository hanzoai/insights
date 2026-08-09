/**
 * Auto-generated Zod validation schemas from the Django backend OpenAPI schema.
 * To modify these schemas, update the Django serializers or views, then run:
 *   insightscli build:openapi
 * Questions or issues? #team-devex on Slack
 *
 * Insights API - generated
 * OpenAPI spec version: 1.0.0
 */
import * as zod from 'zod'

export const flowTemplatesCreateBodyNameMax = 400

export const flowTemplatesCreateBodyImageUrlMax = 8201

export const flowTemplatesCreateBodyTriggerMaskingOneTtlMin = 60
export const flowTemplatesCreateBodyTriggerMaskingOneTtlMax = 94608000

export const flowTemplatesCreateBodyActionsItemNameMax = 400

export const flowTemplatesCreateBodyActionsItemDescriptionDefault = ``
export const flowTemplatesCreateBodyActionsItemFiltersOneSourceDefault = `events`
export const flowTemplatesCreateBodyActionsItemTypeMax = 100

export const flowTemplatesCreateBodyAbortActionMax = 400

export const InsightsFlowTemplatesCreateBody = /* @__PURE__ */ zod
    .object({
        name: zod.string().max(flowTemplatesCreateBodyNameMax),
        description: zod.string().optional(),
        image_url: zod.string().max(flowTemplatesCreateBodyImageUrlMax).nullish(),
        tags: zod.array(zod.string()).optional(),
        scope: zod
            .enum(['team', 'organization', 'global'])
            .describe('\* `team` - Only team\n\* `organization` - Organization\n\* `global` - Global'),
        trigger: zod.unknown().optional(),
        trigger_masking: zod
            .union([
                zod.object({
                    ttl: zod
                        .number()
                        .min(flowTemplatesCreateBodyTriggerMaskingOneTtlMin)
                        .max(flowTemplatesCreateBodyTriggerMaskingOneTtlMax)
                        .nullish()
                        .describe('Seconds (60 to ~94M \/ 3y) to suppress repeat firings of the same hash.'),
                    threshold: zod
                        .number()
                        .nullish()
                        .describe(
                            'Fire once per N matches of the same hash within ttl — a sampler: N=3 fires on the 1st, 4th, 7th… match. Omit to fire on the first match, then suppress repeats within ttl.'
                        ),
                    hash: zod
                        .string()
                        .describe(
                            "InsightsQL template defining the dedup\/grouping key, e.g. '{person.id}' (once per person) within ttl."
                        ),
                    bytecode: zod.unknown().optional().describe('Auto-compiled from hash. Do not set.'),
                }),
                zod.null(),
            ])
            .optional(),
        conversion: zod.unknown().optional(),
        exit_condition: zod
            .enum([
                'exit_on_conversion',
                'exit_on_trigger_not_matched',
                'exit_on_trigger_not_matched_or_conversion',
                'exit_only_at_end',
            ])
            .optional()
            .describe(
                '\* `exit_on_conversion` - Conversion\n\* `exit_on_trigger_not_matched` - Trigger Not Matched\n\* `exit_on_trigger_not_matched_or_conversion` - Trigger Not Matched Or Conversion\n\* `exit_only_at_end` - Only At End'
            ),
        edges: zod.unknown().optional(),
        actions: zod.array(
            zod
                .object({
                    id: zod.string(),
                    name: zod.string().max(flowTemplatesCreateBodyActionsItemNameMax),
                    description: zod.string().default(flowTemplatesCreateBodyActionsItemDescriptionDefault),
                    on_error: zod
                        .union([
                            zod.enum(['continue', 'abort']).describe('\* `continue` - continue\n\* `abort` - abort'),
                            zod.null(),
                        ])
                        .optional()
                        .describe(
                            'On failure: continue (skip the action and proceed) or abort (stop the run).\n\n\* `continue` - continue\n\* `abort` - abort'
                        ),
                    created_at: zod.number().optional(),
                    updated_at: zod.number().optional(),
                    filters: zod
                        .union([
                            zod.object({
                                source: zod
                                    .enum(['events', 'person-updates', 'data-warehouse-table'])
                                    .describe(
                                        '\* `events` - events\n\* `person-updates` - person-updates\n\* `data-warehouse-table` - data-warehouse-table'
                                    )
                                    .default(flowTemplatesCreateBodyActionsItemFiltersOneSourceDefault),
                                actions: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                events: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                data_warehouse: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                properties: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                bytecode: zod.unknown().optional(),
                                transpiled: zod.unknown().optional(),
                                filter_test_accounts: zod.boolean().optional(),
                                bytecode_error: zod.string().optional(),
                            }),
                            zod.null(),
                        ])
                        .optional(),
                    type: zod.string().max(flowTemplatesCreateBodyActionsItemTypeMax),
                    config: zod.unknown(),
                    output_variable: zod.unknown().optional(),
                })
                .describe(
                    'Custom action serializer for templates that skips input validation\n(since templates should have default\/empty values).'
                )
        ),
        abort_action: zod.string().max(flowTemplatesCreateBodyAbortActionMax).nullish(),
        variables: zod
            .array(
                zod
                    .record(zod.string(), zod.string())
                    .describe('Variable: {key, type: string|number|boolean, default}.')
            )
            .optional(),
    })
    .describe(
        'Serializer for creating script flow templates.\nValidates and sanitizes the workflow before creating it as a template.'
    )

export const flowTemplatesUpdateBodyNameMax = 400

export const flowTemplatesUpdateBodyImageUrlMax = 8201

export const flowTemplatesUpdateBodyTriggerMaskingOneTtlMin = 60
export const flowTemplatesUpdateBodyTriggerMaskingOneTtlMax = 94608000

export const flowTemplatesUpdateBodyActionsItemNameMax = 400

export const flowTemplatesUpdateBodyActionsItemDescriptionDefault = ``
export const flowTemplatesUpdateBodyActionsItemFiltersOneSourceDefault = `events`
export const flowTemplatesUpdateBodyActionsItemTypeMax = 100

export const flowTemplatesUpdateBodyAbortActionMax = 400

export const InsightsFlowTemplatesUpdateBody = /* @__PURE__ */ zod
    .object({
        name: zod.string().max(flowTemplatesUpdateBodyNameMax),
        description: zod.string().optional(),
        image_url: zod.string().max(flowTemplatesUpdateBodyImageUrlMax).nullish(),
        tags: zod.array(zod.string()).optional(),
        scope: zod
            .enum(['team', 'organization', 'global'])
            .describe('\* `team` - Only team\n\* `organization` - Organization\n\* `global` - Global'),
        trigger: zod.unknown().optional(),
        trigger_masking: zod
            .union([
                zod.object({
                    ttl: zod
                        .number()
                        .min(flowTemplatesUpdateBodyTriggerMaskingOneTtlMin)
                        .max(flowTemplatesUpdateBodyTriggerMaskingOneTtlMax)
                        .nullish()
                        .describe('Seconds (60 to ~94M \/ 3y) to suppress repeat firings of the same hash.'),
                    threshold: zod
                        .number()
                        .nullish()
                        .describe(
                            'Fire once per N matches of the same hash within ttl — a sampler: N=3 fires on the 1st, 4th, 7th… match. Omit to fire on the first match, then suppress repeats within ttl.'
                        ),
                    hash: zod
                        .string()
                        .describe(
                            "InsightsQL template defining the dedup\/grouping key, e.g. '{person.id}' (once per person) within ttl."
                        ),
                    bytecode: zod.unknown().optional().describe('Auto-compiled from hash. Do not set.'),
                }),
                zod.null(),
            ])
            .optional(),
        conversion: zod.unknown().optional(),
        exit_condition: zod
            .enum([
                'exit_on_conversion',
                'exit_on_trigger_not_matched',
                'exit_on_trigger_not_matched_or_conversion',
                'exit_only_at_end',
            ])
            .optional()
            .describe(
                '\* `exit_on_conversion` - Conversion\n\* `exit_on_trigger_not_matched` - Trigger Not Matched\n\* `exit_on_trigger_not_matched_or_conversion` - Trigger Not Matched Or Conversion\n\* `exit_only_at_end` - Only At End'
            ),
        edges: zod.unknown().optional(),
        actions: zod.array(
            zod
                .object({
                    id: zod.string(),
                    name: zod.string().max(flowTemplatesUpdateBodyActionsItemNameMax),
                    description: zod.string().default(flowTemplatesUpdateBodyActionsItemDescriptionDefault),
                    on_error: zod
                        .union([
                            zod.enum(['continue', 'abort']).describe('\* `continue` - continue\n\* `abort` - abort'),
                            zod.null(),
                        ])
                        .optional()
                        .describe(
                            'On failure: continue (skip the action and proceed) or abort (stop the run).\n\n\* `continue` - continue\n\* `abort` - abort'
                        ),
                    created_at: zod.number().optional(),
                    updated_at: zod.number().optional(),
                    filters: zod
                        .union([
                            zod.object({
                                source: zod
                                    .enum(['events', 'person-updates', 'data-warehouse-table'])
                                    .describe(
                                        '\* `events` - events\n\* `person-updates` - person-updates\n\* `data-warehouse-table` - data-warehouse-table'
                                    )
                                    .default(flowTemplatesUpdateBodyActionsItemFiltersOneSourceDefault),
                                actions: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                events: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                data_warehouse: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                properties: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                bytecode: zod.unknown().optional(),
                                transpiled: zod.unknown().optional(),
                                filter_test_accounts: zod.boolean().optional(),
                                bytecode_error: zod.string().optional(),
                            }),
                            zod.null(),
                        ])
                        .optional(),
                    type: zod.string().max(flowTemplatesUpdateBodyActionsItemTypeMax),
                    config: zod.unknown(),
                    output_variable: zod.unknown().optional(),
                })
                .describe(
                    'Custom action serializer for templates that skips input validation\n(since templates should have default\/empty values).'
                )
        ),
        abort_action: zod.string().max(flowTemplatesUpdateBodyAbortActionMax).nullish(),
        variables: zod
            .array(
                zod
                    .record(zod.string(), zod.string())
                    .describe('Variable: {key, type: string|number|boolean, default}.')
            )
            .optional(),
    })
    .describe(
        'Serializer for creating script flow templates.\nValidates and sanitizes the workflow before creating it as a template.'
    )

export const flowTemplatesPartialUpdateBodyNameMax = 400

export const flowTemplatesPartialUpdateBodyImageUrlMax = 8201

export const flowTemplatesPartialUpdateBodyTriggerMaskingOneTtlMin = 60
export const flowTemplatesPartialUpdateBodyTriggerMaskingOneTtlMax = 94608000

export const flowTemplatesPartialUpdateBodyActionsItemNameMax = 400

export const flowTemplatesPartialUpdateBodyActionsItemDescriptionDefault = ``
export const flowTemplatesPartialUpdateBodyActionsItemFiltersOneSourceDefault = `events`
export const flowTemplatesPartialUpdateBodyActionsItemTypeMax = 100

export const flowTemplatesPartialUpdateBodyAbortActionMax = 400

export const InsightsFlowTemplatesPartialUpdateBody = /* @__PURE__ */ zod
    .object({
        name: zod.string().max(flowTemplatesPartialUpdateBodyNameMax).optional(),
        description: zod.string().optional(),
        image_url: zod.string().max(flowTemplatesPartialUpdateBodyImageUrlMax).nullish(),
        tags: zod.array(zod.string()).optional(),
        scope: zod
            .enum(['team', 'organization', 'global'])
            .optional()
            .describe('\* `team` - Only team\n\* `organization` - Organization\n\* `global` - Global'),
        trigger: zod.unknown().optional(),
        trigger_masking: zod
            .union([
                zod.object({
                    ttl: zod
                        .number()
                        .min(flowTemplatesPartialUpdateBodyTriggerMaskingOneTtlMin)
                        .max(flowTemplatesPartialUpdateBodyTriggerMaskingOneTtlMax)
                        .nullish()
                        .describe('Seconds (60 to ~94M \/ 3y) to suppress repeat firings of the same hash.'),
                    threshold: zod
                        .number()
                        .nullish()
                        .describe(
                            'Fire once per N matches of the same hash within ttl — a sampler: N=3 fires on the 1st, 4th, 7th… match. Omit to fire on the first match, then suppress repeats within ttl.'
                        ),
                    hash: zod
                        .string()
                        .describe(
                            "InsightsQL template defining the dedup\/grouping key, e.g. '{person.id}' (once per person) within ttl."
                        ),
                    bytecode: zod.unknown().optional().describe('Auto-compiled from hash. Do not set.'),
                }),
                zod.null(),
            ])
            .optional(),
        conversion: zod.unknown().optional(),
        exit_condition: zod
            .enum([
                'exit_on_conversion',
                'exit_on_trigger_not_matched',
                'exit_on_trigger_not_matched_or_conversion',
                'exit_only_at_end',
            ])
            .optional()
            .describe(
                '\* `exit_on_conversion` - Conversion\n\* `exit_on_trigger_not_matched` - Trigger Not Matched\n\* `exit_on_trigger_not_matched_or_conversion` - Trigger Not Matched Or Conversion\n\* `exit_only_at_end` - Only At End'
            ),
        edges: zod.unknown().optional(),
        actions: zod
            .array(
                zod
                    .object({
                        id: zod.string(),
                        name: zod.string().max(flowTemplatesPartialUpdateBodyActionsItemNameMax),
                        description: zod
                            .string()
                            .default(flowTemplatesPartialUpdateBodyActionsItemDescriptionDefault),
                        on_error: zod
                            .union([
                                zod
                                    .enum(['continue', 'abort'])
                                    .describe('\* `continue` - continue\n\* `abort` - abort'),
                                zod.null(),
                            ])
                            .optional()
                            .describe(
                                'On failure: continue (skip the action and proceed) or abort (stop the run).\n\n\* `continue` - continue\n\* `abort` - abort'
                            ),
                        created_at: zod.number().optional(),
                        updated_at: zod.number().optional(),
                        filters: zod
                            .union([
                                zod.object({
                                    source: zod
                                        .enum(['events', 'person-updates', 'data-warehouse-table'])
                                        .describe(
                                            '\* `events` - events\n\* `person-updates` - person-updates\n\* `data-warehouse-table` - data-warehouse-table'
                                        )
                                        .default(flowTemplatesPartialUpdateBodyActionsItemFiltersOneSourceDefault),
                                    actions: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                    events: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                    data_warehouse: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                    properties: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                    bytecode: zod.unknown().optional(),
                                    transpiled: zod.unknown().optional(),
                                    filter_test_accounts: zod.boolean().optional(),
                                    bytecode_error: zod.string().optional(),
                                }),
                                zod.null(),
                            ])
                            .optional(),
                        type: zod.string().max(flowTemplatesPartialUpdateBodyActionsItemTypeMax),
                        config: zod.unknown(),
                        output_variable: zod.unknown().optional(),
                    })
                    .describe(
                        'Custom action serializer for templates that skips input validation\n(since templates should have default\/empty values).'
                    )
            )
            .optional(),
        abort_action: zod.string().max(flowTemplatesPartialUpdateBodyAbortActionMax).nullish(),
        variables: zod
            .array(
                zod
                    .record(zod.string(), zod.string())
                    .describe('Variable: {key, type: string|number|boolean, default}.')
            )
            .optional(),
    })
    .describe(
        'Serializer for creating script flow templates.\nValidates and sanitizes the workflow before creating it as a template.'
    )

export const flowsCreateBodyNameMax = 400

export const flowsCreateBodyDescriptionDefault = ``
export const flowsCreateBodyTriggerMaskingOneTtlMin = 60
export const flowsCreateBodyTriggerMaskingOneTtlMax = 94608000

export const flowsCreateBodyConversionOneEventsItemFiltersOneSourceDefault = `events`
export const flowsCreateBodyActionsItemIdMax = 200

export const flowsCreateBodyActionsItemNameMax = 400

export const flowsCreateBodyActionsItemDescriptionDefault = ``
export const flowsCreateBodyActionsItemFiltersOneSourceDefault = `events`
export const flowsCreateBodyActionsItemConfigTwoConditionFiltersOneSourceDefault = `events`
export const flowsCreateBodyActionsItemConfigTwoEventsItemFiltersOneSourceDefault = `events`

export const InsightsFlowsCreateBody = /* @__PURE__ */ zod
    .object({
        name: zod.string().max(flowsCreateBodyNameMax).nullish().describe('Workflow name.'),
        description: zod.string().default(flowsCreateBodyDescriptionDefault).describe('Optional description.'),
        status: zod
            .enum(['draft', 'active', 'archived'])
            .describe('\* `draft` - Draft\n\* `active` - Active\n\* `archived` - Archived')
            .optional()
            .describe(
                'draft (no execution), active (live), archived (disabled).\n\n\* `draft` - Draft\n\* `active` - Active\n\* `archived` - Archived'
            ),
        trigger_masking: zod
            .union([
                zod.object({
                    ttl: zod
                        .number()
                        .min(flowsCreateBodyTriggerMaskingOneTtlMin)
                        .max(flowsCreateBodyTriggerMaskingOneTtlMax)
                        .nullish()
                        .describe('Seconds (60 to ~94M \/ 3y) to suppress repeat firings of the same hash.'),
                    threshold: zod
                        .number()
                        .nullish()
                        .describe(
                            'Fire once per N matches of the same hash within ttl — a sampler: N=3 fires on the 1st, 4th, 7th… match. Omit to fire on the first match, then suppress repeats within ttl.'
                        ),
                    hash: zod
                        .string()
                        .describe(
                            "InsightsQL template defining the dedup\/grouping key, e.g. '{person.id}' (once per person) within ttl."
                        ),
                    bytecode: zod.unknown().optional().describe('Auto-compiled from hash. Do not set.'),
                }),
                zod.null(),
            ])
            .optional()
            .describe(
                "Optional dedup\/throttle on an already-matched trigger: {hash: <InsightsQL template>, ttl: <seconds, 60-94608000>, threshold?: <int>}. Without threshold: fire once per hash, then suppress repeats within ttl (hash '{person.id}' = once per person per ttl). With threshold N: fire once per N matches of the same hash — a sampler, the 1st then every Nth. Throttles an already-qualifying trigger; it doesn't decide who enters. Server compiles bytecode from hash; omit to disable."
            ),
        conversion: zod
            .union([
                zod.object({
                    filters: zod
                        .array(zod.record(zod.string(), zod.unknown()))
                        .optional()
                        .describe(
                            "Property-based conversion conditions, as an ARRAY of property filters: [{key, value, operator, type: event|person|group}, ...]. Event-based goals do NOT go here — put them in 'events'. Empty array = any event within the window converts."
                        ),
                    events: zod
                        .array(
                            zod.object({
                                filters: zod
                                    .object({
                                        source: zod
                                            .enum(['events', 'person-updates', 'data-warehouse-table'])
                                            .describe(
                                                '\* `events` - events\n\* `person-updates` - person-updates\n\* `data-warehouse-table` - data-warehouse-table'
                                            )
                                            .default(flowsCreateBodyConversionOneEventsItemFiltersOneSourceDefault),
                                        actions: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                        events: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                        data_warehouse: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                        properties: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                        bytecode: zod.unknown().optional(),
                                        transpiled: zod.unknown().optional(),
                                        filter_test_accounts: zod.boolean().optional(),
                                        bytecode_error: zod.string().optional(),
                                    })
                                    .describe(
                                        "Event\/action filters for this conversion event, same shape as trigger filters: {events: [{id, name, type: 'events', properties?: [<cond>]}], actions?: [...], properties?: [<cond>]}. bytecode is compiled server-side."
                                    ),
                            })
                        )
                        .optional()
                        .describe(
                            "Event-based conversion goals: [{filters: {events: [{id, name, type: 'events'}], ...}}]."
                        ),
                    window_minutes: zod
                        .number()
                        .nullish()
                        .describe(
                            'Conversion window in minutes after a person enters the workflow. null = no explicit window.'
                        ),
                    bytecode: zod
                        .unknown()
                        .optional()
                        .describe("Compiled server-side from 'filters'. Do not set; ignored if sent."),
                }),
                zod.null(),
            ])
            .optional()
            .describe(
                'Conversion goal. filters: ARRAY of property conditions [{key, value, operator, type: event|person|group}]; events: event-based goals [{filters: {events: [...]}}]; window_minutes: minutes after entry. Required for exit_on_conversion \/ exit_on_trigger_not_matched_or_conversion. bytecode compiled server-side.'
            ),
        exit_condition: zod
            .enum([
                'exit_on_conversion',
                'exit_on_trigger_not_matched',
                'exit_on_trigger_not_matched_or_conversion',
                'exit_only_at_end',
            ])
            .describe(
                '\* `exit_on_conversion` - Conversion\n\* `exit_on_trigger_not_matched` - Trigger Not Matched\n\* `exit_on_trigger_not_matched_or_conversion` - Trigger Not Matched Or Conversion\n\* `exit_only_at_end` - Only At End'
            )
            .optional()
            .describe(
                "exit_only_at_end: only at exit node (default). exit_on_conversion: also on conversion (needs 'conversion'; silent no-op otherwise). exit_on_trigger_not_matched: also when trigger filter stops matching. exit_on_trigger_not_matched_or_conversion: both (needs 'conversion').\n\n\* `exit_on_conversion` - Conversion\n\* `exit_on_trigger_not_matched` - Trigger Not Matched\n\* `exit_on_trigger_not_matched_or_conversion` - Trigger Not Matched Or Conversion\n\* `exit_only_at_end` - Only At End"
            ),
        edges: zod
            .array(
                zod.object({
                    to: zod.string().describe('Target action id.'),
                    type: zod
                        .enum(['continue', 'branch'])
                        .describe('\* `continue` - continue\n\* `branch` - branch')
                        .describe(
                            "continue: fall-through (sequential or the no-match path of conditional_branch). branch: requires 'index' matching config.conditions[index].\n\n\* `continue` - continue\n\* `branch` - branch"
                        ),
                    index: zod
                        .number()
                        .optional()
                        .describe(
                            "Required for type='branch'. conditional_branch: index into config.conditions[index]. random_cohort_branch: index into config.cohorts[index]. wait_until_condition: use index:0 — it advances via the index:0 branch edge when it resolves (a condition match or an events entry firing)."
                        ),
                    from: zod.string().describe('Source action id.'),
                })
            )
            .optional()
            .describe(
                "Graph edges: [{from, to, type: 'continue'|'branch', index?}]. 'continue' = fall-through (sequential, or no-match path of conditional_branch). 'branch' requires 'index': matches config.conditions[index] on conditional_branch \/ wait_until_condition. Every non-exit action needs a reachable next action ('No next action found' otherwise)."
            ),
        actions: zod
            .array(
                zod.object({
                    id: zod
                        .string()
                        .max(flowsCreateBodyActionsItemIdMax)
                        .describe('Unique node ID within the workflow.'),
                    name: zod.string().max(flowsCreateBodyActionsItemNameMax).describe('Display name.'),
                    description: zod
                        .string()
                        .default(flowsCreateBodyActionsItemDescriptionDefault)
                        .describe('Optional description.'),
                    on_error: zod
                        .union([
                            zod.enum(['continue', 'abort']).describe('\* `continue` - continue\n\* `abort` - abort'),
                            zod.null(),
                        ])
                        .optional()
                        .describe(
                            'On failure: continue (skip the action and proceed) or abort (stop the run).\n\n\* `continue` - continue\n\* `abort` - abort'
                        ),
                    created_at: zod.number().optional().describe('Created at (epoch ms). Frontend-managed.'),
                    updated_at: zod.number().optional().describe('Updated at (epoch ms). Frontend-managed.'),
                    filters: zod
                        .union([
                            zod.object({
                                source: zod
                                    .enum(['events', 'person-updates', 'data-warehouse-table'])
                                    .describe(
                                        '\* `events` - events\n\* `person-updates` - person-updates\n\* `data-warehouse-table` - data-warehouse-table'
                                    )
                                    .default(flowsCreateBodyActionsItemFiltersOneSourceDefault),
                                actions: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                events: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                data_warehouse: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                properties: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                bytecode: zod.unknown().optional(),
                                transpiled: zod.unknown().optional(),
                                filter_test_accounts: zod.boolean().optional(),
                                bytecode_error: zod.string().optional(),
                            }),
                            zod.null(),
                        ])
                        .optional()
                        .describe('Property filters gating this action.'),
                    type: zod
                        .enum([
                            'trigger',
                            'function',
                            'function_email',
                            'function_sms',
                            'function_push',
                            'delay',
                            'wait_until_condition',
                            'wait_until_time_window',
                            'conditional_branch',
                            'random_cohort_branch',
                            'exit',
                        ])
                        .describe(
                            '\* `trigger` - trigger\n\* `function` - function\n\* `function_email` - function_email\n\* `function_sms` - function_sms\n\* `function_push` - function_push\n\* `delay` - delay\n\* `wait_until_condition` - wait_until_condition\n\* `wait_until_time_window` - wait_until_time_window\n\* `conditional_branch` - conditional_branch\n\* `random_cohort_branch` - random_cohort_branch\n\* `exit` - exit'
                        )
                        .describe(
                            'One of: trigger | function | function_email | function_sms | function_push | delay | wait_until_condition | wait_until_time_window | conditional_branch | random_cohort_branch | exit.\n\n\* `trigger` - trigger\n\* `function` - function\n\* `function_email` - function_email\n\* `function_sms` - function_sms\n\* `function_push` - function_push\n\* `delay` - delay\n\* `wait_until_condition` - wait_until_condition\n\* `wait_until_time_window` - wait_until_time_window\n\* `conditional_branch` - conditional_branch\n\* `random_cohort_branch` - random_cohort_branch\n\* `exit` - exit'
                        ),
                    config: zod
                        .union([
                            zod
                                .record(zod.string(), zod.unknown())
                                .describe(
                                    'Config for every action type except wait_until_condition — see the field description for per-type shapes.'
                                ),
                            zod
                                .object({
                                    condition: zod
                                        .object({
                                            filters: zod
                                                .union([
                                                    zod.object({
                                                        source: zod
                                                            .enum(['events', 'person-updates', 'data-warehouse-table'])
                                                            .describe(
                                                                '\* `events` - events\n\* `person-updates` - person-updates\n\* `data-warehouse-table` - data-warehouse-table'
                                                            )
                                                            .default(
                                                                flowsCreateBodyActionsItemConfigTwoConditionFiltersOneSourceDefault
                                                            ),
                                                        actions: zod
                                                            .array(zod.record(zod.string(), zod.unknown()))
                                                            .optional(),
                                                        events: zod
                                                            .array(zod.record(zod.string(), zod.unknown()))
                                                            .optional(),
                                                        data_warehouse: zod
                                                            .array(zod.record(zod.string(), zod.unknown()))
                                                            .optional(),
                                                        properties: zod
                                                            .array(zod.record(zod.string(), zod.unknown()))
                                                            .optional(),
                                                        bytecode: zod.unknown().optional(),
                                                        transpiled: zod.unknown().optional(),
                                                        filter_test_accounts: zod.boolean().optional(),
                                                        bytecode_error: zod.string().optional(),
                                                    }),
                                                    zod.null(),
                                                ])
                                                .optional()
                                                .describe(
                                                    'Property conditions, e.g. {properties: [{key, value, operator, type}]}.'
                                                ),
                                            name: zod.string().optional().describe('Optional display name.'),
                                        })
                                        .optional()
                                        .describe(
                                            "Property-based wait condition; continues when the person matches. A condition with no property filters is ignored — the wait then relies on 'events' and the max_wait_duration timeout."
                                        ),
                                    events: zod
                                        .array(
                                            zod.object({
                                                filters: zod
                                                    .union([
                                                        zod.object({
                                                            source: zod
                                                                .enum([
                                                                    'events',
                                                                    'person-updates',
                                                                    'data-warehouse-table',
                                                                ])
                                                                .describe(
                                                                    '\* `events` - events\n\* `person-updates` - person-updates\n\* `data-warehouse-table` - data-warehouse-table'
                                                                )
                                                                .default(
                                                                    flowsCreateBodyActionsItemConfigTwoEventsItemFiltersOneSourceDefault
                                                                ),
                                                            actions: zod
                                                                .array(zod.record(zod.string(), zod.unknown()))
                                                                .optional(),
                                                            events: zod
                                                                .array(zod.record(zod.string(), zod.unknown()))
                                                                .optional(),
                                                            data_warehouse: zod
                                                                .array(zod.record(zod.string(), zod.unknown()))
                                                                .optional(),
                                                            properties: zod
                                                                .array(zod.record(zod.string(), zod.unknown()))
                                                                .optional(),
                                                            bytecode: zod.unknown().optional(),
                                                            transpiled: zod.unknown().optional(),
                                                            filter_test_accounts: zod.boolean().optional(),
                                                            bytecode_error: zod.string().optional(),
                                                        }),
                                                        zod.null(),
                                                    ])
                                                    .optional()
                                                    .describe(
                                                        'Event\/action filters; the workflow wakes when a matching event fires. Must target at least one event or action (entries targeting neither are dropped).'
                                                    ),
                                                name: zod.string().optional().describe('Optional display name.'),
                                            })
                                        )
                                        .optional()
                                        .describe(
                                            "Events to wait for: continues when ANY entry fires (OR'd with 'condition'). Each entry: {filters: {events: [{id, name, type: 'events'}], actions?: [...]}, name?}."
                                        ),
                                    max_wait_duration: zod
                                        .string()
                                        .describe(
                                            "'<number><unit>' with unit m|h|d, e.g. '30m' (same rules as delay)."
                                        ),
                                })
                                .describe(
                                    "Config for type='wait_until_condition'. Provide 'condition' and\/or 'events' — an events-only wait (no condition) is valid."
                                ),
                        ])
                        .describe(
                            "Type-specific config keyed by action type. trigger: {type: event|webhook|manual|batch|schedule|tracking_pixel, filters?}. webhook and manual triggers also require template_id: 'template-source-webhook', and tracking_pixel requires template_id: 'template-source-webhook-pixel'. filters shape: {events: [{id, name, type:'events', properties:[<cond>]}], properties:[<cond>], actions:[...], filter_test_accounts:<bool>}. <cond>: {key, value, operator, type: event|person|group}, or {key: 'id', type: 'cohort', value: <cohort_id>, operator: 'in'} to reference a cohort. batch triggers may set filters.audience_type: 'persons' (default) or 'accounts'. An accounts audience fans out one run per customer analytics account and takes account filters instead: properties entries of type 'account_custom_property' (key = definition id), plus tag_names: [<str>], assigned_to_user_ids: [<int>], all_roles_unassigned: <bool>. function\*: {template_id, inputs: {<key>: {value: <str>}}}. Wrap values in {value:...} to enable script templating ({person.x}, {event.x}); flat strings won't interpolate. function_email also accepts tracking_enabled?: <bool> (default true) - when false, no open pixel is injected, links are not rewritten, and the send skips ESP-level open\/click tracking, so opens and clicks are not recorded for that step (delivery\/bounce\/unsubscribe still are). Dictionary input values are template strings too — write booleans\/numbers as single-expression templates ('{true}', '{42}'), which evaluate to the typed value. delay: {delay_duration: '<number><unit>'} where unit is m|h|d. Fractions OK ('0.5m'=30s; seconds unsupported). Per-unit max m<=60, h<=24, d<=30; values above are SILENTLY CLAMPED. Max 30d. conditional_branch: {conditions: [{filters}, ...]}. Index N matches the 'branch' edge with index:N. random_cohort_branch: {cohorts: [{percentage: <number>, name?}, ...]}. Index N matches the 'branch' edge with index:N; percentages are relative weights, so they should sum to 100 but a total above or below that still splits traffic in the given proportions. wait_until_condition: {condition: {filters}, events?: [{filters: {events: [{id, name, type: 'events'}], actions?: [...]}, name?}], max_wait_duration: <duration>} (same rules as delay). Continues when condition.filters match OR any events entry fires; each events entry must target at least one event or action. On resolution (a condition match or any events entry firing) it advances via the 'branch' edge with index:0; the max_wait_duration timeout falls through the 'continue' edge. exit: {reason}."
                        ),
                    output_variable: zod
                        .unknown()
                        .optional()
                        .describe(
                            'Output variable for downstream actions: {key, result_path?, spread?, label?} or a list of those.'
                        ),
                })
            )
            .describe("Ordered action nodes. Exactly one type='trigger' required. Typically one type='exit' too."),
        variables: zod
            .array(
                zod
                    .record(zod.string(), zod.string())
                    .describe('Variable: {key, type: string|number|boolean, default}.')
            )
            .optional()
            .describe('Workflow vars (key, type, default). Total <5KB.'),
    })
    .describe('Mixin for serializers to add user access control fields')

export const flowsUpdateBodyNameMax = 400

export const flowsUpdateBodyDescriptionDefault = ``
export const flowsUpdateBodyTriggerMaskingOneTtlMin = 60
export const flowsUpdateBodyTriggerMaskingOneTtlMax = 94608000

export const flowsUpdateBodyConversionOneEventsItemFiltersOneSourceDefault = `events`
export const flowsUpdateBodyActionsItemIdMax = 200

export const flowsUpdateBodyActionsItemNameMax = 400

export const flowsUpdateBodyActionsItemDescriptionDefault = ``
export const flowsUpdateBodyActionsItemFiltersOneSourceDefault = `events`
export const flowsUpdateBodyActionsItemConfigTwoConditionFiltersOneSourceDefault = `events`
export const flowsUpdateBodyActionsItemConfigTwoEventsItemFiltersOneSourceDefault = `events`

export const InsightsFlowsUpdateBody = /* @__PURE__ */ zod
    .object({
        name: zod.string().max(flowsUpdateBodyNameMax).nullish().describe('Workflow name.'),
        description: zod.string().default(flowsUpdateBodyDescriptionDefault).describe('Optional description.'),
        status: zod
            .enum(['draft', 'active', 'archived'])
            .describe('\* `draft` - Draft\n\* `active` - Active\n\* `archived` - Archived')
            .optional()
            .describe(
                'draft (no execution), active (live), archived (disabled).\n\n\* `draft` - Draft\n\* `active` - Active\n\* `archived` - Archived'
            ),
        trigger_masking: zod
            .union([
                zod.object({
                    ttl: zod
                        .number()
                        .min(flowsUpdateBodyTriggerMaskingOneTtlMin)
                        .max(flowsUpdateBodyTriggerMaskingOneTtlMax)
                        .nullish()
                        .describe('Seconds (60 to ~94M \/ 3y) to suppress repeat firings of the same hash.'),
                    threshold: zod
                        .number()
                        .nullish()
                        .describe(
                            'Fire once per N matches of the same hash within ttl — a sampler: N=3 fires on the 1st, 4th, 7th… match. Omit to fire on the first match, then suppress repeats within ttl.'
                        ),
                    hash: zod
                        .string()
                        .describe(
                            "InsightsQL template defining the dedup\/grouping key, e.g. '{person.id}' (once per person) within ttl."
                        ),
                    bytecode: zod.unknown().optional().describe('Auto-compiled from hash. Do not set.'),
                }),
                zod.null(),
            ])
            .optional()
            .describe(
                "Optional dedup\/throttle on an already-matched trigger: {hash: <InsightsQL template>, ttl: <seconds, 60-94608000>, threshold?: <int>}. Without threshold: fire once per hash, then suppress repeats within ttl (hash '{person.id}' = once per person per ttl). With threshold N: fire once per N matches of the same hash — a sampler, the 1st then every Nth. Throttles an already-qualifying trigger; it doesn't decide who enters. Server compiles bytecode from hash; omit to disable."
            ),
        conversion: zod
            .union([
                zod.object({
                    filters: zod
                        .array(zod.record(zod.string(), zod.unknown()))
                        .optional()
                        .describe(
                            "Property-based conversion conditions, as an ARRAY of property filters: [{key, value, operator, type: event|person|group}, ...]. Event-based goals do NOT go here — put them in 'events'. Empty array = any event within the window converts."
                        ),
                    events: zod
                        .array(
                            zod.object({
                                filters: zod
                                    .object({
                                        source: zod
                                            .enum(['events', 'person-updates', 'data-warehouse-table'])
                                            .describe(
                                                '\* `events` - events\n\* `person-updates` - person-updates\n\* `data-warehouse-table` - data-warehouse-table'
                                            )
                                            .default(flowsUpdateBodyConversionOneEventsItemFiltersOneSourceDefault),
                                        actions: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                        events: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                        data_warehouse: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                        properties: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                        bytecode: zod.unknown().optional(),
                                        transpiled: zod.unknown().optional(),
                                        filter_test_accounts: zod.boolean().optional(),
                                        bytecode_error: zod.string().optional(),
                                    })
                                    .describe(
                                        "Event\/action filters for this conversion event, same shape as trigger filters: {events: [{id, name, type: 'events', properties?: [<cond>]}], actions?: [...], properties?: [<cond>]}. bytecode is compiled server-side."
                                    ),
                            })
                        )
                        .optional()
                        .describe(
                            "Event-based conversion goals: [{filters: {events: [{id, name, type: 'events'}], ...}}]."
                        ),
                    window_minutes: zod
                        .number()
                        .nullish()
                        .describe(
                            'Conversion window in minutes after a person enters the workflow. null = no explicit window.'
                        ),
                    bytecode: zod
                        .unknown()
                        .optional()
                        .describe("Compiled server-side from 'filters'. Do not set; ignored if sent."),
                }),
                zod.null(),
            ])
            .optional()
            .describe(
                'Conversion goal. filters: ARRAY of property conditions [{key, value, operator, type: event|person|group}]; events: event-based goals [{filters: {events: [...]}}]; window_minutes: minutes after entry. Required for exit_on_conversion \/ exit_on_trigger_not_matched_or_conversion. bytecode compiled server-side.'
            ),
        exit_condition: zod
            .enum([
                'exit_on_conversion',
                'exit_on_trigger_not_matched',
                'exit_on_trigger_not_matched_or_conversion',
                'exit_only_at_end',
            ])
            .describe(
                '\* `exit_on_conversion` - Conversion\n\* `exit_on_trigger_not_matched` - Trigger Not Matched\n\* `exit_on_trigger_not_matched_or_conversion` - Trigger Not Matched Or Conversion\n\* `exit_only_at_end` - Only At End'
            )
            .optional()
            .describe(
                "exit_only_at_end: only at exit node (default). exit_on_conversion: also on conversion (needs 'conversion'; silent no-op otherwise). exit_on_trigger_not_matched: also when trigger filter stops matching. exit_on_trigger_not_matched_or_conversion: both (needs 'conversion').\n\n\* `exit_on_conversion` - Conversion\n\* `exit_on_trigger_not_matched` - Trigger Not Matched\n\* `exit_on_trigger_not_matched_or_conversion` - Trigger Not Matched Or Conversion\n\* `exit_only_at_end` - Only At End"
            ),
        edges: zod
            .array(
                zod.object({
                    to: zod.string().describe('Target action id.'),
                    type: zod
                        .enum(['continue', 'branch'])
                        .describe('\* `continue` - continue\n\* `branch` - branch')
                        .describe(
                            "continue: fall-through (sequential or the no-match path of conditional_branch). branch: requires 'index' matching config.conditions[index].\n\n\* `continue` - continue\n\* `branch` - branch"
                        ),
                    index: zod
                        .number()
                        .optional()
                        .describe(
                            "Required for type='branch'. conditional_branch: index into config.conditions[index]. random_cohort_branch: index into config.cohorts[index]. wait_until_condition: use index:0 — it advances via the index:0 branch edge when it resolves (a condition match or an events entry firing)."
                        ),
                    from: zod.string().describe('Source action id.'),
                })
            )
            .optional()
            .describe(
                "Graph edges: [{from, to, type: 'continue'|'branch', index?}]. 'continue' = fall-through (sequential, or no-match path of conditional_branch). 'branch' requires 'index': matches config.conditions[index] on conditional_branch \/ wait_until_condition. Every non-exit action needs a reachable next action ('No next action found' otherwise)."
            ),
        actions: zod
            .array(
                zod.object({
                    id: zod
                        .string()
                        .max(flowsUpdateBodyActionsItemIdMax)
                        .describe('Unique node ID within the workflow.'),
                    name: zod.string().max(flowsUpdateBodyActionsItemNameMax).describe('Display name.'),
                    description: zod
                        .string()
                        .default(flowsUpdateBodyActionsItemDescriptionDefault)
                        .describe('Optional description.'),
                    on_error: zod
                        .union([
                            zod.enum(['continue', 'abort']).describe('\* `continue` - continue\n\* `abort` - abort'),
                            zod.null(),
                        ])
                        .optional()
                        .describe(
                            'On failure: continue (skip the action and proceed) or abort (stop the run).\n\n\* `continue` - continue\n\* `abort` - abort'
                        ),
                    created_at: zod.number().optional().describe('Created at (epoch ms). Frontend-managed.'),
                    updated_at: zod.number().optional().describe('Updated at (epoch ms). Frontend-managed.'),
                    filters: zod
                        .union([
                            zod.object({
                                source: zod
                                    .enum(['events', 'person-updates', 'data-warehouse-table'])
                                    .describe(
                                        '\* `events` - events\n\* `person-updates` - person-updates\n\* `data-warehouse-table` - data-warehouse-table'
                                    )
                                    .default(flowsUpdateBodyActionsItemFiltersOneSourceDefault),
                                actions: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                events: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                data_warehouse: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                properties: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                bytecode: zod.unknown().optional(),
                                transpiled: zod.unknown().optional(),
                                filter_test_accounts: zod.boolean().optional(),
                                bytecode_error: zod.string().optional(),
                            }),
                            zod.null(),
                        ])
                        .optional()
                        .describe('Property filters gating this action.'),
                    type: zod
                        .enum([
                            'trigger',
                            'function',
                            'function_email',
                            'function_sms',
                            'function_push',
                            'delay',
                            'wait_until_condition',
                            'wait_until_time_window',
                            'conditional_branch',
                            'random_cohort_branch',
                            'exit',
                        ])
                        .describe(
                            '\* `trigger` - trigger\n\* `function` - function\n\* `function_email` - function_email\n\* `function_sms` - function_sms\n\* `function_push` - function_push\n\* `delay` - delay\n\* `wait_until_condition` - wait_until_condition\n\* `wait_until_time_window` - wait_until_time_window\n\* `conditional_branch` - conditional_branch\n\* `random_cohort_branch` - random_cohort_branch\n\* `exit` - exit'
                        )
                        .describe(
                            'One of: trigger | function | function_email | function_sms | function_push | delay | wait_until_condition | wait_until_time_window | conditional_branch | random_cohort_branch | exit.\n\n\* `trigger` - trigger\n\* `function` - function\n\* `function_email` - function_email\n\* `function_sms` - function_sms\n\* `function_push` - function_push\n\* `delay` - delay\n\* `wait_until_condition` - wait_until_condition\n\* `wait_until_time_window` - wait_until_time_window\n\* `conditional_branch` - conditional_branch\n\* `random_cohort_branch` - random_cohort_branch\n\* `exit` - exit'
                        ),
                    config: zod
                        .union([
                            zod
                                .record(zod.string(), zod.unknown())
                                .describe(
                                    'Config for every action type except wait_until_condition — see the field description for per-type shapes.'
                                ),
                            zod
                                .object({
                                    condition: zod
                                        .object({
                                            filters: zod
                                                .union([
                                                    zod.object({
                                                        source: zod
                                                            .enum(['events', 'person-updates', 'data-warehouse-table'])
                                                            .describe(
                                                                '\* `events` - events\n\* `person-updates` - person-updates\n\* `data-warehouse-table` - data-warehouse-table'
                                                            )
                                                            .default(
                                                                flowsUpdateBodyActionsItemConfigTwoConditionFiltersOneSourceDefault
                                                            ),
                                                        actions: zod
                                                            .array(zod.record(zod.string(), zod.unknown()))
                                                            .optional(),
                                                        events: zod
                                                            .array(zod.record(zod.string(), zod.unknown()))
                                                            .optional(),
                                                        data_warehouse: zod
                                                            .array(zod.record(zod.string(), zod.unknown()))
                                                            .optional(),
                                                        properties: zod
                                                            .array(zod.record(zod.string(), zod.unknown()))
                                                            .optional(),
                                                        bytecode: zod.unknown().optional(),
                                                        transpiled: zod.unknown().optional(),
                                                        filter_test_accounts: zod.boolean().optional(),
                                                        bytecode_error: zod.string().optional(),
                                                    }),
                                                    zod.null(),
                                                ])
                                                .optional()
                                                .describe(
                                                    'Property conditions, e.g. {properties: [{key, value, operator, type}]}.'
                                                ),
                                            name: zod.string().optional().describe('Optional display name.'),
                                        })
                                        .optional()
                                        .describe(
                                            "Property-based wait condition; continues when the person matches. A condition with no property filters is ignored — the wait then relies on 'events' and the max_wait_duration timeout."
                                        ),
                                    events: zod
                                        .array(
                                            zod.object({
                                                filters: zod
                                                    .union([
                                                        zod.object({
                                                            source: zod
                                                                .enum([
                                                                    'events',
                                                                    'person-updates',
                                                                    'data-warehouse-table',
                                                                ])
                                                                .describe(
                                                                    '\* `events` - events\n\* `person-updates` - person-updates\n\* `data-warehouse-table` - data-warehouse-table'
                                                                )
                                                                .default(
                                                                    flowsUpdateBodyActionsItemConfigTwoEventsItemFiltersOneSourceDefault
                                                                ),
                                                            actions: zod
                                                                .array(zod.record(zod.string(), zod.unknown()))
                                                                .optional(),
                                                            events: zod
                                                                .array(zod.record(zod.string(), zod.unknown()))
                                                                .optional(),
                                                            data_warehouse: zod
                                                                .array(zod.record(zod.string(), zod.unknown()))
                                                                .optional(),
                                                            properties: zod
                                                                .array(zod.record(zod.string(), zod.unknown()))
                                                                .optional(),
                                                            bytecode: zod.unknown().optional(),
                                                            transpiled: zod.unknown().optional(),
                                                            filter_test_accounts: zod.boolean().optional(),
                                                            bytecode_error: zod.string().optional(),
                                                        }),
                                                        zod.null(),
                                                    ])
                                                    .optional()
                                                    .describe(
                                                        'Event\/action filters; the workflow wakes when a matching event fires. Must target at least one event or action (entries targeting neither are dropped).'
                                                    ),
                                                name: zod.string().optional().describe('Optional display name.'),
                                            })
                                        )
                                        .optional()
                                        .describe(
                                            "Events to wait for: continues when ANY entry fires (OR'd with 'condition'). Each entry: {filters: {events: [{id, name, type: 'events'}], actions?: [...]}, name?}."
                                        ),
                                    max_wait_duration: zod
                                        .string()
                                        .describe(
                                            "'<number><unit>' with unit m|h|d, e.g. '30m' (same rules as delay)."
                                        ),
                                })
                                .describe(
                                    "Config for type='wait_until_condition'. Provide 'condition' and\/or 'events' — an events-only wait (no condition) is valid."
                                ),
                        ])
                        .describe(
                            "Type-specific config keyed by action type. trigger: {type: event|webhook|manual|batch|schedule|tracking_pixel, filters?}. webhook and manual triggers also require template_id: 'template-source-webhook', and tracking_pixel requires template_id: 'template-source-webhook-pixel'. filters shape: {events: [{id, name, type:'events', properties:[<cond>]}], properties:[<cond>], actions:[...], filter_test_accounts:<bool>}. <cond>: {key, value, operator, type: event|person|group}, or {key: 'id', type: 'cohort', value: <cohort_id>, operator: 'in'} to reference a cohort. batch triggers may set filters.audience_type: 'persons' (default) or 'accounts'. An accounts audience fans out one run per customer analytics account and takes account filters instead: properties entries of type 'account_custom_property' (key = definition id), plus tag_names: [<str>], assigned_to_user_ids: [<int>], all_roles_unassigned: <bool>. function\*: {template_id, inputs: {<key>: {value: <str>}}}. Wrap values in {value:...} to enable script templating ({person.x}, {event.x}); flat strings won't interpolate. function_email also accepts tracking_enabled?: <bool> (default true) - when false, no open pixel is injected, links are not rewritten, and the send skips ESP-level open\/click tracking, so opens and clicks are not recorded for that step (delivery\/bounce\/unsubscribe still are). Dictionary input values are template strings too — write booleans\/numbers as single-expression templates ('{true}', '{42}'), which evaluate to the typed value. delay: {delay_duration: '<number><unit>'} where unit is m|h|d. Fractions OK ('0.5m'=30s; seconds unsupported). Per-unit max m<=60, h<=24, d<=30; values above are SILENTLY CLAMPED. Max 30d. conditional_branch: {conditions: [{filters}, ...]}. Index N matches the 'branch' edge with index:N. random_cohort_branch: {cohorts: [{percentage: <number>, name?}, ...]}. Index N matches the 'branch' edge with index:N; percentages are relative weights, so they should sum to 100 but a total above or below that still splits traffic in the given proportions. wait_until_condition: {condition: {filters}, events?: [{filters: {events: [{id, name, type: 'events'}], actions?: [...]}, name?}], max_wait_duration: <duration>} (same rules as delay). Continues when condition.filters match OR any events entry fires; each events entry must target at least one event or action. On resolution (a condition match or any events entry firing) it advances via the 'branch' edge with index:0; the max_wait_duration timeout falls through the 'continue' edge. exit: {reason}."
                        ),
                    output_variable: zod
                        .unknown()
                        .optional()
                        .describe(
                            'Output variable for downstream actions: {key, result_path?, spread?, label?} or a list of those.'
                        ),
                })
            )
            .describe("Ordered action nodes. Exactly one type='trigger' required. Typically one type='exit' too."),
        variables: zod
            .array(
                zod
                    .record(zod.string(), zod.string())
                    .describe('Variable: {key, type: string|number|boolean, default}.')
            )
            .optional()
            .describe('Workflow vars (key, type, default). Total <5KB.'),
    })
    .describe('Mixin for serializers to add user access control fields')

export const flowsPartialUpdateBodyNameMax = 400

export const flowsPartialUpdateBodyDescriptionDefault = ``
export const flowsPartialUpdateBodyTriggerMaskingOneTtlMin = 60
export const flowsPartialUpdateBodyTriggerMaskingOneTtlMax = 94608000

export const flowsPartialUpdateBodyConversionOneEventsItemFiltersOneSourceDefault = `events`
export const flowsPartialUpdateBodyActionsItemIdMax = 200

export const flowsPartialUpdateBodyActionsItemNameMax = 400

export const flowsPartialUpdateBodyActionsItemDescriptionDefault = ``
export const flowsPartialUpdateBodyActionsItemFiltersOneSourceDefault = `events`
export const flowsPartialUpdateBodyActionsItemConfigTwoConditionFiltersOneSourceDefault = `events`
export const flowsPartialUpdateBodyActionsItemConfigTwoEventsItemFiltersOneSourceDefault = `events`

export const InsightsFlowsPartialUpdateBody = /* @__PURE__ */ zod
    .object({
        name: zod.string().max(flowsPartialUpdateBodyNameMax).nullish().describe('Workflow name.'),
        description: zod
            .string()
            .default(flowsPartialUpdateBodyDescriptionDefault)
            .describe('Optional description.'),
        status: zod
            .enum(['draft', 'active', 'archived'])
            .describe('\* `draft` - Draft\n\* `active` - Active\n\* `archived` - Archived')
            .optional()
            .describe(
                'draft (no execution), active (live), archived (disabled).\n\n\* `draft` - Draft\n\* `active` - Active\n\* `archived` - Archived'
            ),
        trigger_masking: zod
            .union([
                zod.object({
                    ttl: zod
                        .number()
                        .min(flowsPartialUpdateBodyTriggerMaskingOneTtlMin)
                        .max(flowsPartialUpdateBodyTriggerMaskingOneTtlMax)
                        .nullish()
                        .describe('Seconds (60 to ~94M \/ 3y) to suppress repeat firings of the same hash.'),
                    threshold: zod
                        .number()
                        .nullish()
                        .describe(
                            'Fire once per N matches of the same hash within ttl — a sampler: N=3 fires on the 1st, 4th, 7th… match. Omit to fire on the first match, then suppress repeats within ttl.'
                        ),
                    hash: zod
                        .string()
                        .describe(
                            "InsightsQL template defining the dedup\/grouping key, e.g. '{person.id}' (once per person) within ttl."
                        ),
                    bytecode: zod.unknown().optional().describe('Auto-compiled from hash. Do not set.'),
                }),
                zod.null(),
            ])
            .optional()
            .describe(
                "Optional dedup\/throttle on an already-matched trigger: {hash: <InsightsQL template>, ttl: <seconds, 60-94608000>, threshold?: <int>}. Without threshold: fire once per hash, then suppress repeats within ttl (hash '{person.id}' = once per person per ttl). With threshold N: fire once per N matches of the same hash — a sampler, the 1st then every Nth. Throttles an already-qualifying trigger; it doesn't decide who enters. Server compiles bytecode from hash; omit to disable."
            ),
        conversion: zod
            .union([
                zod.object({
                    filters: zod
                        .array(zod.record(zod.string(), zod.unknown()))
                        .optional()
                        .describe(
                            "Property-based conversion conditions, as an ARRAY of property filters: [{key, value, operator, type: event|person|group}, ...]. Event-based goals do NOT go here — put them in 'events'. Empty array = any event within the window converts."
                        ),
                    events: zod
                        .array(
                            zod.object({
                                filters: zod
                                    .object({
                                        source: zod
                                            .enum(['events', 'person-updates', 'data-warehouse-table'])
                                            .describe(
                                                '\* `events` - events\n\* `person-updates` - person-updates\n\* `data-warehouse-table` - data-warehouse-table'
                                            )
                                            .default(
                                                flowsPartialUpdateBodyConversionOneEventsItemFiltersOneSourceDefault
                                            ),
                                        actions: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                        events: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                        data_warehouse: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                        properties: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                        bytecode: zod.unknown().optional(),
                                        transpiled: zod.unknown().optional(),
                                        filter_test_accounts: zod.boolean().optional(),
                                        bytecode_error: zod.string().optional(),
                                    })
                                    .describe(
                                        "Event\/action filters for this conversion event, same shape as trigger filters: {events: [{id, name, type: 'events', properties?: [<cond>]}], actions?: [...], properties?: [<cond>]}. bytecode is compiled server-side."
                                    ),
                            })
                        )
                        .optional()
                        .describe(
                            "Event-based conversion goals: [{filters: {events: [{id, name, type: 'events'}], ...}}]."
                        ),
                    window_minutes: zod
                        .number()
                        .nullish()
                        .describe(
                            'Conversion window in minutes after a person enters the workflow. null = no explicit window.'
                        ),
                    bytecode: zod
                        .unknown()
                        .optional()
                        .describe("Compiled server-side from 'filters'. Do not set; ignored if sent."),
                }),
                zod.null(),
            ])
            .optional()
            .describe(
                'Conversion goal. filters: ARRAY of property conditions [{key, value, operator, type: event|person|group}]; events: event-based goals [{filters: {events: [...]}}]; window_minutes: minutes after entry. Required for exit_on_conversion \/ exit_on_trigger_not_matched_or_conversion. bytecode compiled server-side.'
            ),
        exit_condition: zod
            .enum([
                'exit_on_conversion',
                'exit_on_trigger_not_matched',
                'exit_on_trigger_not_matched_or_conversion',
                'exit_only_at_end',
            ])
            .describe(
                '\* `exit_on_conversion` - Conversion\n\* `exit_on_trigger_not_matched` - Trigger Not Matched\n\* `exit_on_trigger_not_matched_or_conversion` - Trigger Not Matched Or Conversion\n\* `exit_only_at_end` - Only At End'
            )
            .optional()
            .describe(
                "exit_only_at_end: only at exit node (default). exit_on_conversion: also on conversion (needs 'conversion'; silent no-op otherwise). exit_on_trigger_not_matched: also when trigger filter stops matching. exit_on_trigger_not_matched_or_conversion: both (needs 'conversion').\n\n\* `exit_on_conversion` - Conversion\n\* `exit_on_trigger_not_matched` - Trigger Not Matched\n\* `exit_on_trigger_not_matched_or_conversion` - Trigger Not Matched Or Conversion\n\* `exit_only_at_end` - Only At End"
            ),
        edges: zod
            .array(
                zod.object({
                    to: zod.string().describe('Target action id.'),
                    type: zod
                        .enum(['continue', 'branch'])
                        .describe('\* `continue` - continue\n\* `branch` - branch')
                        .describe(
                            "continue: fall-through (sequential or the no-match path of conditional_branch). branch: requires 'index' matching config.conditions[index].\n\n\* `continue` - continue\n\* `branch` - branch"
                        ),
                    index: zod
                        .number()
                        .optional()
                        .describe(
                            "Required for type='branch'. conditional_branch: index into config.conditions[index]. random_cohort_branch: index into config.cohorts[index]. wait_until_condition: use index:0 — it advances via the index:0 branch edge when it resolves (a condition match or an events entry firing)."
                        ),
                    from: zod.string().describe('Source action id.'),
                })
            )
            .optional()
            .describe(
                "Graph edges: [{from, to, type: 'continue'|'branch', index?}]. 'continue' = fall-through (sequential, or no-match path of conditional_branch). 'branch' requires 'index': matches config.conditions[index] on conditional_branch \/ wait_until_condition. Every non-exit action needs a reachable next action ('No next action found' otherwise)."
            ),
        actions: zod
            .array(
                zod.object({
                    id: zod
                        .string()
                        .max(flowsPartialUpdateBodyActionsItemIdMax)
                        .describe('Unique node ID within the workflow.'),
                    name: zod.string().max(flowsPartialUpdateBodyActionsItemNameMax).describe('Display name.'),
                    description: zod
                        .string()
                        .default(flowsPartialUpdateBodyActionsItemDescriptionDefault)
                        .describe('Optional description.'),
                    on_error: zod
                        .union([
                            zod.enum(['continue', 'abort']).describe('\* `continue` - continue\n\* `abort` - abort'),
                            zod.null(),
                        ])
                        .optional()
                        .describe(
                            'On failure: continue (skip the action and proceed) or abort (stop the run).\n\n\* `continue` - continue\n\* `abort` - abort'
                        ),
                    created_at: zod.number().optional().describe('Created at (epoch ms). Frontend-managed.'),
                    updated_at: zod.number().optional().describe('Updated at (epoch ms). Frontend-managed.'),
                    filters: zod
                        .union([
                            zod.object({
                                source: zod
                                    .enum(['events', 'person-updates', 'data-warehouse-table'])
                                    .describe(
                                        '\* `events` - events\n\* `person-updates` - person-updates\n\* `data-warehouse-table` - data-warehouse-table'
                                    )
                                    .default(flowsPartialUpdateBodyActionsItemFiltersOneSourceDefault),
                                actions: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                events: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                data_warehouse: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                properties: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                bytecode: zod.unknown().optional(),
                                transpiled: zod.unknown().optional(),
                                filter_test_accounts: zod.boolean().optional(),
                                bytecode_error: zod.string().optional(),
                            }),
                            zod.null(),
                        ])
                        .optional()
                        .describe('Property filters gating this action.'),
                    type: zod
                        .enum([
                            'trigger',
                            'function',
                            'function_email',
                            'function_sms',
                            'function_push',
                            'delay',
                            'wait_until_condition',
                            'wait_until_time_window',
                            'conditional_branch',
                            'random_cohort_branch',
                            'exit',
                        ])
                        .describe(
                            '\* `trigger` - trigger\n\* `function` - function\n\* `function_email` - function_email\n\* `function_sms` - function_sms\n\* `function_push` - function_push\n\* `delay` - delay\n\* `wait_until_condition` - wait_until_condition\n\* `wait_until_time_window` - wait_until_time_window\n\* `conditional_branch` - conditional_branch\n\* `random_cohort_branch` - random_cohort_branch\n\* `exit` - exit'
                        )
                        .describe(
                            'One of: trigger | function | function_email | function_sms | function_push | delay | wait_until_condition | wait_until_time_window | conditional_branch | random_cohort_branch | exit.\n\n\* `trigger` - trigger\n\* `function` - function\n\* `function_email` - function_email\n\* `function_sms` - function_sms\n\* `function_push` - function_push\n\* `delay` - delay\n\* `wait_until_condition` - wait_until_condition\n\* `wait_until_time_window` - wait_until_time_window\n\* `conditional_branch` - conditional_branch\n\* `random_cohort_branch` - random_cohort_branch\n\* `exit` - exit'
                        ),
                    config: zod
                        .union([
                            zod
                                .record(zod.string(), zod.unknown())
                                .describe(
                                    'Config for every action type except wait_until_condition — see the field description for per-type shapes.'
                                ),
                            zod
                                .object({
                                    condition: zod
                                        .object({
                                            filters: zod
                                                .union([
                                                    zod.object({
                                                        source: zod
                                                            .enum(['events', 'person-updates', 'data-warehouse-table'])
                                                            .describe(
                                                                '\* `events` - events\n\* `person-updates` - person-updates\n\* `data-warehouse-table` - data-warehouse-table'
                                                            )
                                                            .default(
                                                                flowsPartialUpdateBodyActionsItemConfigTwoConditionFiltersOneSourceDefault
                                                            ),
                                                        actions: zod
                                                            .array(zod.record(zod.string(), zod.unknown()))
                                                            .optional(),
                                                        events: zod
                                                            .array(zod.record(zod.string(), zod.unknown()))
                                                            .optional(),
                                                        data_warehouse: zod
                                                            .array(zod.record(zod.string(), zod.unknown()))
                                                            .optional(),
                                                        properties: zod
                                                            .array(zod.record(zod.string(), zod.unknown()))
                                                            .optional(),
                                                        bytecode: zod.unknown().optional(),
                                                        transpiled: zod.unknown().optional(),
                                                        filter_test_accounts: zod.boolean().optional(),
                                                        bytecode_error: zod.string().optional(),
                                                    }),
                                                    zod.null(),
                                                ])
                                                .optional()
                                                .describe(
                                                    'Property conditions, e.g. {properties: [{key, value, operator, type}]}.'
                                                ),
                                            name: zod.string().optional().describe('Optional display name.'),
                                        })
                                        .optional()
                                        .describe(
                                            "Property-based wait condition; continues when the person matches. A condition with no property filters is ignored — the wait then relies on 'events' and the max_wait_duration timeout."
                                        ),
                                    events: zod
                                        .array(
                                            zod.object({
                                                filters: zod
                                                    .union([
                                                        zod.object({
                                                            source: zod
                                                                .enum([
                                                                    'events',
                                                                    'person-updates',
                                                                    'data-warehouse-table',
                                                                ])
                                                                .describe(
                                                                    '\* `events` - events\n\* `person-updates` - person-updates\n\* `data-warehouse-table` - data-warehouse-table'
                                                                )
                                                                .default(
                                                                    flowsPartialUpdateBodyActionsItemConfigTwoEventsItemFiltersOneSourceDefault
                                                                ),
                                                            actions: zod
                                                                .array(zod.record(zod.string(), zod.unknown()))
                                                                .optional(),
                                                            events: zod
                                                                .array(zod.record(zod.string(), zod.unknown()))
                                                                .optional(),
                                                            data_warehouse: zod
                                                                .array(zod.record(zod.string(), zod.unknown()))
                                                                .optional(),
                                                            properties: zod
                                                                .array(zod.record(zod.string(), zod.unknown()))
                                                                .optional(),
                                                            bytecode: zod.unknown().optional(),
                                                            transpiled: zod.unknown().optional(),
                                                            filter_test_accounts: zod.boolean().optional(),
                                                            bytecode_error: zod.string().optional(),
                                                        }),
                                                        zod.null(),
                                                    ])
                                                    .optional()
                                                    .describe(
                                                        'Event\/action filters; the workflow wakes when a matching event fires. Must target at least one event or action (entries targeting neither are dropped).'
                                                    ),
                                                name: zod.string().optional().describe('Optional display name.'),
                                            })
                                        )
                                        .optional()
                                        .describe(
                                            "Events to wait for: continues when ANY entry fires (OR'd with 'condition'). Each entry: {filters: {events: [{id, name, type: 'events'}], actions?: [...]}, name?}."
                                        ),
                                    max_wait_duration: zod
                                        .string()
                                        .describe(
                                            "'<number><unit>' with unit m|h|d, e.g. '30m' (same rules as delay)."
                                        ),
                                })
                                .describe(
                                    "Config for type='wait_until_condition'. Provide 'condition' and\/or 'events' — an events-only wait (no condition) is valid."
                                ),
                        ])
                        .describe(
                            "Type-specific config keyed by action type. trigger: {type: event|webhook|manual|batch|schedule|tracking_pixel, filters?}. webhook and manual triggers also require template_id: 'template-source-webhook', and tracking_pixel requires template_id: 'template-source-webhook-pixel'. filters shape: {events: [{id, name, type:'events', properties:[<cond>]}], properties:[<cond>], actions:[...], filter_test_accounts:<bool>}. <cond>: {key, value, operator, type: event|person|group}, or {key: 'id', type: 'cohort', value: <cohort_id>, operator: 'in'} to reference a cohort. batch triggers may set filters.audience_type: 'persons' (default) or 'accounts'. An accounts audience fans out one run per customer analytics account and takes account filters instead: properties entries of type 'account_custom_property' (key = definition id), plus tag_names: [<str>], assigned_to_user_ids: [<int>], all_roles_unassigned: <bool>. function\*: {template_id, inputs: {<key>: {value: <str>}}}. Wrap values in {value:...} to enable script templating ({person.x}, {event.x}); flat strings won't interpolate. function_email also accepts tracking_enabled?: <bool> (default true) - when false, no open pixel is injected, links are not rewritten, and the send skips ESP-level open\/click tracking, so opens and clicks are not recorded for that step (delivery\/bounce\/unsubscribe still are). Dictionary input values are template strings too — write booleans\/numbers as single-expression templates ('{true}', '{42}'), which evaluate to the typed value. delay: {delay_duration: '<number><unit>'} where unit is m|h|d. Fractions OK ('0.5m'=30s; seconds unsupported). Per-unit max m<=60, h<=24, d<=30; values above are SILENTLY CLAMPED. Max 30d. conditional_branch: {conditions: [{filters}, ...]}. Index N matches the 'branch' edge with index:N. random_cohort_branch: {cohorts: [{percentage: <number>, name?}, ...]}. Index N matches the 'branch' edge with index:N; percentages are relative weights, so they should sum to 100 but a total above or below that still splits traffic in the given proportions. wait_until_condition: {condition: {filters}, events?: [{filters: {events: [{id, name, type: 'events'}], actions?: [...]}, name?}], max_wait_duration: <duration>} (same rules as delay). Continues when condition.filters match OR any events entry fires; each events entry must target at least one event or action. On resolution (a condition match or any events entry firing) it advances via the 'branch' edge with index:0; the max_wait_duration timeout falls through the 'continue' edge. exit: {reason}."
                        ),
                    output_variable: zod
                        .unknown()
                        .optional()
                        .describe(
                            'Output variable for downstream actions: {key, result_path?, spread?, label?} or a list of those.'
                        ),
                })
            )
            .optional()
            .describe("Ordered action nodes. Exactly one type='trigger' required. Typically one type='exit' too."),
        variables: zod
            .array(
                zod
                    .record(zod.string(), zod.string())
                    .describe('Variable: {key, type: string|number|boolean, default}.')
            )
            .optional()
            .describe('Workflow vars (key, type, default). Total <5KB.'),
    })
    .describe('Mixin for serializers to add user access control fields')

export const InsightsFlowsActionsEmailPartialUpdateBody = /* @__PURE__ */ zod.object({
    base_updated_at: zod.iso
        .datetime({ offset: true })
        .optional()
        .describe(
            'Optimistic concurrency: the updated_at (or draft_updated_at) last loaded. If the stored workflow is newer, the patch is rejected with 409 instead of clobbering a concurrent edit.'
        ),
    operations: zod
        .array(
            zod.object({
                op: zod
                    .enum([
                        'update_content',
                        'update_column',
                        'update_row',
                        'update_body',
                        'add_content',
                        'remove_content',
                        'move_content',
                        'add_row',
                        'remove_row',
                    ])
                    .describe(
                        '\* `update_content` - update_content\n\* `update_column` - update_column\n\* `update_row` - update_row\n\* `update_body` - update_body\n\* `add_content` - add_content\n\* `remove_content` - remove_content\n\* `move_content` - move_content\n\* `add_row` - add_row\n\* `remove_row` - remove_row'
                    )
                    .describe(
                        "Design edit. update_content {id, patch}: deep-merge patch into the content block's fields (a null leaf deletes that key) — the surgical path, e.g. change just values.text. update_row \/ update_column {id, patch} and update_body {patch}: same deep-merge for row\/column\/body-level settings. add_content {column_id, content, index?}: insert a content block into a column (id and Unlayer numbering are filled in for you). remove_content {id} \/ move_content {id, column_id, index?}: delete or relocate a block. add_row {row, index?} \/ remove_row {id}: add or delete a row.\n\n\* `update_content` - update_content\n\* `update_column` - update_column\n\* `update_row` - update_row\n\* `update_body` - update_body\n\* `add_content` - add_content\n\* `remove_content` - remove_content\n\* `move_content` - move_content\n\* `add_row` - add_row\n\* `remove_row` - remove_row"
                    ),
                id: zod
                    .string()
                    .optional()
                    .describe(
                        'Target node id. Required for update_content\/column\/row, remove_content, remove_row, move_content.'
                    ),
                column_id: zod
                    .string()
                    .optional()
                    .describe('Target column id. Required for add_content and move_content.'),
                patch: zod
                    .unknown()
                    .optional()
                    .describe(
                        "update_\* only. Partial fields deep-merged into the existing node; a null leaf deletes that key. e.g. {values: {text: '<p>Hi<\/p>'}} changes only the block's text."
                    ),
                content: zod
                    .unknown()
                    .optional()
                    .describe(
                        "add_content only. A content block {type, values: {...}}; omit id and values._meta — they're assigned server-side. type is one of text, heading, button, image, divider, html, etc."
                    ),
                row: zod
                    .unknown()
                    .optional()
                    .describe(
                        'add_row only. A full row {cells, columns: [{contents: [...], values}], values}; ids and Unlayer numbering are assigned server-side for the row and everything nested in it.'
                    ),
                index: zod
                    .number()
                    .optional()
                    .describe('add_\*\/move_content only. 0-based insert position; omit to append to the end.'),
            })
        )
        .optional()
        .describe(
            "Ordered design edits applied atomically to this step's email design - the same operations as the email template patch. The result is re-rendered to HTML server-side, so the sent email always matches the patched design."
        ),
    email_patch: zod
        .unknown()
        .optional()
        .describe(
            "Partial email fields deep-merged into the step's email (a null leaf deletes the key): subject, preheader, text, to, from, replyTo, cc, bcc. The design is edited via operations, and html is always re-rendered from it."
        ),
})

export const InsightsFlowsBatchJobsCreateBody = /* @__PURE__ */ zod.object({
    status: zod
        .enum(['waiting', 'queued', 'active', 'completed', 'cancelled', 'failed'])
        .describe(
            '\* `waiting` - Waiting\n\* `queued` - Queued\n\* `active` - Active\n\* `completed` - Completed\n\* `cancelled` - Cancelled\n\* `failed` - Failed'
        )
        .optional()
        .describe(
            'Not currently tracked — stays at its initial value. Use the workflow logs\/metrics endpoints for run outcome.\n\n\* `waiting` - Waiting\n\* `queued` - Queued\n\* `active` - Active\n\* `completed` - Completed\n\* `cancelled` - Cancelled\n\* `failed` - Failed'
        ),
    script_flow: zod.uuid().describe('ID of the workflow this batch run belongs to.'),
    variables: zod.unknown().optional().describe('Variable value overrides applied to this run.'),
})

export const InsightsFlowsGraphPartialUpdateBody = /* @__PURE__ */ zod.object({
    base_updated_at: zod.iso
        .datetime({ offset: true })
        .optional()
        .describe(
            'Optimistic concurrency: the updated_at (or draft_updated_at) last loaded. If the stored graph is newer, the patch is rejected with 409 instead of clobbering a concurrent edit.'
        ),
    operations: zod
        .array(
            zod.object({
                op: zod
                    .enum([
                        'update_action',
                        'add_action',
                        'remove_action',
                        'add_edge',
                        'remove_edge',
                        'replace_action_edges',
                    ])
                    .describe(
                        '\* `update_action` - update_action\n\* `add_action` - add_action\n\* `remove_action` - remove_action\n\* `add_edge` - add_edge\n\* `remove_edge` - remove_edge\n\* `replace_action_edges` - replace_action_edges'
                    )
                    .describe(
                        "Graph edit. update_action {id, patch}: deep-merge patch into the action's fields (a null leaf deletes that key) — the surgical path for tweaking one config value. add_action {action, edges?}: append a full action node, optionally wiring its edges in the same op. remove_action {id}: delete a node and reconnect its incoming edges to its first outgoer. add_edge {edge} \/ remove_edge {edge}: add or delete one edge. replace_action_edges {id, edges}: replace this action's outgoing edges with the given set (use when adding\/removing branch conditions); incoming edges are left intact.\n\n\* `update_action` - update_action\n\* `add_action` - add_action\n\* `remove_action` - remove_action\n\* `add_edge` - add_edge\n\* `remove_edge` - remove_edge\n\* `replace_action_edges` - replace_action_edges"
                    ),
                id: zod
                    .string()
                    .optional()
                    .describe('Action id. Required for update_action, remove_action, replace_action_edges.'),
                patch: zod
                    .unknown()
                    .optional()
                    .describe(
                        "update_action only. Partial action fields, deep-merged into the existing action; a null leaf deletes that key. e.g. {config: {inputs: {subject: {value: 'Hi'}}}} changes only that input."
                    ),
                action: zod
                    .unknown()
                    .optional()
                    .describe(
                        'add_action only. A full action node {id, name, type, config, ...}; same shape as in actions.'
                    ),
                edge: zod
                    .object({
                        to: zod.string().describe('Target action id.'),
                        type: zod
                            .enum(['continue', 'branch'])
                            .describe('\* `continue` - continue\n\* `branch` - branch')
                            .describe(
                                "continue: fall-through (sequential or the no-match path of conditional_branch). branch: requires 'index' matching config.conditions[index].\n\n\* `continue` - continue\n\* `branch` - branch"
                            ),
                        index: zod
                            .number()
                            .optional()
                            .describe(
                                "Required for type='branch'. conditional_branch: index into config.conditions[index]. random_cohort_branch: index into config.cohorts[index]. wait_until_condition: use index:0 — it advances via the index:0 branch edge when it resolves (a condition match or an events entry firing)."
                            ),
                        from: zod.string().describe('Source action id.'),
                    })
                    .optional()
                    .describe('add_edge \/ remove_edge only. The edge {from, to, type, index?}.'),
                edges: zod
                    .array(
                        zod.object({
                            to: zod.string().describe('Target action id.'),
                            type: zod
                                .enum(['continue', 'branch'])
                                .describe('\* `continue` - continue\n\* `branch` - branch')
                                .describe(
                                    "continue: fall-through (sequential or the no-match path of conditional_branch). branch: requires 'index' matching config.conditions[index].\n\n\* `continue` - continue\n\* `branch` - branch"
                                ),
                            index: zod
                                .number()
                                .optional()
                                .describe(
                                    "Required for type='branch'. conditional_branch: index into config.conditions[index]. random_cohort_branch: index into config.cohorts[index]. wait_until_condition: use index:0 — it advances via the index:0 branch edge when it resolves (a condition match or an events entry firing)."
                                ),
                            from: zod.string().describe('Source action id.'),
                        })
                    )
                    .optional()
                    .describe(
                        "replace_action_edges: the complete set of the action's outgoing edges (incoming edges are preserved). add_action: optional edges to wire the new node in the same op."
                    ),
            })
        )
        .optional()
        .describe(
            "Ordered graph edits applied atomically to a draft workflow: the stored graph is read, the ops are applied in order, the result is fully validated, and it's saved only if valid — otherwise the workflow is unchanged. Reference nodes\/edges by id so you never resend the whole graph. The full updated workflow is returned."
        ),
})

export const flowsInvocationsCreateBodyConfigurationOneNameMax = 400

export const flowsInvocationsCreateBodyConfigurationOneDescriptionDefault = ``
export const flowsInvocationsCreateBodyConfigurationOneCreatedByOneDistinctIdMax = 200

export const flowsInvocationsCreateBodyConfigurationOneCreatedByOneFirstNameMax = 150

export const flowsInvocationsCreateBodyConfigurationOneCreatedByOneLastNameMax = 150

export const flowsInvocationsCreateBodyConfigurationOneCreatedByOneEmailMax = 254

export const flowsInvocationsCreateBodyConfigurationOneTriggerMaskingOneTtlMin = 60
export const flowsInvocationsCreateBodyConfigurationOneTriggerMaskingOneTtlMax = 94608000

export const flowsInvocationsCreateBodyConfigurationOneConversionOneEventsItemFiltersOneSourceDefault = `events`
export const flowsInvocationsCreateBodyConfigurationOneActionsItemIdMax = 200

export const flowsInvocationsCreateBodyConfigurationOneActionsItemNameMax = 400

export const flowsInvocationsCreateBodyConfigurationOneActionsItemDescriptionDefault = ``
export const flowsInvocationsCreateBodyConfigurationOneActionsItemFiltersOneSourceDefault = `events`
export const flowsInvocationsCreateBodyConfigurationOneActionsItemConfigTwoConditionFiltersOneSourceDefault = `events`
export const flowsInvocationsCreateBodyConfigurationOneActionsItemConfigTwoEventsItemFiltersOneSourceDefault = `events`
export const flowsInvocationsCreateBodyConfigurationOneSchedulesItemTimezoneMax = 64

export const flowsInvocationsCreateBodyMockAsyncFunctionsDefault = true
export const flowsInvocationsCreateBodyUseDraftDefault = false

export const InsightsFlowsInvocationsCreateBody = /* @__PURE__ */ zod.object({
    configuration: zod
        .object({
            id: zod.uuid(),
            name: zod
                .string()
                .max(flowsInvocationsCreateBodyConfigurationOneNameMax)
                .nullish()
                .describe('Workflow name.'),
            description: zod
                .string()
                .default(flowsInvocationsCreateBodyConfigurationOneDescriptionDefault)
                .describe('Optional description.'),
            version: zod.number(),
            status: zod
                .enum(['draft', 'active', 'archived'])
                .describe('\* `draft` - Draft\n\* `active` - Active\n\* `archived` - Archived')
                .optional()
                .describe(
                    'draft (no execution), active (live), archived (disabled).\n\n\* `draft` - Draft\n\* `active` - Active\n\* `archived` - Archived'
                ),
            created_at: zod.iso.datetime({ offset: true }),
            created_by: zod.object({
                id: zod.number(),
                uuid: zod.uuid(),
                distinct_id: zod
                    .string()
                    .max(flowsInvocationsCreateBodyConfigurationOneCreatedByOneDistinctIdMax)
                    .nullish(),
                first_name: zod
                    .string()
                    .max(flowsInvocationsCreateBodyConfigurationOneCreatedByOneFirstNameMax)
                    .optional(),
                last_name: zod
                    .string()
                    .max(flowsInvocationsCreateBodyConfigurationOneCreatedByOneLastNameMax)
                    .optional(),
                email: zod.email().max(flowsInvocationsCreateBodyConfigurationOneCreatedByOneEmailMax),
                is_email_verified: zod.boolean().nullish(),
                mascot_config: zod.record(zod.string(), zod.unknown()).nullable(),
                role_at_organization: zod
                    .union([
                        zod
                            .enum([
                                'engineering',
                                'data',
                                'product',
                                'founder',
                                'leadership',
                                'marketing',
                                'sales',
                                'student',
                                'other',
                            ])
                            .describe(
                                '\* `engineering` - Engineering\n\* `data` - Data\n\* `product` - Product Management\n\* `founder` - Founder\n\* `leadership` - Leadership\n\* `marketing` - Marketing\n\* `sales` - Sales \/ Success\n\* `student` - Student\n\* `other` - Other'
                            ),
                        zod.enum(['']),
                        zod.null(),
                    ])
                    .optional(),
            }),
            updated_at: zod.iso.datetime({ offset: true }),
            trigger: zod.unknown(),
            trigger_masking: zod
                .union([
                    zod.object({
                        ttl: zod
                            .number()
                            .min(flowsInvocationsCreateBodyConfigurationOneTriggerMaskingOneTtlMin)
                            .max(flowsInvocationsCreateBodyConfigurationOneTriggerMaskingOneTtlMax)
                            .nullish()
                            .describe('Seconds (60 to ~94M \/ 3y) to suppress repeat firings of the same hash.'),
                        threshold: zod
                            .number()
                            .nullish()
                            .describe(
                                'Fire once per N matches of the same hash within ttl — a sampler: N=3 fires on the 1st, 4th, 7th… match. Omit to fire on the first match, then suppress repeats within ttl.'
                            ),
                        hash: zod
                            .string()
                            .describe(
                                "InsightsQL template defining the dedup\/grouping key, e.g. '{person.id}' (once per person) within ttl."
                            ),
                        bytecode: zod.unknown().optional().describe('Auto-compiled from hash. Do not set.'),
                    }),
                    zod.null(),
                ])
                .optional()
                .describe(
                    "Optional dedup\/throttle on an already-matched trigger: {hash: <InsightsQL template>, ttl: <seconds, 60-94608000>, threshold?: <int>}. Without threshold: fire once per hash, then suppress repeats within ttl (hash '{person.id}' = once per person per ttl). With threshold N: fire once per N matches of the same hash — a sampler, the 1st then every Nth. Throttles an already-qualifying trigger; it doesn't decide who enters. Server compiles bytecode from hash; omit to disable."
                ),
            conversion: zod
                .union([
                    zod.object({
                        filters: zod
                            .array(zod.record(zod.string(), zod.unknown()))
                            .optional()
                            .describe(
                                "Property-based conversion conditions, as an ARRAY of property filters: [{key, value, operator, type: event|person|group}, ...]. Event-based goals do NOT go here — put them in 'events'. Empty array = any event within the window converts."
                            ),
                        events: zod
                            .array(
                                zod.object({
                                    filters: zod
                                        .object({
                                            source: zod
                                                .enum(['events', 'person-updates', 'data-warehouse-table'])
                                                .describe(
                                                    '\* `events` - events\n\* `person-updates` - person-updates\n\* `data-warehouse-table` - data-warehouse-table'
                                                )
                                                .default(
                                                    flowsInvocationsCreateBodyConfigurationOneConversionOneEventsItemFiltersOneSourceDefault
                                                ),
                                            actions: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                            events: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                            data_warehouse: zod
                                                .array(zod.record(zod.string(), zod.unknown()))
                                                .optional(),
                                            properties: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                            bytecode: zod.unknown().optional(),
                                            transpiled: zod.unknown().optional(),
                                            filter_test_accounts: zod.boolean().optional(),
                                            bytecode_error: zod.string().optional(),
                                        })
                                        .describe(
                                            "Event\/action filters for this conversion event, same shape as trigger filters: {events: [{id, name, type: 'events', properties?: [<cond>]}], actions?: [...], properties?: [<cond>]}. bytecode is compiled server-side."
                                        ),
                                })
                            )
                            .optional()
                            .describe(
                                "Event-based conversion goals: [{filters: {events: [{id, name, type: 'events'}], ...}}]."
                            ),
                        window_minutes: zod
                            .number()
                            .nullish()
                            .describe(
                                'Conversion window in minutes after a person enters the workflow. null = no explicit window.'
                            ),
                        bytecode: zod
                            .unknown()
                            .optional()
                            .describe("Compiled server-side from 'filters'. Do not set; ignored if sent."),
                    }),
                    zod.null(),
                ])
                .optional()
                .describe(
                    'Conversion goal. filters: ARRAY of property conditions [{key, value, operator, type: event|person|group}]; events: event-based goals [{filters: {events: [...]}}]; window_minutes: minutes after entry. Required for exit_on_conversion \/ exit_on_trigger_not_matched_or_conversion. bytecode compiled server-side.'
                ),
            exit_condition: zod
                .enum([
                    'exit_on_conversion',
                    'exit_on_trigger_not_matched',
                    'exit_on_trigger_not_matched_or_conversion',
                    'exit_only_at_end',
                ])
                .describe(
                    '\* `exit_on_conversion` - Conversion\n\* `exit_on_trigger_not_matched` - Trigger Not Matched\n\* `exit_on_trigger_not_matched_or_conversion` - Trigger Not Matched Or Conversion\n\* `exit_only_at_end` - Only At End'
                )
                .optional()
                .describe(
                    "exit_only_at_end: only at exit node (default). exit_on_conversion: also on conversion (needs 'conversion'; silent no-op otherwise). exit_on_trigger_not_matched: also when trigger filter stops matching. exit_on_trigger_not_matched_or_conversion: both (needs 'conversion').\n\n\* `exit_on_conversion` - Conversion\n\* `exit_on_trigger_not_matched` - Trigger Not Matched\n\* `exit_on_trigger_not_matched_or_conversion` - Trigger Not Matched Or Conversion\n\* `exit_only_at_end` - Only At End"
                ),
            edges: zod
                .array(
                    zod.object({
                        to: zod.string().describe('Target action id.'),
                        type: zod
                            .enum(['continue', 'branch'])
                            .describe('\* `continue` - continue\n\* `branch` - branch')
                            .describe(
                                "continue: fall-through (sequential or the no-match path of conditional_branch). branch: requires 'index' matching config.conditions[index].\n\n\* `continue` - continue\n\* `branch` - branch"
                            ),
                        index: zod
                            .number()
                            .optional()
                            .describe(
                                "Required for type='branch'. conditional_branch: index into config.conditions[index]. random_cohort_branch: index into config.cohorts[index]. wait_until_condition: use index:0 — it advances via the index:0 branch edge when it resolves (a condition match or an events entry firing)."
                            ),
                        from: zod.string().describe('Source action id.'),
                    })
                )
                .optional()
                .describe(
                    "Graph edges: [{from, to, type: 'continue'|'branch', index?}]. 'continue' = fall-through (sequential, or no-match path of conditional_branch). 'branch' requires 'index': matches config.conditions[index] on conditional_branch \/ wait_until_condition. Every non-exit action needs a reachable next action ('No next action found' otherwise)."
                ),
            actions: zod
                .array(
                    zod.object({
                        id: zod
                            .string()
                            .max(flowsInvocationsCreateBodyConfigurationOneActionsItemIdMax)
                            .describe('Unique node ID within the workflow.'),
                        name: zod
                            .string()
                            .max(flowsInvocationsCreateBodyConfigurationOneActionsItemNameMax)
                            .describe('Display name.'),
                        description: zod
                            .string()
                            .default(flowsInvocationsCreateBodyConfigurationOneActionsItemDescriptionDefault)
                            .describe('Optional description.'),
                        on_error: zod
                            .union([
                                zod
                                    .enum(['continue', 'abort'])
                                    .describe('\* `continue` - continue\n\* `abort` - abort'),
                                zod.null(),
                            ])
                            .optional()
                            .describe(
                                'On failure: continue (skip the action and proceed) or abort (stop the run).\n\n\* `continue` - continue\n\* `abort` - abort'
                            ),
                        created_at: zod.number().optional().describe('Created at (epoch ms). Frontend-managed.'),
                        updated_at: zod.number().optional().describe('Updated at (epoch ms). Frontend-managed.'),
                        filters: zod
                            .union([
                                zod.object({
                                    source: zod
                                        .enum(['events', 'person-updates', 'data-warehouse-table'])
                                        .describe(
                                            '\* `events` - events\n\* `person-updates` - person-updates\n\* `data-warehouse-table` - data-warehouse-table'
                                        )
                                        .default(
                                            flowsInvocationsCreateBodyConfigurationOneActionsItemFiltersOneSourceDefault
                                        ),
                                    actions: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                    events: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                    data_warehouse: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                    properties: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                    bytecode: zod.unknown().optional(),
                                    transpiled: zod.unknown().optional(),
                                    filter_test_accounts: zod.boolean().optional(),
                                    bytecode_error: zod.string().optional(),
                                }),
                                zod.null(),
                            ])
                            .optional()
                            .describe('Property filters gating this action.'),
                        type: zod
                            .enum([
                                'trigger',
                                'function',
                                'function_email',
                                'function_sms',
                                'function_push',
                                'delay',
                                'wait_until_condition',
                                'wait_until_time_window',
                                'conditional_branch',
                                'random_cohort_branch',
                                'exit',
                            ])
                            .describe(
                                '\* `trigger` - trigger\n\* `function` - function\n\* `function_email` - function_email\n\* `function_sms` - function_sms\n\* `function_push` - function_push\n\* `delay` - delay\n\* `wait_until_condition` - wait_until_condition\n\* `wait_until_time_window` - wait_until_time_window\n\* `conditional_branch` - conditional_branch\n\* `random_cohort_branch` - random_cohort_branch\n\* `exit` - exit'
                            )
                            .describe(
                                'One of: trigger | function | function_email | function_sms | function_push | delay | wait_until_condition | wait_until_time_window | conditional_branch | random_cohort_branch | exit.\n\n\* `trigger` - trigger\n\* `function` - function\n\* `function_email` - function_email\n\* `function_sms` - function_sms\n\* `function_push` - function_push\n\* `delay` - delay\n\* `wait_until_condition` - wait_until_condition\n\* `wait_until_time_window` - wait_until_time_window\n\* `conditional_branch` - conditional_branch\n\* `random_cohort_branch` - random_cohort_branch\n\* `exit` - exit'
                            ),
                        config: zod
                            .union([
                                zod
                                    .record(zod.string(), zod.unknown())
                                    .describe(
                                        'Config for every action type except wait_until_condition — see the field description for per-type shapes.'
                                    ),
                                zod
                                    .object({
                                        condition: zod
                                            .object({
                                                filters: zod
                                                    .union([
                                                        zod.object({
                                                            source: zod
                                                                .enum([
                                                                    'events',
                                                                    'person-updates',
                                                                    'data-warehouse-table',
                                                                ])
                                                                .describe(
                                                                    '\* `events` - events\n\* `person-updates` - person-updates\n\* `data-warehouse-table` - data-warehouse-table'
                                                                )
                                                                .default(
                                                                    flowsInvocationsCreateBodyConfigurationOneActionsItemConfigTwoConditionFiltersOneSourceDefault
                                                                ),
                                                            actions: zod
                                                                .array(zod.record(zod.string(), zod.unknown()))
                                                                .optional(),
                                                            events: zod
                                                                .array(zod.record(zod.string(), zod.unknown()))
                                                                .optional(),
                                                            data_warehouse: zod
                                                                .array(zod.record(zod.string(), zod.unknown()))
                                                                .optional(),
                                                            properties: zod
                                                                .array(zod.record(zod.string(), zod.unknown()))
                                                                .optional(),
                                                            bytecode: zod.unknown().optional(),
                                                            transpiled: zod.unknown().optional(),
                                                            filter_test_accounts: zod.boolean().optional(),
                                                            bytecode_error: zod.string().optional(),
                                                        }),
                                                        zod.null(),
                                                    ])
                                                    .optional()
                                                    .describe(
                                                        'Property conditions, e.g. {properties: [{key, value, operator, type}]}.'
                                                    ),
                                                name: zod.string().optional().describe('Optional display name.'),
                                            })
                                            .optional()
                                            .describe(
                                                "Property-based wait condition; continues when the person matches. A condition with no property filters is ignored — the wait then relies on 'events' and the max_wait_duration timeout."
                                            ),
                                        events: zod
                                            .array(
                                                zod.object({
                                                    filters: zod
                                                        .union([
                                                            zod.object({
                                                                source: zod
                                                                    .enum([
                                                                        'events',
                                                                        'person-updates',
                                                                        'data-warehouse-table',
                                                                    ])
                                                                    .describe(
                                                                        '\* `events` - events\n\* `person-updates` - person-updates\n\* `data-warehouse-table` - data-warehouse-table'
                                                                    )
                                                                    .default(
                                                                        flowsInvocationsCreateBodyConfigurationOneActionsItemConfigTwoEventsItemFiltersOneSourceDefault
                                                                    ),
                                                                actions: zod
                                                                    .array(zod.record(zod.string(), zod.unknown()))
                                                                    .optional(),
                                                                events: zod
                                                                    .array(zod.record(zod.string(), zod.unknown()))
                                                                    .optional(),
                                                                data_warehouse: zod
                                                                    .array(zod.record(zod.string(), zod.unknown()))
                                                                    .optional(),
                                                                properties: zod
                                                                    .array(zod.record(zod.string(), zod.unknown()))
                                                                    .optional(),
                                                                bytecode: zod.unknown().optional(),
                                                                transpiled: zod.unknown().optional(),
                                                                filter_test_accounts: zod.boolean().optional(),
                                                                bytecode_error: zod.string().optional(),
                                                            }),
                                                            zod.null(),
                                                        ])
                                                        .optional()
                                                        .describe(
                                                            'Event\/action filters; the workflow wakes when a matching event fires. Must target at least one event or action (entries targeting neither are dropped).'
                                                        ),
                                                    name: zod.string().optional().describe('Optional display name.'),
                                                })
                                            )
                                            .optional()
                                            .describe(
                                                "Events to wait for: continues when ANY entry fires (OR'd with 'condition'). Each entry: {filters: {events: [{id, name, type: 'events'}], actions?: [...]}, name?}."
                                            ),
                                        max_wait_duration: zod
                                            .string()
                                            .describe(
                                                "'<number><unit>' with unit m|h|d, e.g. '30m' (same rules as delay)."
                                            ),
                                    })
                                    .describe(
                                        "Config for type='wait_until_condition'. Provide 'condition' and\/or 'events' — an events-only wait (no condition) is valid."
                                    ),
                            ])
                            .describe(
                                "Type-specific config keyed by action type. trigger: {type: event|webhook|manual|batch|schedule|tracking_pixel, filters?}. webhook and manual triggers also require template_id: 'template-source-webhook', and tracking_pixel requires template_id: 'template-source-webhook-pixel'. filters shape: {events: [{id, name, type:'events', properties:[<cond>]}], properties:[<cond>], actions:[...], filter_test_accounts:<bool>}. <cond>: {key, value, operator, type: event|person|group}, or {key: 'id', type: 'cohort', value: <cohort_id>, operator: 'in'} to reference a cohort. batch triggers may set filters.audience_type: 'persons' (default) or 'accounts'. An accounts audience fans out one run per customer analytics account and takes account filters instead: properties entries of type 'account_custom_property' (key = definition id), plus tag_names: [<str>], assigned_to_user_ids: [<int>], all_roles_unassigned: <bool>. function\*: {template_id, inputs: {<key>: {value: <str>}}}. Wrap values in {value:...} to enable script templating ({person.x}, {event.x}); flat strings won't interpolate. function_email also accepts tracking_enabled?: <bool> (default true) - when false, no open pixel is injected, links are not rewritten, and the send skips ESP-level open\/click tracking, so opens and clicks are not recorded for that step (delivery\/bounce\/unsubscribe still are). Dictionary input values are template strings too — write booleans\/numbers as single-expression templates ('{true}', '{42}'), which evaluate to the typed value. delay: {delay_duration: '<number><unit>'} where unit is m|h|d. Fractions OK ('0.5m'=30s; seconds unsupported). Per-unit max m<=60, h<=24, d<=30; values above are SILENTLY CLAMPED. Max 30d. conditional_branch: {conditions: [{filters}, ...]}. Index N matches the 'branch' edge with index:N. random_cohort_branch: {cohorts: [{percentage: <number>, name?}, ...]}. Index N matches the 'branch' edge with index:N; percentages are relative weights, so they should sum to 100 but a total above or below that still splits traffic in the given proportions. wait_until_condition: {condition: {filters}, events?: [{filters: {events: [{id, name, type: 'events'}], actions?: [...]}, name?}], max_wait_duration: <duration>} (same rules as delay). Continues when condition.filters match OR any events entry fires; each events entry must target at least one event or action. On resolution (a condition match or any events entry firing) it advances via the 'branch' edge with index:0; the max_wait_duration timeout falls through the 'continue' edge. exit: {reason}."
                            ),
                        output_variable: zod
                            .unknown()
                            .optional()
                            .describe(
                                'Output variable for downstream actions: {key, result_path?, spread?, label?} or a list of those.'
                            ),
                    })
                )
                .describe("Ordered action nodes. Exactly one type='trigger' required. Typically one type='exit' too."),
            abort_action: zod.string().nullable(),
            variables: zod
                .array(
                    zod
                        .record(zod.string(), zod.string())
                        .describe('Variable: {key, type: string|number|boolean, default}.')
                )
                .optional()
                .describe('Workflow vars (key, type, default). Total <5KB.'),
            billable_action_types: zod.unknown(),
            schedules: zod
                .array(
                    zod.object({
                        id: zod.uuid(),
                        rrule: zod
                            .string()
                            .describe(
                                "iCalendar RRULE string (e.g. 'FREQ=DAILY;INTERVAL=1'). Must produce occurrences at most once per hour."
                            ),
                        starts_at: zod.iso
                            .datetime({ offset: true })
                            .describe('ISO 8601 datetime the schedule starts from.'),
                        timezone: zod
                            .string()
                            .max(flowsInvocationsCreateBodyConfigurationOneSchedulesItemTimezoneMax)
                            .optional()
                            .describe("IANA timezone for interpreting the RRULE (default 'UTC')."),
                        variables: zod
                            .unknown()
                            .optional()
                            .describe('Variable value overrides merged with the workflow defaults on each run.'),
                        status: zod
                            .enum(['active', 'paused', 'completed'])
                            .describe('\* `active` - Active\n\* `paused` - Paused\n\* `completed` - Completed')
                            .describe(
                                "active, paused, or completed (set once the RRULE's COUNT\/UNTIL is exhausted).\n\n\* `active` - Active\n\* `paused` - Paused\n\* `completed` - Completed"
                            ),
                        next_run_at: zod.iso
                            .datetime({ offset: true })
                            .nullable()
                            .describe('Next scheduled fire time, computed by the scheduler.'),
                        created_at: zod.iso.datetime({ offset: true }),
                        updated_at: zod.iso.datetime({ offset: true }),
                    })
                )
                .describe(
                    "Recurring schedules attached to this workflow (read-only here; manage via the schedules sub-resource). A batch\/schedule workflow only fires when it's active AND has an active schedule. Empty for non-scheduled workflows."
                ),
            user_access_level: zod
                .string()
                .nullable()
                .describe('The effective access level the user has for this object'),
            draft: zod
                .unknown()
                .describe(
                    "Staged content changes awaiting publish — a full snapshot of the workflow's actions, edges and settings. Null when there's nothing staged. Test it with a use_draft test run, then promote it with the publish endpoint or throw it away with discard_draft."
                ),
            draft_updated_at: zod.iso
                .datetime({ offset: true })
                .nullable()
                .describe(
                    "When the draft was last written; null when there's no staged draft. Pass this to publish (and as base_updated_at on further draft edits) so a concurrent editor's changes aren't clobbered — a mismatch returns 409."
                ),
            action_redirects: zod
                .record(zod.string(), zod.string())
                .nullable()
                .describe(
                    'Skip-forward map for deleted steps: {deleted_action_id: next surviving action_id}. Maintained automatically when a live graph edit deletes actions, so in-flight runs parked on a deleted step continue at its surviving successor instead of exiting. Null when no live deletions have occurred.'
                ),
        })
        .describe('Mixin for serializers to add user access control fields')
        .optional()
        .describe('Optional override; omit to use saved definition.'),
    globals: zod
        .record(zod.string(), zod.unknown())
        .optional()
        .describe('Test trigger payload, typically {event, person, groups}.'),
    mock_async_functions: zod
        .boolean()
        .default(flowsInvocationsCreateBodyMockAsyncFunctionsDefault)
        .describe('True (default) mocks HTTP\/email\/SMS. False fires real side effects.'),
    current_action_id: zod
        .string()
        .optional()
        .describe(
            'Start execution from this action ID instead of the trigger. Each test run executes a single node and returns the next action id.'
        ),
    use_draft: zod
        .boolean()
        .default(flowsInvocationsCreateBodyUseDraftDefault)
        .describe(
            "Test the workflow's staged draft instead of its live config. Set this only when workflows-get returns a non-null 'draft'; it can't be combined with an explicit configuration override."
        ),
})

export const flowsPublishCreateBodyConfirmDefault = false

export const InsightsFlowsPublishCreateBody = /* @__PURE__ */ zod.object({
    confirm: zod
        .boolean()
        .default(flowsPublishCreateBodyConfirmDefault)
        .describe(
            'False (default) previews the publish: returns the impact on people in-flight without changing anything. True applies the staged draft to the live workflow.'
        ),
    confirm_token: zod
        .string()
        .optional()
        .describe(
            'From the preview response — required when confirm=true. Expires after 15 minutes, and any draft edit invalidates it (409), so you always publish the exact draft you previewed.'
        ),
})

/**
 * Rerun past invocations of this script flow from their stored payloads.
 *
 * Same shape and semantics as the script function rerun endpoint —
 * proxies through to the CDP worker, which reads matching rows from
 * Datastore, rehydrates from `invocation_globals`, and re-enqueues
 * onto cyclotron with `is_retry=1`.
 *
 * Because rerun replays historical event/person/group data, it requires
 * `person:read` and `group:read` on top of `script_flow:write`.
 */
export const flowsRerunCreateBodyFilterOneMaxAttemptsMax = 255

export const flowsRerunCreateBodyFilterOneMaxCountMax = 10000

export const flowsRerunCreateBodyFilterOneInvocationIdsMax = 10000

export const InsightsFlowsRerunCreateBody = /* @__PURE__ */ zod
    .object({
        filter: zod
            .object({
                window_start: zod.iso
                    .datetime({ offset: true })
                    .describe('Inclusive lower bound on `scheduled_at` (UTC).'),
                window_end: zod.iso
                    .datetime({ offset: true })
                    .describe('Exclusive upper bound on `scheduled_at` (UTC).'),
                status: zod
                    .array(
                        zod
                            .enum(['running', 'succeeded', 'failed'])
                            .describe('\* `running` - running\n\* `succeeded` - succeeded\n\* `failed` - failed')
                    )
                    .optional()
                    .describe("Restrict to invocations whose latest status is one of these. Defaults to ['failed']."),
                error_kind: zod
                    .array(zod.string())
                    .optional()
                    .describe(
                        "Restrict to invocations whose error_kind matches one of these (e.g. 'http_5xx', 'timeout')."
                    ),
                max_attempts: zod
                    .number()
                    .min(1)
                    .max(flowsRerunCreateBodyFilterOneMaxAttemptsMax)
                    .optional()
                    .describe('Skip invocations that have already been attempted this many times or more.'),
                max_count: zod
                    .number()
                    .min(1)
                    .max(flowsRerunCreateBodyFilterOneMaxCountMax)
                    .optional()
                    .describe('Maximum number of invocations to rerun in this request. Server-side cap is 10000.'),
                invocation_ids: zod
                    .array(zod.string())
                    .max(flowsRerunCreateBodyFilterOneInvocationIdsMax)
                    .optional()
                    .describe(
                        'Optional restriction to specific invocation IDs within the window. Capped at 10000 per request. Always combined with `window_start`\/`window_end` so the Datastore query can be partition-pruned.'
                    ),
            })
            .describe('Filter shape for the rerun endpoint. `window_start`\/`window_end` are required.')
            .describe(
                'Required. `window_start` \/ `window_end` pin the query to a small set of date partitions on the `hog_invocation_results` table. Optional `invocation_ids` restricts to specific invocations within that window.'
            ),
    })
    .describe('Rerun invocations of a script function or script flow from their stored payloads.')

export const flowsRevisionsRestoreCreateBodyOverwriteDefault = false

export const InsightsFlowsRevisionsRestoreCreateBody = /* @__PURE__ */ zod.object({
    overwrite: zod
        .boolean()
        .default(flowsRevisionsRestoreCreateBodyOverwriteDefault)
        .describe(
            "Replace the open staged draft with this revision's content. Without it, restoring while a draft is open returns 409."
        ),
})

export const flowsSchedulesCreateBodyTimezoneMax = 64

export const InsightsFlowsSchedulesCreateBody = /* @__PURE__ */ zod.object({
    rrule: zod
        .string()
        .describe(
            "iCalendar RRULE string (e.g. 'FREQ=DAILY;INTERVAL=1'). Must produce occurrences at most once per hour."
        ),
    starts_at: zod.iso.datetime({ offset: true }).describe('ISO 8601 datetime the schedule starts from.'),
    timezone: zod
        .string()
        .max(flowsSchedulesCreateBodyTimezoneMax)
        .optional()
        .describe("IANA timezone for interpreting the RRULE (default 'UTC')."),
    variables: zod
        .unknown()
        .optional()
        .describe('Variable value overrides merged with the workflow defaults on each run.'),
})

export const flowsSchedulesPartialUpdateBodyTimezoneMax = 64

export const InsightsFlowsSchedulesPartialUpdateBody = /* @__PURE__ */ zod.object({
    rrule: zod
        .string()
        .optional()
        .describe(
            "iCalendar RRULE string (e.g. 'FREQ=DAILY;INTERVAL=1'). Must produce occurrences at most once per hour."
        ),
    starts_at: zod.iso.datetime({ offset: true }).optional().describe('ISO 8601 datetime the schedule starts from.'),
    timezone: zod
        .string()
        .max(flowsSchedulesPartialUpdateBodyTimezoneMax)
        .optional()
        .describe("IANA timezone for interpreting the RRULE (default 'UTC')."),
    variables: zod
        .unknown()
        .optional()
        .describe('Variable value overrides merged with the workflow defaults on each run.'),
})

export const flowsBulkDeleteCreateBodyNameMax = 400

export const flowsBulkDeleteCreateBodyDescriptionDefault = ``
export const flowsBulkDeleteCreateBodyTriggerMaskingOneTtlMin = 60
export const flowsBulkDeleteCreateBodyTriggerMaskingOneTtlMax = 94608000

export const flowsBulkDeleteCreateBodyConversionOneEventsItemFiltersOneSourceDefault = `events`
export const flowsBulkDeleteCreateBodyActionsItemIdMax = 200

export const flowsBulkDeleteCreateBodyActionsItemNameMax = 400

export const flowsBulkDeleteCreateBodyActionsItemDescriptionDefault = ``
export const flowsBulkDeleteCreateBodyActionsItemFiltersOneSourceDefault = `events`
export const flowsBulkDeleteCreateBodyActionsItemConfigTwoConditionFiltersOneSourceDefault = `events`
export const flowsBulkDeleteCreateBodyActionsItemConfigTwoEventsItemFiltersOneSourceDefault = `events`

export const InsightsFlowsBulkDeleteCreateBody = /* @__PURE__ */ zod
    .object({
        name: zod.string().max(flowsBulkDeleteCreateBodyNameMax).nullish().describe('Workflow name.'),
        description: zod
            .string()
            .default(flowsBulkDeleteCreateBodyDescriptionDefault)
            .describe('Optional description.'),
        status: zod
            .enum(['draft', 'active', 'archived'])
            .describe('\* `draft` - Draft\n\* `active` - Active\n\* `archived` - Archived')
            .optional()
            .describe(
                'draft (no execution), active (live), archived (disabled).\n\n\* `draft` - Draft\n\* `active` - Active\n\* `archived` - Archived'
            ),
        trigger_masking: zod
            .union([
                zod.object({
                    ttl: zod
                        .number()
                        .min(flowsBulkDeleteCreateBodyTriggerMaskingOneTtlMin)
                        .max(flowsBulkDeleteCreateBodyTriggerMaskingOneTtlMax)
                        .nullish()
                        .describe('Seconds (60 to ~94M \/ 3y) to suppress repeat firings of the same hash.'),
                    threshold: zod
                        .number()
                        .nullish()
                        .describe(
                            'Fire once per N matches of the same hash within ttl — a sampler: N=3 fires on the 1st, 4th, 7th… match. Omit to fire on the first match, then suppress repeats within ttl.'
                        ),
                    hash: zod
                        .string()
                        .describe(
                            "InsightsQL template defining the dedup\/grouping key, e.g. '{person.id}' (once per person) within ttl."
                        ),
                    bytecode: zod.unknown().optional().describe('Auto-compiled from hash. Do not set.'),
                }),
                zod.null(),
            ])
            .optional()
            .describe(
                "Optional dedup\/throttle on an already-matched trigger: {hash: <InsightsQL template>, ttl: <seconds, 60-94608000>, threshold?: <int>}. Without threshold: fire once per hash, then suppress repeats within ttl (hash '{person.id}' = once per person per ttl). With threshold N: fire once per N matches of the same hash — a sampler, the 1st then every Nth. Throttles an already-qualifying trigger; it doesn't decide who enters. Server compiles bytecode from hash; omit to disable."
            ),
        conversion: zod
            .union([
                zod.object({
                    filters: zod
                        .array(zod.record(zod.string(), zod.unknown()))
                        .optional()
                        .describe(
                            "Property-based conversion conditions, as an ARRAY of property filters: [{key, value, operator, type: event|person|group}, ...]. Event-based goals do NOT go here — put them in 'events'. Empty array = any event within the window converts."
                        ),
                    events: zod
                        .array(
                            zod.object({
                                filters: zod
                                    .object({
                                        source: zod
                                            .enum(['events', 'person-updates', 'data-warehouse-table'])
                                            .describe(
                                                '\* `events` - events\n\* `person-updates` - person-updates\n\* `data-warehouse-table` - data-warehouse-table'
                                            )
                                            .default(
                                                flowsBulkDeleteCreateBodyConversionOneEventsItemFiltersOneSourceDefault
                                            ),
                                        actions: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                        events: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                        data_warehouse: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                        properties: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                        bytecode: zod.unknown().optional(),
                                        transpiled: zod.unknown().optional(),
                                        filter_test_accounts: zod.boolean().optional(),
                                        bytecode_error: zod.string().optional(),
                                    })
                                    .describe(
                                        "Event\/action filters for this conversion event, same shape as trigger filters: {events: [{id, name, type: 'events', properties?: [<cond>]}], actions?: [...], properties?: [<cond>]}. bytecode is compiled server-side."
                                    ),
                            })
                        )
                        .optional()
                        .describe(
                            "Event-based conversion goals: [{filters: {events: [{id, name, type: 'events'}], ...}}]."
                        ),
                    window_minutes: zod
                        .number()
                        .nullish()
                        .describe(
                            'Conversion window in minutes after a person enters the workflow. null = no explicit window.'
                        ),
                    bytecode: zod
                        .unknown()
                        .optional()
                        .describe("Compiled server-side from 'filters'. Do not set; ignored if sent."),
                }),
                zod.null(),
            ])
            .optional()
            .describe(
                'Conversion goal. filters: ARRAY of property conditions [{key, value, operator, type: event|person|group}]; events: event-based goals [{filters: {events: [...]}}]; window_minutes: minutes after entry. Required for exit_on_conversion \/ exit_on_trigger_not_matched_or_conversion. bytecode compiled server-side.'
            ),
        exit_condition: zod
            .enum([
                'exit_on_conversion',
                'exit_on_trigger_not_matched',
                'exit_on_trigger_not_matched_or_conversion',
                'exit_only_at_end',
            ])
            .describe(
                '\* `exit_on_conversion` - Conversion\n\* `exit_on_trigger_not_matched` - Trigger Not Matched\n\* `exit_on_trigger_not_matched_or_conversion` - Trigger Not Matched Or Conversion\n\* `exit_only_at_end` - Only At End'
            )
            .optional()
            .describe(
                "exit_only_at_end: only at exit node (default). exit_on_conversion: also on conversion (needs 'conversion'; silent no-op otherwise). exit_on_trigger_not_matched: also when trigger filter stops matching. exit_on_trigger_not_matched_or_conversion: both (needs 'conversion').\n\n\* `exit_on_conversion` - Conversion\n\* `exit_on_trigger_not_matched` - Trigger Not Matched\n\* `exit_on_trigger_not_matched_or_conversion` - Trigger Not Matched Or Conversion\n\* `exit_only_at_end` - Only At End"
            ),
        edges: zod
            .array(
                zod.object({
                    to: zod.string().describe('Target action id.'),
                    type: zod
                        .enum(['continue', 'branch'])
                        .describe('\* `continue` - continue\n\* `branch` - branch')
                        .describe(
                            "continue: fall-through (sequential or the no-match path of conditional_branch). branch: requires 'index' matching config.conditions[index].\n\n\* `continue` - continue\n\* `branch` - branch"
                        ),
                    index: zod
                        .number()
                        .optional()
                        .describe(
                            "Required for type='branch'. conditional_branch: index into config.conditions[index]. random_cohort_branch: index into config.cohorts[index]. wait_until_condition: use index:0 — it advances via the index:0 branch edge when it resolves (a condition match or an events entry firing)."
                        ),
                    from: zod.string().describe('Source action id.'),
                })
            )
            .optional()
            .describe(
                "Graph edges: [{from, to, type: 'continue'|'branch', index?}]. 'continue' = fall-through (sequential, or no-match path of conditional_branch). 'branch' requires 'index': matches config.conditions[index] on conditional_branch \/ wait_until_condition. Every non-exit action needs a reachable next action ('No next action found' otherwise)."
            ),
        actions: zod
            .array(
                zod.object({
                    id: zod
                        .string()
                        .max(flowsBulkDeleteCreateBodyActionsItemIdMax)
                        .describe('Unique node ID within the workflow.'),
                    name: zod.string().max(flowsBulkDeleteCreateBodyActionsItemNameMax).describe('Display name.'),
                    description: zod
                        .string()
                        .default(flowsBulkDeleteCreateBodyActionsItemDescriptionDefault)
                        .describe('Optional description.'),
                    on_error: zod
                        .union([
                            zod.enum(['continue', 'abort']).describe('\* `continue` - continue\n\* `abort` - abort'),
                            zod.null(),
                        ])
                        .optional()
                        .describe(
                            'On failure: continue (skip the action and proceed) or abort (stop the run).\n\n\* `continue` - continue\n\* `abort` - abort'
                        ),
                    created_at: zod.number().optional().describe('Created at (epoch ms). Frontend-managed.'),
                    updated_at: zod.number().optional().describe('Updated at (epoch ms). Frontend-managed.'),
                    filters: zod
                        .union([
                            zod.object({
                                source: zod
                                    .enum(['events', 'person-updates', 'data-warehouse-table'])
                                    .describe(
                                        '\* `events` - events\n\* `person-updates` - person-updates\n\* `data-warehouse-table` - data-warehouse-table'
                                    )
                                    .default(flowsBulkDeleteCreateBodyActionsItemFiltersOneSourceDefault),
                                actions: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                events: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                data_warehouse: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                properties: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                                bytecode: zod.unknown().optional(),
                                transpiled: zod.unknown().optional(),
                                filter_test_accounts: zod.boolean().optional(),
                                bytecode_error: zod.string().optional(),
                            }),
                            zod.null(),
                        ])
                        .optional()
                        .describe('Property filters gating this action.'),
                    type: zod
                        .enum([
                            'trigger',
                            'function',
                            'function_email',
                            'function_sms',
                            'function_push',
                            'delay',
                            'wait_until_condition',
                            'wait_until_time_window',
                            'conditional_branch',
                            'random_cohort_branch',
                            'exit',
                        ])
                        .describe(
                            '\* `trigger` - trigger\n\* `function` - function\n\* `function_email` - function_email\n\* `function_sms` - function_sms\n\* `function_push` - function_push\n\* `delay` - delay\n\* `wait_until_condition` - wait_until_condition\n\* `wait_until_time_window` - wait_until_time_window\n\* `conditional_branch` - conditional_branch\n\* `random_cohort_branch` - random_cohort_branch\n\* `exit` - exit'
                        )
                        .describe(
                            'One of: trigger | function | function_email | function_sms | function_push | delay | wait_until_condition | wait_until_time_window | conditional_branch | random_cohort_branch | exit.\n\n\* `trigger` - trigger\n\* `function` - function\n\* `function_email` - function_email\n\* `function_sms` - function_sms\n\* `function_push` - function_push\n\* `delay` - delay\n\* `wait_until_condition` - wait_until_condition\n\* `wait_until_time_window` - wait_until_time_window\n\* `conditional_branch` - conditional_branch\n\* `random_cohort_branch` - random_cohort_branch\n\* `exit` - exit'
                        ),
                    config: zod
                        .union([
                            zod
                                .record(zod.string(), zod.unknown())
                                .describe(
                                    'Config for every action type except wait_until_condition — see the field description for per-type shapes.'
                                ),
                            zod
                                .object({
                                    condition: zod
                                        .object({
                                            filters: zod
                                                .union([
                                                    zod.object({
                                                        source: zod
                                                            .enum(['events', 'person-updates', 'data-warehouse-table'])
                                                            .describe(
                                                                '\* `events` - events\n\* `person-updates` - person-updates\n\* `data-warehouse-table` - data-warehouse-table'
                                                            )
                                                            .default(
                                                                flowsBulkDeleteCreateBodyActionsItemConfigTwoConditionFiltersOneSourceDefault
                                                            ),
                                                        actions: zod
                                                            .array(zod.record(zod.string(), zod.unknown()))
                                                            .optional(),
                                                        events: zod
                                                            .array(zod.record(zod.string(), zod.unknown()))
                                                            .optional(),
                                                        data_warehouse: zod
                                                            .array(zod.record(zod.string(), zod.unknown()))
                                                            .optional(),
                                                        properties: zod
                                                            .array(zod.record(zod.string(), zod.unknown()))
                                                            .optional(),
                                                        bytecode: zod.unknown().optional(),
                                                        transpiled: zod.unknown().optional(),
                                                        filter_test_accounts: zod.boolean().optional(),
                                                        bytecode_error: zod.string().optional(),
                                                    }),
                                                    zod.null(),
                                                ])
                                                .optional()
                                                .describe(
                                                    'Property conditions, e.g. {properties: [{key, value, operator, type}]}.'
                                                ),
                                            name: zod.string().optional().describe('Optional display name.'),
                                        })
                                        .optional()
                                        .describe(
                                            "Property-based wait condition; continues when the person matches. A condition with no property filters is ignored — the wait then relies on 'events' and the max_wait_duration timeout."
                                        ),
                                    events: zod
                                        .array(
                                            zod.object({
                                                filters: zod
                                                    .union([
                                                        zod.object({
                                                            source: zod
                                                                .enum([
                                                                    'events',
                                                                    'person-updates',
                                                                    'data-warehouse-table',
                                                                ])
                                                                .describe(
                                                                    '\* `events` - events\n\* `person-updates` - person-updates\n\* `data-warehouse-table` - data-warehouse-table'
                                                                )
                                                                .default(
                                                                    flowsBulkDeleteCreateBodyActionsItemConfigTwoEventsItemFiltersOneSourceDefault
                                                                ),
                                                            actions: zod
                                                                .array(zod.record(zod.string(), zod.unknown()))
                                                                .optional(),
                                                            events: zod
                                                                .array(zod.record(zod.string(), zod.unknown()))
                                                                .optional(),
                                                            data_warehouse: zod
                                                                .array(zod.record(zod.string(), zod.unknown()))
                                                                .optional(),
                                                            properties: zod
                                                                .array(zod.record(zod.string(), zod.unknown()))
                                                                .optional(),
                                                            bytecode: zod.unknown().optional(),
                                                            transpiled: zod.unknown().optional(),
                                                            filter_test_accounts: zod.boolean().optional(),
                                                            bytecode_error: zod.string().optional(),
                                                        }),
                                                        zod.null(),
                                                    ])
                                                    .optional()
                                                    .describe(
                                                        'Event\/action filters; the workflow wakes when a matching event fires. Must target at least one event or action (entries targeting neither are dropped).'
                                                    ),
                                                name: zod.string().optional().describe('Optional display name.'),
                                            })
                                        )
                                        .optional()
                                        .describe(
                                            "Events to wait for: continues when ANY entry fires (OR'd with 'condition'). Each entry: {filters: {events: [{id, name, type: 'events'}], actions?: [...]}, name?}."
                                        ),
                                    max_wait_duration: zod
                                        .string()
                                        .describe(
                                            "'<number><unit>' with unit m|h|d, e.g. '30m' (same rules as delay)."
                                        ),
                                })
                                .describe(
                                    "Config for type='wait_until_condition'. Provide 'condition' and\/or 'events' — an events-only wait (no condition) is valid."
                                ),
                        ])
                        .describe(
                            "Type-specific config keyed by action type. trigger: {type: event|webhook|manual|batch|schedule|tracking_pixel, filters?}. webhook and manual triggers also require template_id: 'template-source-webhook', and tracking_pixel requires template_id: 'template-source-webhook-pixel'. filters shape: {events: [{id, name, type:'events', properties:[<cond>]}], properties:[<cond>], actions:[...], filter_test_accounts:<bool>}. <cond>: {key, value, operator, type: event|person|group}, or {key: 'id', type: 'cohort', value: <cohort_id>, operator: 'in'} to reference a cohort. batch triggers may set filters.audience_type: 'persons' (default) or 'accounts'. An accounts audience fans out one run per customer analytics account and takes account filters instead: properties entries of type 'account_custom_property' (key = definition id), plus tag_names: [<str>], assigned_to_user_ids: [<int>], all_roles_unassigned: <bool>. function\*: {template_id, inputs: {<key>: {value: <str>}}}. Wrap values in {value:...} to enable script templating ({person.x}, {event.x}); flat strings won't interpolate. function_email also accepts tracking_enabled?: <bool> (default true) - when false, no open pixel is injected, links are not rewritten, and the send skips ESP-level open\/click tracking, so opens and clicks are not recorded for that step (delivery\/bounce\/unsubscribe still are). Dictionary input values are template strings too — write booleans\/numbers as single-expression templates ('{true}', '{42}'), which evaluate to the typed value. delay: {delay_duration: '<number><unit>'} where unit is m|h|d. Fractions OK ('0.5m'=30s; seconds unsupported). Per-unit max m<=60, h<=24, d<=30; values above are SILENTLY CLAMPED. Max 30d. conditional_branch: {conditions: [{filters}, ...]}. Index N matches the 'branch' edge with index:N. random_cohort_branch: {cohorts: [{percentage: <number>, name?}, ...]}. Index N matches the 'branch' edge with index:N; percentages are relative weights, so they should sum to 100 but a total above or below that still splits traffic in the given proportions. wait_until_condition: {condition: {filters}, events?: [{filters: {events: [{id, name, type: 'events'}], actions?: [...]}, name?}], max_wait_duration: <duration>} (same rules as delay). Continues when condition.filters match OR any events entry fires; each events entry must target at least one event or action. On resolution (a condition match or any events entry firing) it advances via the 'branch' edge with index:0; the max_wait_duration timeout falls through the 'continue' edge. exit: {reason}."
                        ),
                    output_variable: zod
                        .unknown()
                        .optional()
                        .describe(
                            'Output variable for downstream actions: {key, result_path?, spread?, label?} or a list of those.'
                        ),
                })
            )
            .describe("Ordered action nodes. Exactly one type='trigger' required. Typically one type='exit' too."),
        variables: zod
            .array(
                zod
                    .record(zod.string(), zod.string())
                    .describe('Variable: {key, type: string|number|boolean, default}.')
            )
            .optional()
            .describe('Workflow vars (key, type, default). Total <5KB.'),
    })
    .describe('Mixin for serializers to add user access control fields')

export const InsightsFlowsUserBlastRadiusCreateBody = /* @__PURE__ */ zod.object({
    filters: zod.record(zod.string(), zod.unknown()).describe('Property filters to apply'),
    group_type_index: zod.number().nullish().describe('Group type index for group-based targeting'),
    dedupe_key: zod
        .union([zod.enum(['email']).describe('\* `email` - email'), zod.null()])
        .optional()
        .describe(
            "When 'email', count unique email addresses instead of persons, matching how batch email sends deduplicate recipients.\n\n\* `email` - email"
        ),
})
