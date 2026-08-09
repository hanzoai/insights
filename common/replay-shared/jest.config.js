module.exports = {
    transform: {
        '^.+\\.[cm]?[jt]s$': ['@swc/jest'],
    },
    // The rrweb packages ship ESM; let them through to the transform.
    transformIgnorePatterns: ['node_modules/(?!.*@hanzo/insights-rrweb)'],
    testEnvironment: 'node',
    // Wraps the describe/it/test globals to enforce .test_quarantine.json jest entries.
    setupFilesAfterEnv: ['../../frontend/jest.quarantine.ts'],
    clearMocks: true,
    testMatch: ['<rootDir>/src/**/*.test.ts'],
    // CI sets JEST_JUNIT_OUTPUT_DIR to collect junit for the Trunk quarantine gate.
    reporters: process.env.JEST_JUNIT_OUTPUT_DIR ? ['default', 'jest-junit'] : ['default'],
}
