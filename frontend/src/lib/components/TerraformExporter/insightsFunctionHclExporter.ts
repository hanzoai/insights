import { formatJsonForHcl } from 'lib/components/TerraformExporter/hclExporterFormattingUtils'

import { CyclotronJobFiltersType, CyclotronJobInputType, InsightsFunctionMappingType, InsightsFunctionType } from '~/types'

import { FieldMapping, HclExportOptions, HclExportResult, ResourceExporter, generateHCL } from './hclExporter'

type StrippedInput = Omit<CyclotronJobInputType, 'bytecode' | 'order'>
type StrippedFilters = Omit<CyclotronJobFiltersType, 'bytecode'>

export interface InsightsFunctionHclExportOptions extends HclExportOptions {
    /** Map of alert IDs to their TF references */
    alertIdReplacements?: Map<string, string>
}

/**
 * @see https://registry.terraform.io/providers/Insights/insights/latest/docs/resources/insights_function
 */
const INSIGHTS_FUNCTION_FIELD_MAPPINGS: FieldMapping<Partial<InsightsFunctionType>, InsightsFunctionHclExportOptions>[] = [
    {
        source: 'name',
        target: 'name',
        shouldInclude: (v) => !!v,
    },
    {
        source: 'description',
        target: 'description',
        shouldInclude: (v) => !!v,
    },
    {
        source: 'type',
        target: 'type',
        shouldInclude: (v) => !!v,
    },
    {
        source: 'enabled',
        target: 'enabled',
        shouldInclude: () => true,
    },
    {
        source: 'execution_order',
        target: 'execution_order',
        shouldInclude: (v) => v !== undefined && v !== null,
    },
    {
        source: 'iql',
        target: 'iql',
        shouldInclude: (v) => !!v,
    },
    {
        source: 'inputs',
        target: 'inputs_json',
        shouldInclude: (v) => !!v && typeof v === 'object' && Object.keys(v as object).length > 0,
        transform: (_, resource) => {
            const stripped = stripInputsServerFields(resource.inputs)
            return `jsonencode(${formatJsonForHcl(stripped)})`
        },
    },
    {
        source: 'filters',
        target: 'filters_json',
        shouldInclude: (v) => !!v && typeof v === 'object' && Object.keys(v as object).length > 0,
        transform: (_, resource, options) => {
            const stripped = stripFiltersServerFields(resource.filters)
            let result = `jsonencode(${formatJsonForHcl(stripped)})`
            if (options.alertIdReplacements?.size) {
                for (const [alertId, tfRef] of options.alertIdReplacements) {
                    result = result.replace(new RegExp(`"${alertId}"`, 'g'), tfRef)
                }
            }
            return result
        },
    },
    {
        source: 'mappings',
        target: 'mappings_json',
        shouldInclude: (v) => Array.isArray(v) && v.length > 0,
        transform: (_, resource) => {
            const stripped = stripMappingsServerFields(resource.mappings)
            return `jsonencode(${formatJsonForHcl(stripped)})`
        },
    },
    {
        source: 'masking',
        target: 'masking_json',
        shouldInclude: (v) => !!v && typeof v === 'object' && Object.keys(v as object).length > 0,
        transform: (v) => `jsonencode(${formatJsonForHcl(v)})`,
    },
    {
        source: 'template',
        target: 'template_id',
        shouldInclude: (v) => !!(v as InsightsFunctionType['template'])?.id,
        transform: (v) => `"${(v as InsightsFunctionType['template'])?.id}"`,
    },
    {
        source: 'icon_url',
        target: 'icon_url',
        shouldInclude: (v) => !!v,
    },
]

function validateInsightsFunction(
    insightsFunction: Partial<InsightsFunctionType>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars Needed to align with interface
    _options: InsightsFunctionHclExportOptions
): string[] {
    const warnings: string[] = []

    if (!insightsFunction.name) {
        warnings.push('No name provided. Consider adding a name for better identification in Terraform state.')
    }

    if (insightsFunction.inputs) {
        const secretInputs = Object.entries(insightsFunction.inputs).filter(([, input]) => input?.secret)
        if (secretInputs.length > 0) {
            warnings.push(
                `Secret inputs (${secretInputs.map(([k]) => k).join(', ')}) in the export, please be careful when handling this file!`
            )
        }
    }

    return warnings
}

const INSIGHTS_FUNCTION_EXPORTER: ResourceExporter<Partial<InsightsFunctionType>, InsightsFunctionHclExportOptions> = {
    resourceType: 'insights_insights_function',
    resourceLabel: 'insights_function',
    fieldMappings: INSIGHTS_FUNCTION_FIELD_MAPPINGS,
    validate: validateInsightsFunction,
    getResourceName: (h) => h.name || `insights_function_${h.id || 'new'}`,
    getId: (h) => h.id,
}

export function generateInsightsFunctionHCL(
    insightsFunction: Partial<InsightsFunctionType>,
    options: InsightsFunctionHclExportOptions = {}
): HclExportResult {
    return generateHCL(insightsFunction, INSIGHTS_FUNCTION_EXPORTER, options)
}

function stripInputServerFields(input: CyclotronJobInputType | null): StrippedInput | null {
    if (!input) {
        return null
    }
    const { bytecode, order, ...rest } = input
    return rest
}

export function stripInputsServerFields(
    inputs: Record<string, CyclotronJobInputType | null> | null | undefined
): Record<string, StrippedInput | null> | null | undefined {
    if (!inputs) {
        return inputs
    }
    return Object.fromEntries(Object.entries(inputs).map(([key, input]) => [key, stripInputServerFields(input)]))
}

export function stripFiltersServerFields(
    filters: CyclotronJobFiltersType | null | undefined
): StrippedFilters | null | undefined {
    if (!filters) {
        return filters
    }
    const { bytecode, ...rest } = filters
    return rest
}

export function stripMappingsServerFields(
    mappings: InsightsFunctionMappingType[] | null | undefined
): InsightsFunctionMappingType[] | null | undefined {
    if (!mappings) {
        return mappings
    }
    return mappings.map((mapping) => ({
        ...mapping,
        inputs: stripInputsServerFields(mapping.inputs) as Record<string, CyclotronJobInputType> | null | undefined,
        filters: stripFiltersServerFields(mapping.filters) as CyclotronJobFiltersType | null | undefined,
    }))
}
