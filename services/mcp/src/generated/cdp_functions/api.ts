/**
 * Auto-generated from the Django backend OpenAPI schema.
 * MCP service uses these Zod schemas for generated tool handlers.
 * To regenerate: insightscli build:openapi
 *
 * Insights API - MCP 9 enabled ops
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

export const InsightsFunctionsRetrieveParams = /* @__PURE__ */ zod.object({
    id: zod.string().describe('A UUID string identifying this script function.'),
    project_id: zod
        .string()
        .describe(
            "Project ID of the project you're trying to access. To find the ID of the project, make a call to \/api\/projects\/."
        ),
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

export const InsightsFunctionsInvocationsCreateParams = /* @__PURE__ */ zod.object({
    id: zod.string().describe('A UUID string identifying this script function.'),
    project_id: zod
        .string()
        .describe(
            "Project ID of the project you're trying to access. To find the ID of the project, make a call to \/api\/projects\/."
        ),
})

export const insightsFunctionsInvocationsCreateBodyConfigurationOneNameMax = 400

export const insightsFunctionsInvocationsCreateBodyConfigurationOneCreatedByOneDistinctIdMax = 200

export const insightsFunctionsInvocationsCreateBodyConfigurationOneCreatedByOneFirstNameMax = 150

export const insightsFunctionsInvocationsCreateBodyConfigurationOneCreatedByOneLastNameMax = 150

export const insightsFunctionsInvocationsCreateBodyConfigurationOneCreatedByOneEmailMax = 254

export const insightsFunctionsInvocationsCreateBodyConfigurationOneInputsSchemaItemRequiredDefault = false
export const insightsFunctionsInvocationsCreateBodyConfigurationOneInputsSchemaItemSecretDefault = false
export const insightsFunctionsInvocationsCreateBodyConfigurationOneInputsSchemaItemHiddenDefault = false
export const insightsFunctionsInvocationsCreateBodyConfigurationOneFiltersOneSourceDefault = `events`
export const insightsFunctionsInvocationsCreateBodyConfigurationOneMaskingOneTtlMin = 60
export const insightsFunctionsInvocationsCreateBodyConfigurationOneMaskingOneTtlMax = 86400

export const insightsFunctionsInvocationsCreateBodyConfigurationOneMappingsItemInputsSchemaItemRequiredDefault = false
export const insightsFunctionsInvocationsCreateBodyConfigurationOneMappingsItemInputsSchemaItemSecretDefault = false
export const insightsFunctionsInvocationsCreateBodyConfigurationOneMappingsItemInputsSchemaItemHiddenDefault = false
export const insightsFunctionsInvocationsCreateBodyConfigurationOneMappingsItemFiltersSourceDefault = `events`
export const insightsFunctionsInvocationsCreateBodyConfigurationOneTemplateOneNameMax = 400

export const insightsFunctionsInvocationsCreateBodyConfigurationOneTemplateOneCodeLanguageMax = 20

export const insightsFunctionsInvocationsCreateBodyConfigurationOneTemplateOneTypeMax = 50

export const insightsFunctionsInvocationsCreateBodyConfigurationOneTemplateOneStatusMax = 20

export const insightsFunctionsInvocationsCreateBodyConfigurationOneTemplateIdMax = 400

export const insightsFunctionsInvocationsCreateBodyConfigurationOneExecutionOrderMin = 0
export const insightsFunctionsInvocationsCreateBodyConfigurationOneExecutionOrderMax = 32767

export const insightsFunctionsInvocationsCreateBodyMockAsyncFunctionsDefault = true

export const InsightsFunctionsInvocationsCreateBody = /* @__PURE__ */ zod.object({
    configuration: zod
        .object({
            id: zod.string().optional(),
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
            name: zod
                .string()
                .max(insightsFunctionsInvocationsCreateBodyConfigurationOneNameMax)
                .nullish()
                .describe('Display name for the function.'),
            description: zod.string().optional().describe('Human-readable description of what this function does.'),
            created_at: zod.iso.datetime({ offset: true }).optional(),
            created_by: zod
                .object({
                    id: zod.number().optional(),
                    uuid: zod.string().optional(),
                    distinct_id: zod
                        .string()
                        .max(insightsFunctionsInvocationsCreateBodyConfigurationOneCreatedByOneDistinctIdMax)
                        .nullish(),
                    first_name: zod
                        .string()
                        .max(insightsFunctionsInvocationsCreateBodyConfigurationOneCreatedByOneFirstNameMax)
                        .optional(),
                    last_name: zod
                        .string()
                        .max(insightsFunctionsInvocationsCreateBodyConfigurationOneCreatedByOneLastNameMax)
                        .optional(),
                    email: zod.email().max(insightsFunctionsInvocationsCreateBodyConfigurationOneCreatedByOneEmailMax),
                    is_email_verified: zod.boolean().nullish(),
                    mascot_config: zod.record(zod.string(), zod.unknown()).nullish(),
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
                                    'other',
                                ])
                                .describe(
                                    '\* `engineering` - Engineering\n\* `data` - Data\n\* `product` - Product Management\n\* `founder` - Founder\n\* `leadership` - Leadership\n\* `marketing` - Marketing\n\* `sales` - Sales \/ Success\n\* `other` - Other'
                                ),
                            zod.enum(['']),
                            zod.null(),
                        ])
                        .optional(),
                })
                .optional(),
            updated_at: zod.iso.datetime({ offset: true }).optional(),
            enabled: zod.boolean().optional().describe('Whether the function is active and processing events.'),
            deleted: zod.boolean().optional().describe('Soft-delete flag. Set to true to archive the function.'),
            script: zod
                .string()
                .optional()
                .describe('Source code. Script language for most types; TypeScript for site_destination and site_app.'),
            bytecode: zod.unknown().optional(),
            transpiled: zod.string().nullish(),
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
                            .default(insightsFunctionsInvocationsCreateBodyConfigurationOneInputsSchemaItemRequiredDefault),
                        default: zod.unknown().optional(),
                        secret: zod
                            .boolean()
                            .default(insightsFunctionsInvocationsCreateBodyConfigurationOneInputsSchemaItemSecretDefault),
                        hidden: zod
                            .boolean()
                            .default(insightsFunctionsInvocationsCreateBodyConfigurationOneInputsSchemaItemHiddenDefault),
                        description: zod.string().optional(),
                        integration: zod.string().optional(),
                        integration_key: zod.string().optional(),
                        requires_field: zod.string().optional(),
                        integration_field: zod.string().optional(),
                        requiredScopes: zod.string().optional(),
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
                        templating: zod
                            .enum(['script', 'liquid'])
                            .optional()
                            .describe('\* `script` - script\n\* `liquid` - liquid'),
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
                        .default(insightsFunctionsInvocationsCreateBodyConfigurationOneFiltersOneSourceDefault),
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
                            .min(insightsFunctionsInvocationsCreateBodyConfigurationOneMaskingOneTtlMin)
                            .max(insightsFunctionsInvocationsCreateBodyConfigurationOneMaskingOneTtlMax)
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
                                        .default(
                                            insightsFunctionsInvocationsCreateBodyConfigurationOneMappingsItemInputsSchemaItemRequiredDefault
                                        ),
                                    default: zod.unknown().optional(),
                                    secret: zod
                                        .boolean()
                                        .default(
                                            insightsFunctionsInvocationsCreateBodyConfigurationOneMappingsItemInputsSchemaItemSecretDefault
                                        ),
                                    hidden: zod
                                        .boolean()
                                        .default(
                                            insightsFunctionsInvocationsCreateBodyConfigurationOneMappingsItemInputsSchemaItemHiddenDefault
                                        ),
                                    description: zod.string().optional(),
                                    integration: zod.string().optional(),
                                    integration_key: zod.string().optional(),
                                    requires_field: zod.string().optional(),
                                    integration_field: zod.string().optional(),
                                    requiredScopes: zod.string().optional(),
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
                                    .default(
                                        insightsFunctionsInvocationsCreateBodyConfigurationOneMappingsItemFiltersSourceDefault
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
                            .optional(),
                    })
                )
                .nullish()
                .describe('Event-to-destination field mappings. Only for destination and site_destination types.'),
            icon_url: zod.string().nullish().describe("URL for the function's icon displayed in the UI."),
            template: zod
                .object({
                    id: zod.string().describe("Unique template identifier (e.g. 'template-slack')."),
                    name: zod
                        .string()
                        .max(insightsFunctionsInvocationsCreateBodyConfigurationOneTemplateOneNameMax)
                        .describe('Display name of the template.'),
                    description: zod.string().nullish().describe('What this template does.'),
                    code: zod.string().describe('Source code of the template.'),
                    code_language: zod
                        .string()
                        .max(insightsFunctionsInvocationsCreateBodyConfigurationOneTemplateOneCodeLanguageMax)
                        .optional()
                        .describe("Programming language: 'script' or 'javascript'."),
                    inputs_schema: zod
                        .unknown()
                        .describe('Schema defining configurable inputs for functions created from this template.'),
                    type: zod
                        .string()
                        .max(insightsFunctionsInvocationsCreateBodyConfigurationOneTemplateOneTypeMax)
                        .describe('Function type this template creates.'),
                    status: zod
                        .string()
                        .max(insightsFunctionsInvocationsCreateBodyConfigurationOneTemplateOneStatusMax)
                        .optional()
                        .describe('Lifecycle status: alpha, beta, stable, deprecated, or hidden.'),
                    category: zod.unknown().optional().describe('Category tags for organizing templates.'),
                    free: zod.boolean().optional().describe('Whether available on free plans.'),
                    icon_url: zod.string().nullish().describe("URL for the template's icon."),
                    filters: zod.unknown().optional().describe('Default event filters.'),
                    masking: zod.unknown().optional().describe('Default PII masking configuration.'),
                    mapping_templates: zod
                        .array(
                            zod.object({
                                name: zod.string().describe('Name of this mapping template.'),
                                include_by_default: zod
                                    .boolean()
                                    .nullish()
                                    .describe('Whether this mapping is enabled by default.'),
                                use_all_events_by_default: zod
                                    .boolean()
                                    .nullish()
                                    .describe(
                                        'Whether this mapping should match all events by default, hiding the event filter UI.'
                                    ),
                                filters: zod.unknown().optional().describe('Event filters specific to this mapping.'),
                                inputs: zod.unknown().optional().describe('Input values specific to this mapping.'),
                                inputs_schema: zod
                                    .unknown()
                                    .optional()
                                    .describe('Additional input schema fields specific to this mapping.'),
                            })
                        )
                        .nullish()
                        .describe('Pre-defined mapping configurations for destination templates.'),
                })
                .optional(),
            template_id: zod
                .string()
                .max(insightsFunctionsInvocationsCreateBodyConfigurationOneTemplateIdMax)
                .nullish()
                .describe('ID of the template to create this function from.'),
            status: zod
                .union([
                    zod.object({
                        state: zod
                            .union([
                                zod.literal(0),
                                zod.literal(1),
                                zod.literal(2),
                                zod.literal(3),
                                zod.literal(11),
                                zod.literal(12),
                            ])
                            .describe('\* `0` - 0\n\* `1` - 1\n\* `2` - 2\n\* `3` - 3\n\* `11` - 11\n\* `12` - 12'),
                        tokens: zod.number(),
                    }),
                    zod.null(),
                ])
                .optional(),
            execution_order: zod
                .number()
                .min(insightsFunctionsInvocationsCreateBodyConfigurationOneExecutionOrderMin)
                .max(insightsFunctionsInvocationsCreateBodyConfigurationOneExecutionOrderMax)
                .nullish()
                .describe('Execution priority for transformations. Lower values run first.'),
            _create_in_folder: zod.string().optional(),
            batch_export_id: zod.string().nullish(),
            search_match_type: zod
                .union([zod.enum(['exact', 'similar']), zod.null()])
                .optional()
                .describe(
                    'How this row matched the `search` query parameter: `exact` (the term is a case-insensitive substring of a searched field) or `similar` (a fuzzy trigram match, returned only when no exact match exists). Null when the list is not filtered by `search`.'
                ),
        })
        .describe('Full function configuration to test.'),
    globals: zod
        .record(zod.string(), zod.unknown())
        .optional()
        .describe('Mock global variables available during test invocation.'),
    datastore_event: zod
        .record(zod.string(), zod.unknown())
        .optional()
        .describe('Mock Datastore event data to test the function with.'),
    mock_async_functions: zod
        .boolean()
        .default(insightsFunctionsInvocationsCreateBodyMockAsyncFunctionsDefault)
        .describe('When true (default), async functions like fetch() are simulated.'),
    invocation_id: zod.string().nullish().describe('Optional invocation ID for correlation.'),
})

export const InsightsFunctionsLogsRetrieveParams = /* @__PURE__ */ zod.object({
    id: zod.string().describe('A UUID string identifying this script function.'),
    project_id: zod
        .string()
        .describe(
            "Project ID of the project you're trying to access. To find the ID of the project, make a call to \/api\/projects\/."
        ),
})

export const insightsFunctionsLogsRetrieveQueryLimitDefault = 50
export const insightsFunctionsLogsRetrieveQueryLimitMax = 500

export const InsightsFunctionsLogsRetrieveQueryParams = /* @__PURE__ */ zod.object({
    after: zod.iso.datetime({ offset: true }).optional().describe('Only return entries after this ISO 8601 timestamp.'),
    before: zod.iso
        .datetime({ offset: true })
        .optional()
        .describe('Only return entries before this ISO 8601 timestamp.'),
    instance_id: zod.string().min(1).optional().describe('Filter logs to a specific execution instance.'),
    level: zod
        .string()
        .min(1)
        .optional()
        .describe(
            "Comma-separated log levels to include, e.g. 'WARN,ERROR'. Valid levels: DEBUG, LOG, INFO, WARN, ERROR."
        ),
    limit: zod
        .number()
        .min(1)
        .max(insightsFunctionsLogsRetrieveQueryLimitMax)
        .default(insightsFunctionsLogsRetrieveQueryLimitDefault)
        .describe('Maximum number of log entries to return (1-500, default 50).'),
    search: zod.string().min(1).optional().describe('Case-insensitive substring search across log messages.'),
})

export const InsightsFunctionsMetricsRetrieveParams = /* @__PURE__ */ zod.object({
    id: zod.string().describe('A UUID string identifying this script function.'),
    project_id: zod
        .string()
        .describe(
            "Project ID of the project you're trying to access. To find the ID of the project, make a call to \/api\/projects\/."
        ),
})

export const insightsFunctionsMetricsRetrieveQueryAfterDefault = `-7d`

export const insightsFunctionsMetricsRetrieveQueryBreakdownByDefault = `kind`
export const insightsFunctionsMetricsRetrieveQueryIntervalDefault = `day`

export const InsightsFunctionsMetricsRetrieveQueryParams = /* @__PURE__ */ zod.object({
    after: zod
        .string()
        .min(1)
        .default(insightsFunctionsMetricsRetrieveQueryAfterDefault)
        .describe(
            "Start of the time range. Accepts relative formats like '-7d', '-24h' or ISO 8601 timestamps. Defaults to '-7d'."
        ),
    before: zod.string().min(1).optional().describe("End of the time range. Same format as 'after'. Defaults to now."),
    breakdown_by: zod
        .enum(['name', 'kind'])
        .default(insightsFunctionsMetricsRetrieveQueryBreakdownByDefault)
        .describe(
            "Group the series by metric 'name' or 'kind'. Defaults to 'kind'.\n\n\* `name` - name\n\* `kind` - kind"
        ),
    instance_id: zod.string().min(1).optional().describe('Filter metrics to a specific execution instance.'),
    interval: zod
        .enum(['hour', 'day', 'week'])
        .default(insightsFunctionsMetricsRetrieveQueryIntervalDefault)
        .describe(
            "Time bucket size for the series. One of: hour, day, week. Defaults to 'day'.\n\n\* `hour` - hour\n\* `day` - day\n\* `week` - week"
        ),
    kind: zod.string().min(1).optional().describe("Comma-separated metric kinds to filter by, e.g. 'success,failure'."),
    name: zod.string().min(1).optional().describe('Comma-separated metric names to filter by.'),
})

/**
 * Update the execution order of multiple InsightsFunctions.
 */
export const InsightsFunctionsRearrangePartialUpdateParams = /* @__PURE__ */ zod.object({
    project_id: zod
        .string()
        .describe(
            "Project ID of the project you're trying to access. To find the ID of the project, make a call to \/api\/projects\/."
        ),
})

export const InsightsFunctionsRearrangePartialUpdateBody = /* @__PURE__ */ zod.object({
    orders: zod
        .record(zod.string(), zod.number())
        .optional()
        .describe('Map of script function UUIDs to their new execution_order values.'),
})
