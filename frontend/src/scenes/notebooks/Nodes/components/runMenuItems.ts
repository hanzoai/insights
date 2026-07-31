import { MenuItems } from '@hanzo/elements'

export type NotebookRunMode = 'auto' | 'cell_upstream' | 'cell' | 'cell_downstream'

export const buildRunMenuItems = (onRun: (mode: NotebookRunMode) => void): MenuItems => [
    {
        label: 'Run (auto)',
        onClick: () => onRun('auto'),
    },
    {
        label: 'Run cell + upstream',
        onClick: () => onRun('cell_upstream'),
    },
    {
        label: 'Run cell',
        onClick: () => onRun('cell'),
    },
    {
        label: 'Run cell + downstream',
        onClick: () => onRun('cell_downstream'),
    },
]
