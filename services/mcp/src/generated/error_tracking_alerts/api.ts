/**
 * Auto-generated from the Django backend OpenAPI schema.
 * MCP service uses these Zod schemas for generated tool handlers.
 * To regenerate: insightscli build:openapi
 *
 * Insights API - MCP 4 enabled ops
 * OpenAPI spec version: 1.0.0
 */
import * as zod from 'zod'

export const InsightsFunctionsListParams = /* @__PURE__ */ zod.object({
    project_id: zod
        .string()
        .describe(
            "Project ID of the project you're trying to access. To find the ID of the project, make a call to \/api\/projects\/."
        ),
})

export const InsightsFunctionsListQueryParams = /* @__PURE__ */ zod.object({
    created_at: zod.iso.datetime({ offset: true }).optional(),
    created_by: zod.number().optional(),
    enabled: zod.boolean().optional(),
    id: zod.string().optional(),
    limit: zod.number().optional().describe('Number of results to return per page.'),
    offset: zod.number().optional().describe('The initial index from which to return the results.'),
    type: zod.array(zod.string()).optional().describe('Multiple values may be separated by commas.'),
    updated_at: zod.iso.datetime({ offset: true }).optional(),
})

export const InsightsFunctionsCreateParams = /* @__PURE__ */ zod.object({
    project_id: zod
        .string()
        .describe(
            "Project ID of the project you're trying to access. To find the ID of the project, make a call to \/api\/projects\/."
        ),
})

export const insightsFunctionsCreateBodyNameMax = 400

export const insightsFunctionsCreateBodyInputsSchemaItemRequiredDefault = false
export const insightsFunctionsCreateBodyInputsSchemaItemSecretDefault = false
export const insightsFunctionsCreateBodyInputsSchemaItemHiddenDefault = false
export const insightsFunctionsCreateBodyFiltersOneSourceDefault = `events`
export const insightsFunctionsCreateBodyMaskingOneTtlMin = 60
export const insightsFunctionsCreateBodyMaskingOneTtlMax = 86400

export const insightsFunctionsCreateBodyMappingsItemInputsSchemaItemRequiredDefault = false
export const insightsFunctionsCreateBodyMappingsItemInputsSchemaItemSecretDefault = false
export const insightsFunctionsCreateBodyMappingsItemInputsSchemaItemHiddenDefault = false
export const insightsFunctionsCreateBodyMappingsItemFiltersSourceDefault = `events`
export const insightsFunctionsCreateBodyTemplateIdMax = 400

export const insightsFunctionsCreateBodyExecutionOrderMin = 0
export const insightsFunctionsCreateBodyExecutionOrderMax = 32767

export const InsightsFunctionsCreateBody = /* @__PURE__ */ zod.object({
    type: zod
        .union([
            zod
                .enum([
                    'destination',
                    'site_destination',
                    'internal_destination',
                    'source_webhook',
                    'warehouse_source_webhook',
                    'site_app',
                    'transformation',
                    'transformation_log',
                ])
                .describe(
                    '\* `destination` - Destination\n\* `site_destination` - Site Destination\n\* `internal_destination` - Internal Destination\n\* `source_webhook` - Source Webhook\n\* `warehouse_source_webhook` - Warehouse Source Webhook\n\* `site_app` - Site App\n\* `transformation` - Transformation\n\* `transformation_log` - Transformation Log'
                ),
            zod.null(),
        ])
        .optional()
        .describe(
            'Function type: destination, site_destination, internal_destination, source_webhook, warehouse_source_webhook, site_app, transformation, or transformation_log.\n\n\* `destination` - Destination\n\* `site_destination` - Site Destination\n\* `internal_destination` - Internal Destination\n\* `source_webhook` - Source Webhook\n\* `warehouse_source_webhook` - Warehouse Source Webhook\n\* `site_app` - Site App\n\* `transformation` - Transformation\n\* `transformation_log` - Transformation Log'
        ),
    name: zod.string().max(insightsFunctionsCreateBodyNameMax).nullish().describe('Display name for the function.'),
    description: zod.string().optional().describe('Human-readable description of what this function does.'),
    enabled: zod.boolean().optional().describe('Whether the function is active and processing events.'),
    script: zod
        .string()
        .optional()
        .describe('Source code. Script language for most types; TypeScript for site_destination and site_app.'),
    inputs_schema: zod
        .array(
            zod.object({
                type: zod
                    .enum([
                        'string',
                        'number',
                        'boolean',
                        'dictionary',
                        'choice',
                        'json',
                        'integration',
                        'integration_multi',
                        'integration_field',
                        'email',
                        'native_email',
                        'insights_assignee',
                        'insights_ticket_tags',
                        'insights_business_hours',
                        'non_failure_status_codes',
                        'customer_analytics_account_properties',
                        'customer_analytics_account_relationships',
                    ])
                    .describe(
                        '\* `string` - string\n\* `number` - number\n\* `boolean` - boolean\n\* `dictionary` - dictionary\n\* `choice` - choice\n\* `json` - json\n\* `integration` - integration\n\* `integration_multi` - integration_multi\n\* `integration_field` - integration_field\n\* `email` - email\n\* `native_email` - native_email\n\* `insights_assignee` - insights_assignee\n\* `insights_ticket_tags` - insights_ticket_tags\n\* `insights_business_hours` - insights_business_hours\n\* `non_failure_status_codes` - non_failure_status_codes\n\* `customer_analytics_account_properties` - customer_analytics_account_properties\n\* `customer_analytics_account_relationships` - customer_analytics_account_relationships'
                    ),
                key: zod.string(),
                label: zod.string().optional(),
                choices: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                searchable: zod.boolean().optional(),
                required: zod.boolean().default(insightsFunctionsCreateBodyInputsSchemaItemRequiredDefault),
                default: zod.unknown().optional(),
                secret: zod.boolean().default(insightsFunctionsCreateBodyInputsSchemaItemSecretDefault),
                hidden: zod.boolean().default(insightsFunctionsCreateBodyInputsSchemaItemHiddenDefault),
                description: zod.string().optional(),
                templating: zod.union([zod.boolean(), zod.enum(['script', 'liquid'])]).optional(),
            })
        )
        .optional()
        .describe('Schema defining the configurable input parameters for this function.'),
    inputs: zod
        .record(
            zod.string(),
            zod.object({
                value: zod.unknown().optional(),
                templating: zod.enum(['script', 'liquid']).optional().describe('\* `script` - script\n\* `liquid` - liquid'),
                bytecode: zod.array(zod.unknown()).optional(),
                order: zod.number().optional(),
                transpiled: zod.unknown().optional(),
            })
        )
        .optional()
        .describe('Values for each input defined in inputs_schema.'),
    filters: zod
        .object({
            source: zod
                .enum(['events', 'person-updates', 'data-warehouse-table'])
                .describe(
                    '\* `events` - events\n\* `person-updates` - person-updates\n\* `data-warehouse-table` - data-warehouse-table'
                )
                .default(insightsFunctionsCreateBodyFiltersOneSourceDefault),
            actions: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
            events: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
            data_warehouse: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
            properties: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
            bytecode: zod.unknown().optional(),
            transpiled: zod.unknown().optional(),
            filter_test_accounts: zod.boolean().optional(),
            bytecode_error: zod.string().optional(),
        })
        .optional()
        .describe('Event filters that control which events trigger this function.'),
    masking: zod
        .union([
            zod.object({
                ttl: zod
                    .number()
                    .min(insightsFunctionsCreateBodyMaskingOneTtlMin)
                    .max(insightsFunctionsCreateBodyMaskingOneTtlMax)
                    .describe('Time-to-live in seconds for the masking cache (60–86400).'),
                threshold: zod.number().nullish().describe('Optional threshold count before masking applies.'),
                hash: zod.string().describe('Script expression used to compute the masking hash.'),
                bytecode: zod
                    .unknown()
                    .optional()
                    .describe('Compiled bytecode for the hash expression. Auto-generated.'),
            }),
            zod.null(),
        ])
        .optional()
        .describe('PII masking configuration with TTL, threshold, and hash expression.'),
    mappings: zod
        .array(
            zod.object({
                name: zod.string().optional(),
                inputs_schema: zod
                    .array(
                        zod.object({
                            type: zod
                                .enum([
                                    'string',
                                    'number',
                                    'boolean',
                                    'dictionary',
                                    'choice',
                                    'json',
                                    'integration',
                                    'integration_multi',
                                    'integration_field',
                                    'email',
                                    'native_email',
                                    'insights_assignee',
                                    'insights_ticket_tags',
                                    'insights_business_hours',
                                    'non_failure_status_codes',
                                    'customer_analytics_account_properties',
                                    'customer_analytics_account_relationships',
                                ])
                                .describe(
                                    '\* `string` - string\n\* `number` - number\n\* `boolean` - boolean\n\* `dictionary` - dictionary\n\* `choice` - choice\n\* `json` - json\n\* `integration` - integration\n\* `integration_multi` - integration_multi\n\* `integration_field` - integration_field\n\* `email` - email\n\* `native_email` - native_email\n\* `insights_assignee` - insights_assignee\n\* `insights_ticket_tags` - insights_ticket_tags\n\* `insights_business_hours` - insights_business_hours\n\* `non_failure_status_codes` - non_failure_status_codes\n\* `customer_analytics_account_properties` - customer_analytics_account_properties\n\* `customer_analytics_account_relationships` - customer_analytics_account_relationships'
                                ),
                            key: zod.string(),
                            label: zod.string().optional(),
                            choices: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                            searchable: zod.boolean().optional(),
                            required: zod
                                .boolean()
                                .default(insightsFunctionsCreateBodyMappingsItemInputsSchemaItemRequiredDefault),
                            default: zod.unknown().optional(),
                            secret: zod
                                .boolean()
                                .default(insightsFunctionsCreateBodyMappingsItemInputsSchemaItemSecretDefault),
                            hidden: zod
                                .boolean()
                                .default(insightsFunctionsCreateBodyMappingsItemInputsSchemaItemHiddenDefault),
                            description: zod.string().optional(),
                            templating: zod.union([zod.boolean(), zod.enum(['script', 'liquid'])]).optional(),
                        })
                    )
                    .optional(),
                inputs: zod
                    .record(
                        zod.string(),
                        zod.object({
                            value: zod.unknown().optional(),
                            templating: zod
                                .enum(['script', 'liquid'])
                                .optional()
                                .describe('\* `script` - script\n\* `liquid` - liquid'),
                            bytecode: zod.array(zod.unknown()).optional(),
                            order: zod.number().optional(),
                            transpiled: zod.unknown().optional(),
                        })
                    )
                    .optional(),
                filters: zod
                    .object({
                        source: zod
                            .enum(['events', 'person-updates', 'data-warehouse-table'])
                            .describe(
                                '\* `events` - events\n\* `person-updates` - person-updates\n\* `data-warehouse-table` - data-warehouse-table'
                            )
                            .default(insightsFunctionsCreateBodyMappingsItemFiltersSourceDefault),
                        actions: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                        events: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                        data_warehouse: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                        properties: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                        filter_test_accounts: zod.boolean().optional(),
                    })
                    .optional(),
            })
        )
        .nullish()
        .describe('Event-to-destination field mappings. Only for destination and site_destination types.'),
    icon_url: zod.string().nullish().describe("URL for the function's icon displayed in the UI."),
    template_id: zod
        .string()
        .max(insightsFunctionsCreateBodyTemplateIdMax)
        .nullish()
        .describe('ID of the template to create this function from.'),
    execution_order: zod
        .number()
        .min(insightsFunctionsCreateBodyExecutionOrderMin)
        .max(insightsFunctionsCreateBodyExecutionOrderMax)
        .nullish()
        .describe('Execution priority for transformations. Lower values run first.'),
})

export const InsightsFunctionsPartialUpdateParams = /* @__PURE__ */ zod.object({
    id: zod.string().describe('A UUID string identifying this script function.'),
    project_id: zod
        .string()
        .describe(
            "Project ID of the project you're trying to access. To find the ID of the project, make a call to \/api\/projects\/."
        ),
})

export const insightsFunctionsPartialUpdateBodyNameMax = 400

export const insightsFunctionsPartialUpdateBodyInputsSchemaItemRequiredDefault = false
export const insightsFunctionsPartialUpdateBodyInputsSchemaItemSecretDefault = false
export const insightsFunctionsPartialUpdateBodyInputsSchemaItemHiddenDefault = false
export const insightsFunctionsPartialUpdateBodyFiltersOneSourceDefault = `events`
export const insightsFunctionsPartialUpdateBodyMaskingOneTtlMin = 60
export const insightsFunctionsPartialUpdateBodyMaskingOneTtlMax = 86400

export const insightsFunctionsPartialUpdateBodyMappingsItemInputsSchemaItemRequiredDefault = false
export const insightsFunctionsPartialUpdateBodyMappingsItemInputsSchemaItemSecretDefault = false
export const insightsFunctionsPartialUpdateBodyMappingsItemInputsSchemaItemHiddenDefault = false
export const insightsFunctionsPartialUpdateBodyMappingsItemFiltersSourceDefault = `events`
export const insightsFunctionsPartialUpdateBodyTemplateIdMax = 400

export const insightsFunctionsPartialUpdateBodyExecutionOrderMin = 0
export const insightsFunctionsPartialUpdateBodyExecutionOrderMax = 32767

export const InsightsFunctionsPartialUpdateBody = /* @__PURE__ */ zod.object({
    type: zod
        .union([
            zod
                .enum([
                    'destination',
                    'site_destination',
                    'internal_destination',
                    'source_webhook',
                    'warehouse_source_webhook',
                    'site_app',
                    'transformation',
                    'transformation_log',
                ])
                .describe(
                    '\* `destination` - Destination\n\* `site_destination` - Site Destination\n\* `internal_destination` - Internal Destination\n\* `source_webhook` - Source Webhook\n\* `warehouse_source_webhook` - Warehouse Source Webhook\n\* `site_app` - Site App\n\* `transformation` - Transformation\n\* `transformation_log` - Transformation Log'
                ),
            zod.null(),
        ])
        .optional()
        .describe(
            'Function type: destination, site_destination, internal_destination, source_webhook, warehouse_source_webhook, site_app, transformation, or transformation_log.\n\n\* `destination` - Destination\n\* `site_destination` - Site Destination\n\* `internal_destination` - Internal Destination\n\* `source_webhook` - Source Webhook\n\* `warehouse_source_webhook` - Warehouse Source Webhook\n\* `site_app` - Site App\n\* `transformation` - Transformation\n\* `transformation_log` - Transformation Log'
        ),
    name: zod.string().max(insightsFunctionsPartialUpdateBodyNameMax).nullish().describe('Display name for the function.'),
    description: zod.string().optional().describe('Human-readable description of what this function does.'),
    enabled: zod.boolean().optional().describe('Whether the function is active and processing events.'),
    script: zod
        .string()
        .optional()
        .describe('Source code. Script language for most types; TypeScript for site_destination and site_app.'),
    inputs_schema: zod
        .array(
            zod.object({
                type: zod
                    .enum([
                        'string',
                        'number',
                        'boolean',
                        'dictionary',
                        'choice',
                        'json',
                        'integration',
                        'integration_multi',
                        'integration_field',
                        'email',
                        'native_email',
                        'insights_assignee',
                        'insights_ticket_tags',
                        'insights_business_hours',
                        'non_failure_status_codes',
                        'customer_analytics_account_properties',
                        'customer_analytics_account_relationships',
                    ])
                    .describe(
                        '\* `string` - string\n\* `number` - number\n\* `boolean` - boolean\n\* `dictionary` - dictionary\n\* `choice` - choice\n\* `json` - json\n\* `integration` - integration\n\* `integration_multi` - integration_multi\n\* `integration_field` - integration_field\n\* `email` - email\n\* `native_email` - native_email\n\* `insights_assignee` - insights_assignee\n\* `insights_ticket_tags` - insights_ticket_tags\n\* `insights_business_hours` - insights_business_hours\n\* `non_failure_status_codes` - non_failure_status_codes\n\* `customer_analytics_account_properties` - customer_analytics_account_properties\n\* `customer_analytics_account_relationships` - customer_analytics_account_relationships'
                    ),
                key: zod.string(),
                label: zod.string().optional(),
                choices: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                searchable: zod.boolean().optional(),
                required: zod.boolean().default(insightsFunctionsPartialUpdateBodyInputsSchemaItemRequiredDefault),
                default: zod.unknown().optional(),
                secret: zod.boolean().default(insightsFunctionsPartialUpdateBodyInputsSchemaItemSecretDefault),
                hidden: zod.boolean().default(insightsFunctionsPartialUpdateBodyInputsSchemaItemHiddenDefault),
                description: zod.string().optional(),
                templating: zod.union([zod.boolean(), zod.enum(['script', 'liquid'])]).optional(),
            })
        )
        .optional()
        .describe('Schema defining the configurable input parameters for this function.'),
    inputs: zod
        .record(
            zod.string(),
            zod.object({
                value: zod.unknown().optional(),
                templating: zod.enum(['script', 'liquid']).optional().describe('\* `script` - script\n\* `liquid` - liquid'),
                bytecode: zod.array(zod.unknown()).optional(),
                order: zod.number().optional(),
                transpiled: zod.unknown().optional(),
            })
        )
        .optional()
        .describe('Values for each input defined in inputs_schema.'),
    filters: zod
        .object({
            source: zod
                .enum(['events', 'person-updates', 'data-warehouse-table'])
                .describe(
                    '\* `events` - events\n\* `person-updates` - person-updates\n\* `data-warehouse-table` - data-warehouse-table'
                )
                .default(insightsFunctionsPartialUpdateBodyFiltersOneSourceDefault),
            actions: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
            events: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
            data_warehouse: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
            properties: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
            bytecode: zod.unknown().optional(),
            transpiled: zod.unknown().optional(),
            filter_test_accounts: zod.boolean().optional(),
            bytecode_error: zod.string().optional(),
        })
        .optional()
        .describe('Event filters that control which events trigger this function.'),
    masking: zod
        .union([
            zod.object({
                ttl: zod
                    .number()
                    .min(insightsFunctionsPartialUpdateBodyMaskingOneTtlMin)
                    .max(insightsFunctionsPartialUpdateBodyMaskingOneTtlMax)
                    .describe('Time-to-live in seconds for the masking cache (60–86400).'),
                threshold: zod.number().nullish().describe('Optional threshold count before masking applies.'),
                hash: zod.string().describe('Script expression used to compute the masking hash.'),
                bytecode: zod
                    .unknown()
                    .optional()
                    .describe('Compiled bytecode for the hash expression. Auto-generated.'),
            }),
            zod.null(),
        ])
        .optional()
        .describe('PII masking configuration with TTL, threshold, and hash expression.'),
    mappings: zod
        .array(
            zod.object({
                name: zod.string().optional(),
                inputs_schema: zod
                    .array(
                        zod.object({
                            type: zod
                                .enum([
                                    'string',
                                    'number',
                                    'boolean',
                                    'dictionary',
                                    'choice',
                                    'json',
                                    'integration',
                                    'integration_multi',
                                    'integration_field',
                                    'email',
                                    'native_email',
                                    'insights_assignee',
                                    'insights_ticket_tags',
                                    'insights_business_hours',
                                    'non_failure_status_codes',
                                    'customer_analytics_account_properties',
                                    'customer_analytics_account_relationships',
                                ])
                                .describe(
                                    '\* `string` - string\n\* `number` - number\n\* `boolean` - boolean\n\* `dictionary` - dictionary\n\* `choice` - choice\n\* `json` - json\n\* `integration` - integration\n\* `integration_multi` - integration_multi\n\* `integration_field` - integration_field\n\* `email` - email\n\* `native_email` - native_email\n\* `insights_assignee` - insights_assignee\n\* `insights_ticket_tags` - insights_ticket_tags\n\* `insights_business_hours` - insights_business_hours\n\* `non_failure_status_codes` - non_failure_status_codes\n\* `customer_analytics_account_properties` - customer_analytics_account_properties\n\* `customer_analytics_account_relationships` - customer_analytics_account_relationships'
                                ),
                            key: zod.string(),
                            label: zod.string().optional(),
                            choices: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                            searchable: zod.boolean().optional(),
                            required: zod
                                .boolean()
                                .default(insightsFunctionsPartialUpdateBodyMappingsItemInputsSchemaItemRequiredDefault),
                            default: zod.unknown().optional(),
                            secret: zod
                                .boolean()
                                .default(insightsFunctionsPartialUpdateBodyMappingsItemInputsSchemaItemSecretDefault),
                            hidden: zod
                                .boolean()
                                .default(insightsFunctionsPartialUpdateBodyMappingsItemInputsSchemaItemHiddenDefault),
                            description: zod.string().optional(),
                            templating: zod.union([zod.boolean(), zod.enum(['script', 'liquid'])]).optional(),
                        })
                    )
                    .optional(),
                inputs: zod
                    .record(
                        zod.string(),
                        zod.object({
                            value: zod.unknown().optional(),
                            templating: zod
                                .enum(['script', 'liquid'])
                                .optional()
                                .describe('\* `script` - script\n\* `liquid` - liquid'),
                            bytecode: zod.array(zod.unknown()).optional(),
                            order: zod.number().optional(),
                            transpiled: zod.unknown().optional(),
                        })
                    )
                    .optional(),
                filters: zod
                    .object({
                        source: zod
                            .enum(['events', 'person-updates', 'data-warehouse-table'])
                            .describe(
                                '\* `events` - events\n\* `person-updates` - person-updates\n\* `data-warehouse-table` - data-warehouse-table'
                            )
                            .default(insightsFunctionsPartialUpdateBodyMappingsItemFiltersSourceDefault),
                        actions: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                        events: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                        data_warehouse: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                        properties: zod.array(zod.record(zod.string(), zod.unknown())).optional(),
                        filter_test_accounts: zod.boolean().optional(),
                    })
                    .optional(),
            })
        )
        .nullish()
        .describe('Event-to-destination field mappings. Only for destination and site_destination types.'),
    icon_url: zod.string().nullish().describe("URL for the function's icon displayed in the UI."),
    template_id: zod
        .string()
        .max(insightsFunctionsPartialUpdateBodyTemplateIdMax)
        .nullish()
        .describe('ID of the template to create this function from.'),
    execution_order: zod
        .number()
        .min(insightsFunctionsPartialUpdateBodyExecutionOrderMin)
        .max(insightsFunctionsPartialUpdateBodyExecutionOrderMax)
        .nullish()
        .describe('Execution priority for transformations. Lower values run first.'),
})

/**
 * Hard delete of this model is not allowed. Use a patch API call to set "deleted" to true
 */
export const InsightsFunctionsDestroyParams = /* @__PURE__ */ zod.object({
    id: zod.string().describe('A UUID string identifying this script function.'),
    project_id: zod
        .string()
        .describe(
            "Project ID of the project you're trying to access. To find the ID of the project, make a call to \/api\/projects\/."
        ),
})
