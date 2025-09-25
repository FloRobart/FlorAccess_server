module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    collectCoverage: false,
    collectCoverageFrom: ['src/utils/**/*.ts', 'src/controllers/**/*.ts', 'src/middlewares/**/*.ts', 'src/database/**/*.ts'],
    coverageDirectory: 'coverage',
    coverageThreshold: {
        './src/**/*.ts': {
            branches: 85,
            functions: 95,
            lines: 95,
            statements: 95
        }
    }
};
