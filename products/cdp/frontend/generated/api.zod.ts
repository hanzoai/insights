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
    deleted: zod.boolean().optional().describe('Soft-delete flag. Set to true to archive the function.'),
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
                templating: zod.enum(['script', 'liquid']).optional().describe('\* `script` - script\n\* `liquid` - liquid'),
                bytecode: zod.array(zod.unknown()),
                order: zod.number(),
                transpiled: zod.unknown(),
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
                            bytecode: zod.array(zod.unknown()),
                            order: zod.number(),
                            transpiled: zod.unknown(),
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
    _create_in_folder: zod.string().optional(),
})

export const insightsFunctionsUpdateBodyNameMax = 400

export const insightsFunctionsUpdateBodyInputsSchemaItemRequiredDefault = false
export const insightsFunctionsUpdateBodyInputsSchemaItemSecretDefault = false
export const insightsFunctionsUpdateBodyInputsSchemaItemHiddenDefault = false
export const insightsFunctionsUpdateBodyFiltersOneSourceDefault = `events`
export const insightsFunctionsUpdateBodyMaskingOneTtlMin = 60
export const insightsFunctionsUpdateBodyMaskingOneTtlMax = 86400

export const insightsFunctionsUpdateBodyMappingsItemInputsSchemaItemRequiredDefault = false
export const insightsFunctionsUpdateBodyMappingsItemInputsSchemaItemSecretDefault = false
export const insightsFunctionsUpdateBodyMappingsItemInputsSchemaItemHiddenDefault = false
export const insightsFunctionsUpdateBodyMappingsItemFiltersSourceDefault = `events`
export const insightsFunctionsUpdateBodyTemplateIdMax = 400

export const insightsFunctionsUpdateBodyExecutionOrderMin = 0
export const insightsFunctionsUpdateBodyExecutionOrderMax = 32767

export const InsightsFunctionsUpdateBody = /* @__PURE__ */ zod.object({
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
    name: zod.string().max(insightsFunctionsUpdateBodyNameMax).nullish().describe('Display name for the function.'),
    description: zod.string().optional().describe('Human-readable description of what this function does.'),
    enabled: zod.boolean().optional().describe('Whether the function is active and processing events.'),
    deleted: zod.boolean().optional().describe('Soft-delete flag. Set to true to archive the function.'),
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
                required: zod.boolean().default(insightsFunctionsUpdateBodyInputsSchemaItemRequiredDefault),
                default: zod.unknown().optional(),
                secret: zod.boolean().default(insightsFunctionsUpdateBodyInputsSchemaItemSecretDefault),
                hidden: zod.boolean().default(insightsFunctionsUpdateBodyInputsSchemaItemHiddenDefault),
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
                templating: zod.enum(['script', 'liquid']).optional().describe('\* `script` - script\n\* `liquid` - liquid'),
                bytecode: zod.array(zod.unknown()),
                order: zod.number(),
                transpiled: zod.unknown(),
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
                .default(insightsFunctionsUpdateBodyFiltersOneSourceDefault),
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
                    .min(insightsFunctionsUpdateBodyMaskingOneTtlMin)
                    .max(insightsFunctionsUpdateBodyMaskingOneTtlMax)
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
                                .default(insightsFunctionsUpdateBodyMappingsItemInputsSchemaItemRequiredDefault),
                            default: zod.unknown().optional(),
                            secret: zod
                                .boolean()
                                .default(insightsFunctionsUpdateBodyMappingsItemInputsSchemaItemSecretDefault),
                            hidden: zod
                                .boolean()
                                .default(insightsFunctionsUpdateBodyMappingsItemInputsSchemaItemHiddenDefault),
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
                            bytecode: zod.array(zod.unknown()),
                            order: zod.number(),
                            transpiled: zod.unknown(),
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
                            .default(insightsFunctionsUpdateBodyMappingsItemFiltersSourceDefault),
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
    template_id: zod
        .string()
        .max(insightsFunctionsUpdateBodyTemplateIdMax)
        .nullish()
        .describe('ID of the template to create this function from.'),
    execution_order: zod
        .number()
        .min(insightsFunctionsUpdateBodyExecutionOrderMin)
        .max(insightsFunctionsUpdateBodyExecutionOrderMax)
        .nullish()
        .describe('Execution priority for transformations. Lower values run first.'),
    _create_in_folder: zod.string().optional(),
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
    deleted: zod.boolean().optional().describe('Soft-delete flag. Set to true to archive the function.'),
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
                templating: zod.enum(['script', 'liquid']).optional().describe('\* `script` - script\n\* `liquid` - liquid'),
                bytecode: zod.array(zod.unknown()),
                order: zod.number(),
                transpiled: zod.unknown(),
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
                            bytecode: zod.array(zod.unknown()),
                            order: zod.number(),
                            transpiled: zod.unknown(),
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
    _create_in_folder: zod.string().optional(),
})

export const insightsFunctionsEnableBackfillsCreateBodyNameMax = 400

export const insightsFunctionsEnableBackfillsCreateBodyInputsSchemaItemRequiredDefault = false
export const insightsFunctionsEnableBackfillsCreateBodyInputsSchemaItemSecretDefault = false
export const insightsFunctionsEnableBackfillsCreateBodyInputsSchemaItemHiddenDefault = false
export const insightsFunctionsEnableBackfillsCreateBodyFiltersOneSourceDefault = `events`
export const insightsFunctionsEnableBackfillsCreateBodyMaskingOneTtlMin = 60
export const insightsFunctionsEnableBackfillsCreateBodyMaskingOneTtlMax = 86400

export const insightsFunctionsEnableBackfillsCreateBodyMappingsItemInputsSchemaItemRequiredDefault = false
export const insightsFunctionsEnableBackfillsCreateBodyMappingsItemInputsSchemaItemSecretDefault = false
export const insightsFunctionsEnableBackfillsCreateBodyMappingsItemInputsSchemaItemHiddenDefault = false
export const insightsFunctionsEnableBackfillsCreateBodyMappingsItemFiltersSourceDefault = `events`
export const insightsFunctionsEnableBackfillsCreateBodyTemplateIdMax = 400

export const insightsFunctionsEnableBackfillsCreateBodyExecutionOrderMin = 0
export const insightsFunctionsEnableBackfillsCreateBodyExecutionOrderMax = 32767

export const InsightsFunctionsEnableBackfillsCreateBody = /* @__PURE__ */ zod.object({
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
        .max(insightsFunctionsEnableBackfillsCreateBodyNameMax)
        .nullish()
        .describe('Display name for the function.'),
    description: zod.string().optional().describe('Human-readable description of what this function does.'),
    enabled: zod.boolean().optional().describe('Whether the function is active and processing events.'),
    deleted: zod.boolean().optional().describe('Soft-delete flag. Set to true to archive the function.'),
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
                required: zod.boolean().default(insightsFunctionsEnableBackfillsCreateBodyInputsSchemaItemRequiredDefault),
                default: zod.unknown().optional(),
                secret: zod.boolean().default(insightsFunctionsEnableBackfillsCreateBodyInputsSchemaItemSecretDefault),
                hidden: zod.boolean().default(insightsFunctionsEnableBackfillsCreateBodyInputsSchemaItemHiddenDefault),
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
                templating: zod.enum(['script', 'liquid']).optional().describe('\* `script` - script\n\* `liquid` - liquid'),
                bytecode: zod.array(zod.unknown()),
                order: zod.number(),
                transpiled: zod.unknown(),
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
                .default(insightsFunctionsEnableBackfillsCreateBodyFiltersOneSourceDefault),
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
                    .min(insightsFunctionsEnableBackfillsCreateBodyMaskingOneTtlMin)
                    .max(insightsFunctionsEnableBackfillsCreateBodyMaskingOneTtlMax)
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
                                    insightsFunctionsEnableBackfillsCreateBodyMappingsItemInputsSchemaItemRequiredDefault
                                ),
                            default: zod.unknown().optional(),
                            secret: zod
                                .boolean()
                                .default(
                                    insightsFunctionsEnableBackfillsCreateBodyMappingsItemInputsSchemaItemSecretDefault
                                ),
                            hidden: zod
                                .boolean()
                                .default(
                                    insightsFunctionsEnableBackfillsCreateBodyMappingsItemInputsSchemaItemHiddenDefault
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
                            bytecode: zod.array(zod.unknown()),
                            order: zod.number(),
                            transpiled: zod.unknown(),
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
                            .default(insightsFunctionsEnableBackfillsCreateBodyMappingsItemFiltersSourceDefault),
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
    template_id: zod
        .string()
        .max(insightsFunctionsEnableBackfillsCreateBodyTemplateIdMax)
        .nullish()
        .describe('ID of the template to create this function from.'),
    execution_order: zod
        .number()
        .min(insightsFunctionsEnableBackfillsCreateBodyExecutionOrderMin)
        .max(insightsFunctionsEnableBackfillsCreateBodyExecutionOrderMax)
        .nullish()
        .describe('Execution priority for transformations. Lower values run first.'),
    _create_in_folder: zod.string().optional(),
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
            id: zod.uuid(),
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
            created_at: zod.iso.datetime({ offset: true }),
            created_by: zod.object({
                id: zod.number(),
                uuid: zod.uuid(),
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
                                'other',
                            ])
                            .describe(
                                '\* `engineering` - Engineering\n\* `data` - Data\n\* `product` - Product Management\n\* `founder` - Founder\n\* `leadership` - Leadership\n\* `marketing` - Marketing\n\* `sales` - Sales \/ Success\n\* `other` - Other'
                            ),
                        zod.enum(['']),
                        zod.null(),
                    ])
                    .optional(),
            }),
            updated_at: zod.iso.datetime({ offset: true }),
            enabled: zod.boolean().optional().describe('Whether the function is active and processing events.'),
            deleted: zod.boolean().optional().describe('Soft-delete flag. Set to true to archive the function.'),
            script: zod
                .string()
                .optional()
                .describe('Source code. Script language for most types; TypeScript for site_destination and site_app.'),
            bytecode: zod.unknown(),
            transpiled: zod.string().nullable(),
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
                        bytecode: zod.array(zod.unknown()),
                        order: zod.number(),
                        transpiled: zod.unknown(),
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
                                    bytecode: zod.array(zod.unknown()),
                                    order: zod.number(),
                                    transpiled: zod.unknown(),
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
            template: zod.object({
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
            }),
            template_id: zod
                .string()
                .max(insightsFunctionsInvocationsCreateBodyConfigurationOneTemplateIdMax)
                .nullish()
                .describe('ID of the template to create this function from.'),
            status: zod.union([
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
            ]),
            execution_order: zod
                .number()
                .min(insightsFunctionsInvocationsCreateBodyConfigurationOneExecutionOrderMin)
                .max(insightsFunctionsInvocationsCreateBodyConfigurationOneExecutionOrderMax)
                .nullish()
                .describe('Execution priority for transformations. Lower values run first.'),
            _create_in_folder: zod.string().optional(),
            batch_export_id: zod.uuid().nullable(),
            search_match_type: zod
                .union([zod.enum(['exact', 'similar']), zod.null()])
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

/**
 * Rerun past invocations of this script function from their stored payloads.
 *
 * The CDP worker reads matching rows from the `hog_invocation_results`
 * Datastore table, rehydrates the invocation from the stored
 * `invocation_globals`, and re-enqueues onto cyclotron. Each rerun
 * run reuses the original `invocation_id` with `is_retry=1` set on the
 * new lifecycle row so the UI can surface that it was a rerun.
 *
 * Only types a cyclotron worker executes (`TYPES_THAT_CAN_RERUN`) can be
 * rerun: rerun re-enqueues onto the cyclotron script queue, and other types
 * run elsewhere (source webhooks inline in the cdp-api HTTP handler,
 * transformations during ingestion, `site_*` transpiled to client-side
 * JS). A re-enqueued invocation of one of those would never drain and
 * wedges the partition, so a rerun of a non-rerunnable type is rejected
 * with a 400 here.
 *
 * Because rerun replays historical event/person/group data, it requires
 * `person:read` and `group:read` on top of `insights_function:write`.
 */
export const insightsFunctionsRerunCreateBodyFilterOneMaxAttemptsMax = 255

export const insightsFunctionsRerunCreateBodyFilterOneMaxCountMax = 10000

export const insightsFunctionsRerunCreateBodyFilterOneInvocationIdsMax = 10000

export const InsightsFunctionsRerunCreateBody = /* @__PURE__ */ zod
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
                    .max(insightsFunctionsRerunCreateBodyFilterOneMaxAttemptsMax)
                    .optional()
                    .describe('Skip invocations that have already been attempted this many times or more.'),
                max_count: zod
                    .number()
                    .min(1)
                    .max(insightsFunctionsRerunCreateBodyFilterOneMaxCountMax)
                    .optional()
                    .describe('Maximum number of invocations to rerun in this request. Server-side cap is 10000.'),
                invocation_ids: zod
                    .array(zod.string())
                    .max(insightsFunctionsRerunCreateBodyFilterOneInvocationIdsMax)
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

/**
 * Update the execution order of multiple InsightsFunctions.
 */
export const InsightsFunctionsRearrangePartialUpdateBody = /* @__PURE__ */ zod.object({
    orders: zod
        .record(zod.string(), zod.number())
        .optional()
        .describe('Map of script function UUIDs to their new execution_order values.'),
})
