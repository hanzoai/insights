import '@testing-library/jest-dom'

import { cleanup, render, waitFor } from '@testing-library/react'
import { BindLogic, useMountedLogic, useValues } from 'kea'
import { router } from 'kea-router'
import insights from 'insights-js'
import { Component, type ReactNode } from 'react'

import { useMocks } from '~/mocks/jest'
import { initKeaTests } from '~/test/init'

import { appScenes } from './appScenes'
import { sceneLogic } from './sceneLogic'

/*
Does the scene actually PUT SOMETHING ON THE PAGE?

sceneSmoke.test.tsx mounts the same scenes but only fails on one narrow class of
throw (a missing tabId/panelId prop) -- it says so itself. That leaves the exact
gap the live suite was built to close: a scene can mount, throw inside render, and
be caught by the app's error boundary, and a test that only greps the message for
"must have a ... prop" calls it green.

These three routes were the ones the live suite caught rendering "An error has
occurred" against the deployed build. They are asserted on rendered TEXT, because
a scene that throws renders a boundary instead of its content, and only reading
what is on the page tells the two apart.
*/

const renderErrors: Error[] = []

class CaptureBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
    override state = { failed: false }
    static getDerivedStateFromError(): { failed: boolean } {
        return { failed: true }
    }
    override componentDidCatch(error: Error): void {
        renderErrors.push(error)
    }
    override render(): ReactNode {
        return this.state.failed ? null : this.props.children
    }
}

function SceneHost(): JSX.Element | null {
    useMountedLogic(sceneLogic({ scenes: appScenes }))
    const { activeExportedScene, activeSceneComponentParams, activeSceneLogicProps, activeSceneId } =
        useValues(sceneLogic)

    if (!activeExportedScene?.component) {
        return null
    }
    const SceneComponent = activeExportedScene.component
    const element = <SceneComponent {...activeSceneComponentParams} />
    return activeExportedScene.logic ? (
        <BindLogic key={`bind-${activeSceneId}`} logic={activeExportedScene.logic} props={activeSceneLogicProps}>
            {element}
        </BindLogic>
    ) : (
        element
    )
}

// [route, a string the working scene puts on the page]
const SCENES: [name: string, path: string, expected: RegExp][] = [
    ['persons', '/persons', /Persons/i],
    ['cohorts', '/cohorts', /Cohorts/i],
    ['project settings', '/settings/project', /Settings/i],
]

describe('scenes render their content, not an error boundary', () => {
    let consoleErrors: string[]
    let consoleErrorSpy: jest.SpyInstance
    let captureExceptionSpy: jest.SpyInstance

    beforeAll(() => {
        const css = (global as any).CSS ?? ((global as any).CSS = {})
        css.supports = css.supports ?? ((): boolean => false)
    })

    beforeEach(() => {
        useMocks({
            post: { '/v1/environments/:team_id/query/': () => [200, { results: [] }] },
        })
        initKeaTests()
        renderErrors.length = 0
        consoleErrors = []
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((...args) => {
            consoleErrors.push(args.map((a) => (a instanceof Error ? a.message : String(a))).join(' '))
        })
        captureExceptionSpy = jest.spyOn(insights, 'captureException').mockImplementation(() => undefined)
    })

    afterEach(() => {
        consoleErrorSpy.mockRestore()
        captureExceptionSpy.mockRestore()
        cleanup()
    })

    test.each(SCENES)('%s renders', async (_name, path, expected) => {
        router.actions.push(path)
        const { container } = render(
            <CaptureBoundary>
                <SceneHost />
            </CaptureBoundary>
        )

        await waitFor(() => {
            expect(sceneLogic.findMounted()?.values.activeExportedScene?.component).toBeTruthy()
        })
        // Let the scene's own render (and the logics it builds during it) settle.
        await new Promise((r) => setTimeout(r, 250))

        // Nothing threw during render...
        expect(renderErrors.map((e) => e.message)).toEqual([])
        // ...and the scene actually put its content on the page.
        expect(container.textContent ?? '').toMatch(expected)
    })
})
