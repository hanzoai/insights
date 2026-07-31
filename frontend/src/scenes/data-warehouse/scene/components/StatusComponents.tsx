import { IconCheckCircle } from '@hanzo/icons'
import { Tag } from '@hanzo/elements'

import { IconCancel, IconExclamation, IconRadioButtonUnchecked, IconSync } from 'lib/elements/icons'
import { StatusTagSetting } from 'scenes/data-warehouse/utils'

import { ExternalDataJobStatus } from '~/types'

export function StatusIcon({ status }: { status?: ExternalDataJobStatus }): JSX.Element {
    if (!status) {
        return <IconRadioButtonUnchecked className="text-muted" />
    }

    if (status === ExternalDataJobStatus.Failed) {
        return <IconCancel className="text-danger" />
    }
    if (status === ExternalDataJobStatus.BillingLimits || status === ExternalDataJobStatus.BillingLimitTooLow) {
        return <IconExclamation className="text-warning" />
    }
    if (status === ExternalDataJobStatus.Running) {
        return <IconSync className="animate-spin" />
    }
    if (status === ExternalDataJobStatus.Completed) {
        return <IconCheckCircle className="text-success" />
    }
    return <IconRadioButtonUnchecked className="text-muted" />
}

export function StatusTag({ status }: { status?: ExternalDataJobStatus }): JSX.Element {
    if (!status) {
        return (
            <Tag size="small" type="muted" className="px-1 rounded-lg">
                —
            </Tag>
        )
    }

    const type = StatusTagSetting[status] || 'muted'

    return (
        <Tag size="medium" type={type} className="px-1 rounded-lg">
            {status}
        </Tag>
    )
}
