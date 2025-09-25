module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: ['src/utils/**/*.ts', 'src/controllers/**/*.ts', 'src/middlewares/**/*.ts', 'src/database/**/*.ts'],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    // High but achievable thresholds for utils
    './src/**/*.ts': {
      branches: 85,
      functions: 95,
      lines: 95,
      statements: 95
    }
  }
};
