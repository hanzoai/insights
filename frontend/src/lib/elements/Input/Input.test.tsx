import { fireEvent, render } from '@testing-library/react'

import { Input } from './Input'

describe('Input', () => {
    it('does not refocus the native input when it handles the click itself', () => {
        const { container } = render(<Input type="time" />)
        const wrapper = container.querySelector<HTMLElement>('.Input')
        const input = container.querySelector<HTMLInputElement>('input')

        expect(wrapper).not.toBeNull()
        expect(input).not.toBeNull()

        const focus = jest.spyOn(input!, 'focus')

        fireEvent.click(input!)
        expect(focus).not.toHaveBeenCalled()

        fireEvent.click(wrapper!)
        expect(focus).toHaveBeenCalledTimes(1)
    })
})
