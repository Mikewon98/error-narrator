module.exports = {
  // Test environment
  testEnvironment: "jsdom", // Simulates browser environment

  // Test file patterns
  testMatch: ["<rootDir>/test/**/*.test.js", "<rootDir>/test/**/*.spec.js"],

  // Setup files
  setupFilesAfterEnv: ["<rootDir>/test/setup/jest.setup.js"],

  // Module path mapping
  moduleNameMapper: {
    "^say$": "<rootDir>/test/mocks/say.js",
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@test/(.*)$": "<rootDir>/test/$1",
  },

  // Transform files with Babel
  transform: {
    "^.+\\.js$": "babel-jest",
  },

  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/**/*.test.js",
    "!src/**/index.js", // Exclude entry points from coverage
    "!integration/**/*.test.js",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Mock modules
  moduleNameMapping: {
    "^say$": "<rootDir>/test/mocks/say.js",
  },

  // Test timeout
  testTimeout: 10000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Test environments for different test types
  projects: [
    {
      displayName: "unit",
      testMatch: ["<rootDir>/test/unit/**/*.test.js"],
      testEnvironment: "jsdom",
    },
    {
      displayName: "integration",
      testMatch: ["<rootDir>/test/integration/**/*.test.js"],
      testEnvironment: "jsdom",
    },
    // {
    //   displayName: "node",
    //   testMatch: ["<rootDir>/test/unit/node.test.js"],
    //   testEnvironment: "node",
    // },
  ],
};
