import { Tag } from '@hanzo/elements'

interface IssueTaggable {
    abandonment: boolean
    confusion: boolean
    exception: string | null
}

export function getIssueTags(event: IssueTaggable): JSX.Element[] {
    const tags: JSX.Element[] = []
    if (event.exception) {
        tags.push(
            <Tag key="exception" size="medium" type="option">
                {event.exception === 'blocking' ? 'blocking error' : 'non-blocking error'}
            </Tag>
        )
    }
    if (event.abandonment) {
        tags.push(
            <Tag key="abandonment" size="medium" type="option">
                abandoned
            </Tag>
        )
    }
    if (event.confusion) {
        tags.push(
            <Tag key="confusion" size="medium" type="option">
                confusion
            </Tag>
        )
    }
    return tags
}
