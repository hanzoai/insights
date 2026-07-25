import { configure } from '@testing-library/react'
import 'jest-canvas-mock'
import { TextDecoder, TextEncoder } from 'util'
import 'whatwg-fetch'

// Jest/JSDom don't know about TextEncoder but the browsers we support do
// https://github.com/jsdom/jsdom/issues/2524
global.TextDecoder = TextDecoder as any
global.TextEncoder = TextEncoder as any

window.scrollTo = jest.fn()
window.matchMedia = jest.fn(() => ({ matches: false, addListener: jest.fn(), removeListener: jest.fn() }) as any)

// we use CSS.escape in the toolbar, but Jest/JSDom doesn't support it
if (typeof (globalThis as any).CSS === 'undefined') {
    ;(globalThis as any).CSS = {}
}

if (typeof (globalThis as any).CSS.escape !== 'function') {
    ;(globalThis as any).CSS.escape = (value: string) => value
}

const mockIntersectionObserver = jest.fn()
mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null,
})
;(globalThis as any).IntersectionObserver = mockIntersectionObserver

// Tell React Testing Library to use "data-attr" as the test ID attribute
configure({ testIdAttribute: 'data-attr' })

// Mock DecompressionWorkerManager globally to avoid import.meta.url issues in tests
jest.mock('scenes/session-recordings/player/snapshot-processing/DecompressionWorkerManager')

// Mock @hanzo/insights surveys-preview to avoid ESM import issues in tests
jest.mock('@hanzo/insights/dist/surveys-preview', () => ({
    renderFeedbackWidgetPreview: jest.fn(),
    renderSurveysPreview: jest.fn(),
    getNextSurveyStep: jest.fn(),
}))

// Mock @hanzo/insights product-tours-preview to avoid ESM import issues in tests
jest.mock('@hanzo/insights/dist/product-tours-preview', () => ({
    renderProductTourPreview: jest.fn(),
}))

// Mock @hanzo/insights element-inference to avoid ESM import issues in tests
jest.mock('@hanzo/insights/dist/element-inference', () => ({
    findElement: jest.fn(),
    getElementPath: jest.fn(),
}))

// Mock @hanzo/insights to avoid issues in tests
jest.mock('@hanzo/insights', () => {
    // Get the actual module to preserve type exports (enums, etc.)
    const actual = jest.requireActual('@hanzo/insights')

    const mock: Record<string, any> = {
        capture: jest.fn(),
        captureException: jest.fn(),
        captureRaw: jest.fn(),
        opt_in_capturing: jest.fn(),
        identify: jest.fn(),
        getFeatureFlag: jest.fn(),
        getFeatureFlagPayload: jest.fn(),
        getAllFlags: jest.fn(),
        isFeatureEnabled: jest.fn(),
        getEarlyAccessFeatures: jest.fn(),
        getSurveys: jest.fn(),
        onFeatureFlags: jest.fn(() => () => {}),
        debug: jest.fn(),
        get_session_id: jest.fn(),
        get_session_replay_url: jest.fn(),
        get_distinct_id: jest.fn(),
        register: jest.fn(),
        reset: jest.fn(),
        group: jest.fn(),
        updateEarlyAccessFeatureEnrollment: jest.fn(),
        people: { set: jest.fn() },
        featureFlags: { override: jest.fn() },
    }
    mock.init = jest.fn(() => mock)

    // Return mock functions but preserve actual type exports
    return { ...actual, __esModule: true, default: mock, insights: mock }
})

jest.mock('@tiptap/extension-code-block-lowlight', () => {
    const mockExtension = {
        configure: jest.fn(() => ({})),
        extend: jest.fn(() => ({
            configure: jest.fn(() => ({})),
        })),
    }
    return {
        __esModule: true,
        default: mockExtension,
        CodeBlockLowlight: mockExtension,
    }
})
