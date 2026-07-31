import { Tag, TagType } from 'lib/elements/Tag'

import { LogMessage } from '~/queries/schema/schema-general'

export const LogTag = ({ level }: { level: LogMessage['severity_text'] }): JSX.Element => {
    const type =
        (
            {
                debug: 'muted',
                info: 'default',
                warn: 'warning',
                error: 'danger',
                fatal: 'danger',
            } as Record<LogMessage['severity_text'], TagType>
        )[level] ?? 'muted'

    return <Tag type={type}>{level}</Tag>
}
