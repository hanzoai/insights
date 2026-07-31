import { Tag } from '@hanzo/elements'

export const OperandTag = ({ operand }: { operand: 'and' | 'or' }): JSX.Element => {
    return (
        <Tag type={operand === 'and' ? 'highlight' : 'completion'}>
            <span className="uppercase">{operand}</span>
        </Tag>
    )
}
