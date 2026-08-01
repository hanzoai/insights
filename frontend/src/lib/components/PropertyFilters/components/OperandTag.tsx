import { Tag } from '@hanzo/elements'

export const OperandTag = ({ operand, className }: { operand: 'and' | 'or'; className?: string }): JSX.Element => {
    return (
        <Tag type={operand === 'and' ? 'highlight' : 'completion'} className={className}>
            <span className="uppercase">{operand}</span>
        </Tag>
    )
}
