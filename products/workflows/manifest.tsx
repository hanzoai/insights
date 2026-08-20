import { urls } from 'scenes/urls'

import { FileSystemIconColor, ProductManifest } from '../../frontend/src/types'
import type { WorkflowsSceneTab } from './frontend/WorkflowsScene'

export const manifest: ProductManifest = {
    name: 'Workflows',
    scenes: {
        Workflows: {
            import: () => import('./frontend/WorkflowsScene'),
            name: 'Workflows',
            iconType: 'workflows',
            projectBased: true,
            description: 'Automate user communication and internal processes',
        },
        Workflow: {
            import: () => import('./frontend/Workflows/WorkflowScene'),
            name: 'Workflows',
            iconType: 'workflows',
            projectBased: true,
        },
        WorkflowsLibraryTemplate: {
            import: () => import('./frontend/TemplateLibrary/MessageTemplate'),
            name: 'Workflows',
            iconType: 'workflows',
            projectBased: true,
        },
    },
    routes: {
        // URL: [Scene, SceneKey]
        '/workflows': ['Workflows', 'workflows'],
        '/workflows/:tab': ['Workflows', 'workflows'],
        '/workflows/:id/:tab': ['Workflow', 'workflowTab'],
        '/workflows/library/templates/:id': ['WorkflowsLibraryTemplate', 'workflowsLibraryTemplate'],
        '/workflows/library/templates/new': ['WorkflowsLibraryTemplate', 'workflowsLibraryTemplate'],
        '/workflows/library/templates/new?messageId=:messageId': [
            'WorkflowsLibraryTemplate',
            'workflowsLibraryTemplateFromMessage',
        ],
    },
    urls: {
        workflows: (tab?: WorkflowsSceneTab): string => `/workflows${tab ? `/${tab}` : ''}`,
        workflow: (id: string, tab: string): string => `/workflows/${id}/${tab}`,
        workflowNew: (): string => '/workflows/new/workflow',
        workflowsLibraryMessage: (id: string): string => `/workflows/library/messages/${id}`,
        workflowsLibraryTemplate: (id?: string): string => `/workflows/library/templates/${id}`,
        workflowsLibraryTemplateNew: (): string => '/workflows/library/templates/new',
        workflowsLibraryTemplateFromMessage: (id?: string): string =>
            `/workflows/library/templates/new?messageId=${id}`,
    },
    fileSystemTypes: {
        workflows: {
            name: 'Workflow',
            iconType: 'workflows',
            iconColor: ['var(--color-product-workflows-light)'] as FileSystemIconColor,
            href: (ref: string) => urls.workflow(ref, 'workflow'),
            filterKey: 'workflows',
        },
    },
    // No nav entry. Automations is the automation graph — one engine, on Go
    // tasks, at /v1/automations. This product is the upstream one, and it is not
    // merely redundant: its model reads `db_table = "insights_flow"`, a table
    // that does not exist in the database, so listing flows answers 500. Showing
    // an entry that can only fail is worse than showing none, and pointing it at
    // Automations would be a second door onto the same idea.
    //
    // The routes stay registered for now. Nothing reaches them without this
    // entry, and the removal migration has to wait: the migration chain is wedged
    // on batch_exports.0005 (`insights_batchexportondemand` missing), and adding
    // drops behind a stuck chain compounds it. Retire the code once that is green.
    treeItemsProducts: [],
}
