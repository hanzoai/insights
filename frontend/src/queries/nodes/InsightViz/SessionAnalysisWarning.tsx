import { Banner, Link } from '@hanzo/elements'

export function SessionAnalysisWarning(): JSX.Element {
    return (
        <Banner type="info" className="mb-4">
            When using sessions and session properties, events without session IDs will be excluded from the set of
            results. <Link to="https://hanzo.ai/docs/user-guides/sessions">Learn more about sessions.</Link>
        </Banner>
    )
}
