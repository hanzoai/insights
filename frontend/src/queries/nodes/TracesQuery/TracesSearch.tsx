import { Input } from 'lib/elements/Input/Input'

import { useDebouncedQuery } from '~/queries/hooks/useDebouncedQuery'
import { TracesQuery } from '~/queries/schema/schema-general'

interface TracesSearchProps {
    query: TracesQuery
    setQuery?: (query: TracesQuery) => void
}

export function TracesSearch({ query, setQuery }: TracesSearchProps): JSX.Element {
    const { value, onChange } = useDebouncedQuery<TracesQuery, string>(
        query,
        setQuery,
        (query) => query.searchTerm || '',
        (query, value) => ({ ...query, searchTerm: value })
    )

    return (
        <Input
            type="search"
            className="min-w-60"
            value={value}
            placeholder="Search content"
            data-attr="llm-traces-search"
            disabled={!setQuery}
            onChange={onChange}
        />
    )
}
