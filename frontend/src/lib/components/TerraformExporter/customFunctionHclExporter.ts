import { formatJsonForHcl } from 'lib/components/TerraformExporter/hclExporterFormattingUtils'

import { CyclotronJobFiltersType, CyclotronJobInputType, CustomFunctionMappingType, CustomFunctionType } from '~/types'

import { FieldMapping, HclExportOptions, HclExportResult, ResourceExporter, generateHCL } from './hclExporter'

type StrippedInput = Omit<CyclotronJobInputType, 'bytecode' | 'order'>
type StrippedFilters = Omit<CyclotronJobFiltersType, 'bytecode'>

export interface CustomFunctionHclExportOptions extends HclExportOptions {
    /** Map of alert IDs to their TF references */
    alertIdReplacements?: Map<string, string>
}

/**
 * @see https://registry.terraform.io/providers/PostHog/posthog/latest/docs/resources/custom_function
 */
const CUSTOM_FUNCTION_FIELD_MAPPINGS: FieldMapping<Partial<CustomFunctionType>, CustomFunctionHclExportOptions>[] = [
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
        source: 'hog',
        target: 'hog',
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
        shouldInclude: (v) => !!(v as CustomFunctionType['template'])?.id,
        transform: (v) => `"${(v as CustomFunctionType['template'])?.id}"`,
    },
    {
        source: 'icon_url',
        target: 'icon_url',
        shouldInclude: (v) => !!v,
    },
]

function validateCustomFunction(
    customFunction: Partial<CustomFunctionType>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars Needed to align with interface
    _options: CustomFunctionHclExportOptions
): string[] {
    const warnings: string[] = []

    if (!customFunction.name) {
        warnings.push('No name provided. Consider adding a name for better identification in Terraform state.')
    }

    if (customFunction.inputs) {
        const secretInputs = Object.entries(customFunction.inputs).filter(([, input]) => input?.secret)
        if (secretInputs.length > 0) {
            warnings.push(
                `Secret inputs (${secretInputs.map(([k]) => k).join(', ')}) in the export, please be careful when handling this file!`
            )
        }
    }

    return warnings
}

const CUSTOM_FUNCTION_EXPORTER: ResourceExporter<Partial<CustomFunctionType>, CustomFunctionHclExportOptions> = {
    resourceType: 'posthog_custom_function',
    resourceLabel: 'custom_function',
    fieldMappings: CUSTOM_FUNCTION_FIELD_MAPPINGS,
    validate: validateCustomFunction,
    getResourceName: (h) => h.name || `custom_function_${h.id || 'new'}`,
    getId: (h) => h.id,
}

export function generateCustomFunctionHCL(
    customFunction: Partial<CustomFunctionType>,
    options: CustomFunctionHclExportOptions = {}
): HclExportResult {
    return generateHCL(customFunction, CUSTOM_FUNCTION_EXPORTER, options)
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
    mappings: CustomFunctionMappingType[] | null | undefined
): CustomFunctionMappingType[] | null | undefined {
    if (!mappings) {
        return mappings
    }
    return mappings.map((mapping) => ({
        ...mapping,
        inputs: stripInputsServerFields(mapping.inputs) as Record<string, CyclotronJobInputType> | null | undefined,
        filters: stripFiltersServerFields(mapping.filters) as CyclotronJobFiltersType | null | undefined,
    }))
}
