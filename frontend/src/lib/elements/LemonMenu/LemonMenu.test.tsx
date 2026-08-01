import '@testing-library/jest-dom'

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef } from 'react'

import { Button } from '../Button'
import { Menu } from './Menu'

describe('Menu', () => {
    // jest.setupAfterEnv does not enable RTL auto-cleanup; unmount between tests so `screen` stays isolated.
    afterEach(() => {
        cleanup()
    })

    it('forwards its ref to the trigger DOM node', () => {
        let resolvedNode: HTMLElement | null = null

        render(
            <Menu
                items={[{ label: 'First', to: '/first' }]}
                ref={(node) => {
                    resolvedNode = node
                }}
            >
                <Button>Open</Button>
            </Menu>
        )

        // The ref must land on the real trigger button, not on the (DOM-less) Menu component.
        expect(resolvedNode).toBeInstanceOf(HTMLButtonElement)
        expect(resolvedNode).toBe(screen.getByRole('button'))
    })

    it('clicking the ref-driven trigger opens the menu', async () => {
        function Wrapper(): JSX.Element {
            const ref = useRef<HTMLElement>(null)
            return (
                <>
                    <button onClick={() => ref.current?.click()}>Trigger via ref</button>
                    <Menu items={[{ label: 'First', to: '/first' }]} ref={ref}>
                        <Button>Open</Button>
                    </Menu>
                </>
            )
        }

        render(<Wrapper />)

        expect(screen.queryByText('First')).not.toBeInTheDocument()

        // Triggering a click through the forwarded ref (as <Shortcut /> does) must open the menu.
        await userEvent.click(screen.getByText('Trigger via ref'))

        expect(screen.getByText('First')).toBeInTheDocument()
    })
})
