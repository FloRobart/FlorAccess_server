module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: ['src/utils/**/*.ts'],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    // High but achievable thresholds for utils
    './src/utils/': {
      branches: 85,
      functions: 95,
      lines: 95,
      statements: 95
    }
  }
};
