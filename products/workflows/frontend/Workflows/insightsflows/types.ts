import { Edge, Node } from '@xyflow/react'
import z from 'zod'

import { CyclotronJobInputsValidationResult } from 'lib/components/CyclotronJob/CyclotronJobInputsValidation'

import { AccessControlLevel, UserBasicType } from '~/types'

import { CyclotronJobInputSchemaTypeSchema, InsightsFlowActionSchema, InsightsFlowTriggerSchema } from './steps/types'

const InsightsFlowEdgeSchema = z.object({
    from: z.string(),
    to: z.string(),
    type: z.enum(['continue', 'branch']),
    index: z.number().optional(),
})

export const InsightsFlowSchema = z.object({
    id: z.string(),
    team_id: z.number(),
    version: z.number(),
    name: z.string(),
    description: z.string().optional(),
    status: z.enum(['active', 'draft', 'archived']),
    trigger: InsightsFlowTriggerSchema.optional(),
    // Optional masking config for the trigger, allows InsightsFlows to be rate limited per distinct ID or other property
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
            window_minutes: z.number().nullable(),
            filters: z.any(),
            events: z
                .array(
                    z.object({
                        filters: z.any().optional().nullable(),
                        name: z.string().optional(),
                    })
                )
                .optional(),
            bytecode: z.array(z.union([z.string(), z.number()])).optional(), // Bytecode only present after save
        })
        .optional(),
    exit_condition: z.enum([
        'exit_on_conversion',
        'exit_on_trigger_not_matched',
        'exit_on_trigger_not_matched_or_conversion',
        'exit_only_at_end',
    ]),
    actions: z.array(InsightsFlowActionSchema),
    abort_action: z.string().optional(),
    edges: z.array(InsightsFlowEdgeSchema),
    variables: z.array(CyclotronJobInputSchemaTypeSchema).optional().nullable(),
    updated_at: z.string(),
    created_at: z.string(),
})

export const InsightsFlowTemplateSchema = InsightsFlowSchema.omit({ status: true }).extend({
    image_url: z.string().optional().nullable(),
    tags: z.array(z.string()).default([]),
    scope: z.enum(['team', 'global', 'organization']).optional().nullable(),
})

export const InsightsFlowBatchJobSchema = z.object({
    id: z.string(),
    hog_flow: z.string(),
    variables: z.record(z.string(), z.any()),
    status: z.enum(['waiting', 'queued', 'active', 'completed', 'cancelled', 'failed']),
    filters: z.any(),
    created_at: z.string(),
    updated_at: z.string(),
})

// NOTE: these are purposefully exported as interfaces to support kea typegen
export interface InsightsFlow extends z.infer<typeof InsightsFlowSchema> {
    created_by?: UserBasicType | null
    // Effective access level of the current user for this workflow (resource access control).
    user_access_level?: AccessControlLevel
}
export interface InsightsFlowEdge extends z.infer<typeof InsightsFlowEdgeSchema> {}
export interface InsightsFlowActionEdge extends Edge<{ edge: InsightsFlowEdge; label?: string }> {}

export type InsightsFlowAction = z.infer<typeof InsightsFlowActionSchema> & Record<string, unknown>
export interface InsightsFlowActionNode extends Node<InsightsFlowAction> {}

// Dropzone nodes are ephemeral and on the client only, used in the editor to highlight where nodes can be added to a workflow
export type DropzoneNode = Node<{ edge: InsightsFlowActionEdge; isBranchJoinDropzone?: boolean }>

export type InsightsFlowActionValidationResult = CyclotronJobInputsValidationResult & {
    schema: z.ZodError | null
}

export interface InsightsFlowTemplate extends z.infer<typeof InsightsFlowTemplateSchema> {
    created_by?: UserBasicType | null
}

export interface InsightsFlowBatchJob extends z.infer<typeof InsightsFlowBatchJobSchema> {
    created_by?: UserBasicType | null
}

export interface InsightsFlowSchedule {
    id: string
    rrule: string
    starts_at: string
    timezone?: string
    variables?: Record<string, unknown>
    status?: string
    next_run_at?: string | null
    created_at?: string
    updated_at?: string
}
