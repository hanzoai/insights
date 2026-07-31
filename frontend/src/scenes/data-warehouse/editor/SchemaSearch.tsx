import { Input } from '@hanzo/elements'

export const SchemaSearch = (): JSX.Element => {
    return (
        <div className="flex items-center">
            <Input
                className="rounded-none"
                type="search"
                placeholder="Search for schema"
                data-attr="schema-search"
                fullWidth
            />
        </div>
    )
}
