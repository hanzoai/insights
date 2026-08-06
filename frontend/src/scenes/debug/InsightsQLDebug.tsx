import { BindLogic, useValues } from 'kea'

import { Divider } from 'lib/elements/Divider'
import { Modifiers } from 'scenes/debug/Modifiers'

import { DataNodeLogicProps, dataNodeLogic } from '~/queries/nodes/DataNode/dataNodeLogic'
import { DateRange } from '~/queries/nodes/DataNode/DateRange'
import { ElapsedTime } from '~/queries/nodes/DataNode/ElapsedTime'
import { Reload } from '~/queries/nodes/DataNode/Reload'
import { EventPropertyFilters } from '~/queries/nodes/EventsNode/EventPropertyFilters'
import { InsightsQLQueryEditor } from '~/queries/nodes/InsightsQLQuery/InsightsQLQueryEditor'
import { InsightsQLQuery, InsightsQLQueryModifiers, InsightsQLQueryResponse } from '~/queries/schema/schema-general'

import { QueryTabs } from './QueryTabs'

interface InsightsQLDebugProps {
    queryKey: `new-${string}`
    query: InsightsQLQuery
    setQuery: (query: InsightsQLQuery) => void
    modifiers?: InsightsQLQueryModifiers
}

export function InsightsQLDebug({ query, setQuery, queryKey, modifiers }: InsightsQLDebugProps): JSX.Element {
    const dataNodeLogicProps: DataNodeLogicProps = {
        query,
        key: queryKey,
        dataNodeCollectionId: queryKey,
        modifiers,
    }
    const { dataLoading, response: _response } = useValues(dataNodeLogic(dataNodeLogicProps))
    const response = _response as InsightsQLQueryResponse | null

    return (
        <BindLogic logic={dataNodeLogic} props={dataNodeLogicProps}>
            <div className="deprecated-space-y-2">
                <InsightsQLQueryEditor query={query} setQuery={setQuery} />
                <Modifiers setQuery={setQuery} query={query} response={response} />
                <Divider className="my-4" />
                <div className="flex flex-wrap gap-2 ">
                    <Reload />
                    <DateRange key="date-range" query={query} setQuery={setQuery} />
                    <EventPropertyFilters key="event-property" query={query} setQuery={setQuery} />
                </div>
                {dataLoading ? (
                    <>
                        <h2>Running query...</h2>
                        <div className="flex">
                            Time elapsed:&nbsp;
                            <ElapsedTime />
                        </div>
                    </>
                ) : (
                    <>
                        <QueryTabs
                            query={query}
                            response={response}
                            setQuery={setQuery}
                            queryKey={queryKey}
                            onLoadQuery={(queryString) => {
                                try {
                                    const parsed = JSON.parse(queryString)
                                    if (parsed.kind === 'InsightsQLQuery') {
                                        setQuery(parsed)
                                    }
                                } catch (e) {
                                    console.error('Failed to parse query from log', e)
                                }
                            }}
                        />
                    </>
                )}
            </div>
        </BindLogic>
    )
}
