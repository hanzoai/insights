import { actions, connect, kea, path, reducers } from 'kea'
import { forms } from 'kea-forms'

import { toast } from '@hanzo/elements'

import { TreeDataItem } from 'lib/elements/Tree/Tree'
import { featureFlagLogic } from 'lib/logic/featureFlagLogic'

import { projectTreeDataLogic } from '~/layout/panel-layout/ProjectTree/projectTreeDataLogic'
import { joinPath, splitPath } from '~/layout/panel-layout/ProjectTree/utils'
import { FileSystemEntry } from '~/queries/schema/schema-general'

import type { itemSelectModalLogicType } from './itemSelectModalLogicType'

export const itemSelectModalLogic = kea<itemSelectModalLogicType>([
    path(['lib', 'components', 'FileSystem', 'ItemSelectModal', 'itemSelectModalLogic']),
    connect(() => ({
        values: [featureFlagLogic, ['featureFlags'], projectTreeDataLogic, ['shortcutData']],
        actions: [projectTreeDataLogic, ['addShortcutItem']],
    })),
    actions({
        openItemSelectModal: true,
        closeItemSelectModal: true,
    }),
    reducers({
        isOpen: [
            false,
            {
                openItemSelectModal: () => true,
                closeItemSelectModal: () => false,
            },
        ],
    }),
    forms(({ actions, values }) => ({
        form: {
            defaults: {
                item: null as TreeDataItem | null,
            },
            submit: async (formValues) => {
                if (formValues.item?.record) {
                    const item = formValues.item.record as FileSystemEntry
                    const shortcutPath = joinPath([splitPath(item.path).pop() ?? 'Unnamed'])

                    if (values.shortcutData.some((s) => s.path === shortcutPath)) {
                        toast.info('Shortcut already exists')
                        return
                    }

                    await actions.addShortcutItem(item)
                    actions.closeItemSelectModal()
                }
            },
        },
    })),
])
