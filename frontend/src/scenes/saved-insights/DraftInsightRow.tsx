import { useActions } from 'kea'

import { dayjs } from 'lib/dayjs'
import { Button } from 'lib/elements/Button'
import { More } from 'lib/elements/Button/More'
import { Divider } from 'lib/elements/Divider'
import { TableLink } from 'lib/elements/Table/TableLink'
import { Tag } from 'lib/elements/Tag'
import { eventUsageLogic } from 'lib/utils/eventUsageLogic'
import { useSummarizeInsight } from 'scenes/insights/summarizeInsight'
import { urls } from 'scenes/urls'

import { SavedInsightListItem, savedInsightsLogic } from './savedInsightsLogic'

function draftAgeSeconds(item: SavedInsightListItem): number {
    return Math.max(0, dayjs().diff(dayjs(item.created_at), 'second'))
}

export function DraftInsightNameCell({ item }: { item: SavedInsightListItem }): JSX.Element {
    const summarizeInsight = useSummarizeInsight()
    const { reportInsightDraftRestored } = useActions(eventUsageLogic)
    return (
        <TableLink
            to={urls.insightNew({ query: item.query ?? undefined })}
            onClick={() => reportInsightDraftRestored('saved_insights', draftAgeSeconds(item))}
            title={
                <span className="flex items-center gap-2">
                    <i>{summarizeInsight(item.query) || 'Unsaved insight'}</i>
                    <Tag type="warning" size="small">
                        Draft
                    </Tag>
                </span>
            }
            description="Unsaved changes, only stored in this browser"
        />
    )
}

export function DraftInsightMoreMenu({ item }: { item: SavedInsightListItem }): JSX.Element {
    const { discardDraftQuery } = useActions(savedInsightsLogic)
    const { reportInsightDraftRestored } = useActions(eventUsageLogic)
    return (
        <More
            overlay={
                <>
                    <Button
                        to={urls.insightNew({ query: item.query ?? undefined })}
                        onClick={() => reportInsightDraftRestored('saved_insights', draftAgeSeconds(item))}
                        data-attr="draft-insight-continue-editing"
                        fullWidth
                    >
                        Continue editing
                    </Button>
                    <Divider />
                    <Button
                        status="danger"
                        onClick={discardDraftQuery}
                        data-attr="draft-insight-discard"
                        fullWidth
                    >
                        Discard draft
                    </Button>
                </>
            }
        />
    )
}
