import { Tag } from '@hanzo/elements'

export interface ResultsTagProps {
    isSignificant: boolean
}

export function ResultsTag({ isSignificant }: ResultsTagProps): JSX.Element {
    return (
        <Tag type={isSignificant ? 'success' : 'primary'}>
            <b className="uppercase">{isSignificant ? 'Significant' : 'Not significant'}</b>
        </Tag>
    )
}
