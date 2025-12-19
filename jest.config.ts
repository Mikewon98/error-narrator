import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  // Test environment
  testEnvironment: "jsdom", // Simulates browser environment

  // Preset for TypeScript
  preset: "ts-jest",

  // Test file patterns - updated for TypeScript
  testMatch: [
    "<rootDir>/test/**/*.test.ts",
    "<rootDir>/test/**/*.test.tsx",
    "<rootDir>/test/**/*.spec.ts",
    "<rootDir>/test/**/*.spec.tsx",
  ],

  // Setup files - updated to .ts
  setupFilesAfterEnv: ["<rootDir>/test/setup/jest.setup.ts"],

  // Module path mapping
  moduleNameMapper: {
    "^say$": "<rootDir>/test/mocks/say.ts",
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@test/(.*)$": "<rootDir>/test/$1",
  },

  // Module file extensions
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],

  // Transform files with ts-jest
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
    "^.+\\.jsx?$": "babel-jest",
  },

  // Coverage configuration - updated for TypeScript
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.ts",
    "src/**/*.tsx",
    "!src/**/*.test.ts",
    "!src/**/*.test.tsx",
    "!src/**/*.d.ts",
    "!src/**/index.ts", // Exclude entry points from coverage
    "!integration/**/*.test.ts",
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

  // Test timeout
  testTimeout: 10000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Test environments for different test types - updated for TypeScript
  projects: [
    {
      displayName: "unit",
      preset: "ts-jest",
      testMatch: [
        "<rootDir>/test/unit/**/*.test.ts",
        "<rootDir>/test/unit/**/*.test.tsx",
      ],
      testEnvironment: "jsdom",
      transform: {
        "^.+\\.tsx?$": "ts-jest",
      },
    },
    {
      displayName: "integration",
      preset: "ts-jest",
      testMatch: [
        "<rootDir>/test/integration/**/*.test.ts",
        "<rootDir>/test/integration/**/*.test.tsx",
      ],
      testEnvironment: "jsdom",
      transform: {
        "^.+\\.tsx?$": "ts-jest",
      },
    },
    {
      displayName: "e2e",
      preset: "ts-jest",
      testMatch: [
        "<rootDir>/test/e2e/**/*.test.ts",
        "<rootDir>/test/e2e/**/*.test.tsx",
      ],
      testEnvironment: "jsdom",
      transform: {
        "^.+\\.tsx?$": "ts-jest",
      },
    },
  ],
};

export default config;
