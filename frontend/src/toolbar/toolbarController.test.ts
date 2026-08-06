import type { Root } from 'react-dom/client'

import { initKeaTests } from '~/test/init'
import { toolbarConfigLogic } from '~/toolbar/toolbarConfigLogic'
import {
    clearToolbarRefs,
    insightsToolbarController,
    InsightsToolbarController,
    setToolbarRefs,
} from '~/toolbar/toolbarController'

// The toolbar logger mirrors intentional error/auth paths to the console (its job on
// customer pages); tests exercise those paths on purpose, so stub the boundary.
jest.mock('~/toolbar/toolbarLogger', () => ({
    toolbarLogger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}))

global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
    } as any as Response)
)

describe('InsightsToolbarController', () => {
    let mockRoot: Root
    let mockContainer: HTMLElement

    beforeEach(() => {
        initKeaTests()
        clearToolbarRefs()
        localStorage.clear()
        mockRoot = { unmount: jest.fn(), render: jest.fn() } as unknown as Root
        mockContainer = document.createElement('div')
        document.body.appendChild(mockContainer)
    })

    afterEach(() => {
        toolbarConfigLogic.findMounted()?.unmount()
        // Clean up container if still in DOM
        if (mockContainer.parentNode) {
            mockContainer.parentNode.removeChild(mockContainer)
        }
    })

    it('insightsToolbarController is an instance of InsightsToolbarController', () => {
        expect(insightsToolbarController).toBeInstanceOf(InsightsToolbarController)
    })

    describe('isLoaded getter', () => {
        it('returns false before setToolbarRefs', () => {
            expect(insightsToolbarController.isLoaded).toBe(false)
        })

        it('returns true after setToolbarRefs', () => {
            setToolbarRefs(mockRoot, mockContainer)
            expect(insightsToolbarController.isLoaded).toBe(true)
        })

        it('returns false after destroy()', () => {
            setToolbarRefs(mockRoot, mockContainer)
            expect(insightsToolbarController.isLoaded).toBe(true)
            insightsToolbarController.destroy()
            expect(insightsToolbarController.isLoaded).toBe(false)
        })
    })

    describe('show() and hide()', () => {
        it('show() makes buttonVisible true via toolbarConfigLogic', () => {
            const logic = toolbarConfigLogic.build({ apiURL: 'http://localhost' })
            logic.mount()
            setToolbarRefs(mockRoot, mockContainer)

            logic.actions.hideButton()
            expect(logic.values.buttonVisible).toBe(false)

            insightsToolbarController.show()
            expect(logic.values.buttonVisible).toBe(true)
        })

        it('hide() makes buttonVisible false via toolbarConfigLogic', () => {
            const logic = toolbarConfigLogic.build({ apiURL: 'http://localhost' })
            logic.mount()
            setToolbarRefs(mockRoot, mockContainer)

            expect(logic.values.buttonVisible).toBe(true)

            insightsToolbarController.hide()
            expect(logic.values.buttonVisible).toBe(false)

            insightsToolbarController.show()
            expect(logic.values.buttonVisible).toBe(true)
        })

        it('show() does not throw when toolbar is not loaded', () => {
            expect(() => insightsToolbarController.show()).not.toThrow()
        })

        it('hide() does not throw when toolbar is not loaded', () => {
            expect(() => insightsToolbarController.hide()).not.toThrow()
        })
    })

    describe('isVisible getter', () => {
        it('returns false when toolbar is not loaded', () => {
            expect(insightsToolbarController.isVisible).toBe(false)
        })

        it('returns buttonVisible value when toolbar is loaded', () => {
            const logic = toolbarConfigLogic.build({ apiURL: 'http://localhost' })
            logic.mount()
            setToolbarRefs(mockRoot, mockContainer)

            expect(insightsToolbarController.isVisible).toBe(true)

            logic.actions.hideButton()
            expect(insightsToolbarController.isVisible).toBe(false)

            logic.actions.showButton()
            expect(insightsToolbarController.isVisible).toBe(true)
        })
    })

    describe('authenticate()', () => {
        // toolbarConfigLogic's authenticate flow narrates progress via toolbarLogger by design
        let consoleInfoSpy: jest.SpyInstance

        beforeEach(() => {
            consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation()
        })

        afterEach(() => {
            consoleInfoSpy.mockRestore()
        })

        it('calls authenticate action on toolbarConfigLogic when loaded and not authenticated', () => {
            const logic = toolbarConfigLogic.build({ apiURL: 'http://localhost' })
            logic.mount()
            setToolbarRefs(mockRoot, mockContainer)

            const authenticateSpy = jest.spyOn(logic.actions, 'authenticate')
            insightsToolbarController.authenticate()
            expect(authenticateSpy).toHaveBeenCalled()
            authenticateSpy.mockRestore()
        })

        it('no-ops when already authenticated', () => {
            const logic = toolbarConfigLogic.build({
                apiURL: 'http://localhost',
                accessToken: 'pha_test_token',
                refreshToken: 'phr_refresh',
                clientId: 'client-id',
            })
            logic.mount()
            setToolbarRefs(mockRoot, mockContainer)

            expect(logic.values.isAuthenticated).toBe(true)

            const authenticateSpy = jest.spyOn(logic.actions, 'authenticate')
            insightsToolbarController.authenticate()
            expect(authenticateSpy).not.toHaveBeenCalled()
            authenticateSpy.mockRestore()
        })

        it('does not throw when toolbar is not loaded', () => {
            expect(() => insightsToolbarController.authenticate()).not.toThrow()
        })
    })

    describe('isAuthenticated getter', () => {
        it('returns false when toolbar is not loaded', () => {
            expect(insightsToolbarController.isAuthenticated).toBe(false)
        })

        it('returns false when toolbarConfigLogic is mounted but setToolbarRefs has not been called', () => {
            const logic = toolbarConfigLogic.build({
                apiURL: 'http://localhost',
                accessToken: 'pha_test_token',
                refreshToken: 'phr_refresh',
                clientId: 'client-id',
            })
            logic.mount()

            // isAuthenticated is gated on _loaded, so it returns false even though
            // toolbarConfigLogic reports authenticated
            expect(insightsToolbarController.isAuthenticated).toBe(false)
        })

        it('returns true when toolbar is loaded and toolbarConfigLogic has accessToken', () => {
            const logic = toolbarConfigLogic.build({
                apiURL: 'http://localhost',
                accessToken: 'pha_test_token',
                refreshToken: 'phr_refresh',
                clientId: 'client-id',
            })
            logic.mount()
            setToolbarRefs(mockRoot, mockContainer)

            expect(insightsToolbarController.isAuthenticated).toBe(true)
        })
    })

    describe('destroy()', () => {
        it('calls mockRoot.unmount()', () => {
            setToolbarRefs(mockRoot, mockContainer)
            insightsToolbarController.destroy()
            expect((mockRoot as any).unmount).toHaveBeenCalled()
        })

        it('removes container from document.body', () => {
            setToolbarRefs(mockRoot, mockContainer)
            expect(mockContainer.parentNode).toBe(document.body)
            insightsToolbarController.destroy()
            expect(mockContainer.parentNode).toBeNull()
        })

        it('sets isLoaded to false after destroy', () => {
            setToolbarRefs(mockRoot, mockContainer)
            expect(insightsToolbarController.isLoaded).toBe(true)
            insightsToolbarController.destroy()
            expect(insightsToolbarController.isLoaded).toBe(false)
        })

        it('is idempotent -- calling destroy() twice does not throw', () => {
            setToolbarRefs(mockRoot, mockContainer)
            insightsToolbarController.destroy()
            expect(() => insightsToolbarController.destroy()).not.toThrow()
            expect((mockRoot as any).unmount).toHaveBeenCalledTimes(1)
        })
    })
})
