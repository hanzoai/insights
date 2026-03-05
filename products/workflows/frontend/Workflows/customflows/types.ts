import { Edge, Node } from '@xyflow/react'
import { z } from 'zod'

import { CyclotronJobInputsValidationResult } from 'lib/components/CyclotronJob/CyclotronJobInputsValidation'

import { UserBasicType } from '~/types'

import { CyclotronJobInputSchemaTypeSchema, CustomFlowActionSchema, CustomFlowTriggerSchema } from './steps/types'

const CustomFlowEdgeSchema = z.object({
    from: z.string(),
    to: z.string(),
    type: z.enum(['continue', 'branch']),
    index: z.number().optional(),
})

export const CustomFlowSchema = z.object({
    id: z.string(),
    team_id: z.number(),
    version: z.number(),
    name: z.string(),
    description: z.string().optional(),
    status: z.enum(['active', 'draft', 'archived']),
    trigger: CustomFlowTriggerSchema.optional(),
    // Optional masking config for the trigger, allows CustomFlows to be rate limited per distinct ID or other property
    trigger_masking: z
        .object({
            ttl: z.number().nullable(),
            hash: z.string(),
            bytecode: z.array(z.union([z.string(), z.number()])),
            threshold: z.number().nullable(),
        })
        .optional()
        .nullable(),
    conversion: z
        .object({
            window_minutes: z.number(),
            filters: z.any(),
        })
        .optional(),
    exit_condition: z.enum([
        'exit_on_conversion',
        'exit_on_trigger_not_matched',
        'exit_on_trigger_not_matched_or_conversion',
        'exit_only_at_end',
    ]),
    actions: z.array(CustomFlowActionSchema),
    abort_action: z.string().optional(),
    edges: z.array(CustomFlowEdgeSchema),
    variables: z.array(CyclotronJobInputSchemaTypeSchema).optional().nullable(),
    updated_at: z.string(),
    created_at: z.string(),
})

export const CustomFlowTemplateSchema = CustomFlowSchema.omit({ status: true }).extend({
    image_url: z.string().optional().nullable(),
    tags: z.array(z.string()).default([]),
    scope: z.enum(['team', 'global', 'organization']).optional().nullable(),
})

export const CustomFlowBatchJobSchema = z.object({
    id: z.string(),
    custom_flow: z.string(),
    variables: z.record(z.any()),
    status: z.enum(['waiting', 'queued', 'active', 'completed', 'cancelled', 'failed']),
    filters: z.any(),
    scheduled_at: z.string().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
})

// NOTE: these are purposefully exported as interfaces to support kea typegen
export interface CustomFlow extends z.infer<typeof CustomFlowSchema> {
    created_by?: UserBasicType | null
}
export interface CustomFlowEdge extends z.infer<typeof CustomFlowEdgeSchema> {}
export interface CustomFlowActionEdge extends Edge<{ edge: CustomFlowEdge; label?: string }> {}

export type CustomFlowAction = z.infer<typeof CustomFlowActionSchema> & Record<string, unknown>
export interface CustomFlowActionNode extends Node<CustomFlowAction> {}

// Dropzone nodes are ephemeral and on the client only, used in the editor to highlight where nodes can be added to a workflow
export type DropzoneNode = Node<{ edge: CustomFlowActionEdge; isBranchJoinDropzone?: boolean }>

export type CustomFlowActionValidationResult = CyclotronJobInputsValidationResult & {
    schema: z.ZodError | null
}

export interface CustomFlowTemplate extends z.infer<typeof CustomFlowTemplateSchema> {
    created_by?: UserBasicType | null
}

export interface CustomFlowBatchJob extends z.infer<typeof CustomFlowBatchJobSchema> {
    created_by?: UserBasicType | null
}
