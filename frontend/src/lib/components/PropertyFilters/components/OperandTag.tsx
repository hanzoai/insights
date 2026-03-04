import { LemonTag } from '@hanzo/lemon-ui'

export const OperandTag = ({ operand }: { operand: 'and' | 'or' }): JSX.Element => {
    return (
        <LemonTag type={operand === 'and' ? 'highlight' : 'completion'}>
            <span className="uppercase">{operand}</span>
        </LemonTag>
    )
}
