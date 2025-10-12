module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.enable.test.ts'],
    verbose: true,
    collectCoverage: true,
    coverageDirectory: 'coverage',
    transform: {
        '^.+\\.ts$': 'ts-jest'
    },
    globals: {
        'ts-jest': {
            tsconfig: 'tsconfig.json'
        }
    }
};