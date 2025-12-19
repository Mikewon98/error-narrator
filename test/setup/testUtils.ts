import { expect, jest } from "@jest/globals";

// Test utilities for error-narrator tests

interface MockEvent {
  error: Error;
  preventDefault: jest.Mock;
  stopPropagation: jest.Mock;
}

interface MockUnhandledRejection {
  reason: any;
  preventDefault: jest.Mock;
  promise: Promise<any>;
}

interface MockWebpackStats {
  hasErrors: () => boolean;
  compilation: {
    errors: Error[];
  };
}

interface MockErrorInfo {
  componentStack: string;
}

interface VoiceEngineOptions {
  enabled?: boolean;
  [key: string]: any;
}

interface VoiceEngineMock {
  speak: jest.Mock;
}

interface ErrorPattern {
  error: Error;
  expectedPattern: string;
  description: string;
}

export const createMockError = (
  message: string,
  type: string = "Error"
): Error => {
  const error = new Error(message);
  error.name = type;
  return error;
};

export function createMockHashString(str: string): string {
  let hash = 0;
  if (str.length === 0) return hash.toString();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString();
}

export const createMockEvent = (error: Error): MockEvent => ({
  error,
  preventDefault: jest.fn(),
  stopPropagation: jest.fn(),
});

export const createMockUnhandledRejection = (
  reason: any
): MockUnhandledRejection => ({
  reason,
  preventDefault: jest.fn(),
  promise: Promise.reject(reason),
});

// Simulate browser environment
export const mockBrowserEnvironment = (): void => {
  Object.defineProperty(window, "speechSynthesis", {
    value: {
      speak: jest.fn(),
      cancel: jest.fn(),
      getVoices: jest.fn(() => []),
    },
    writable: true,
  });

  Object.defineProperty(window, "SpeechSynthesisUtterance", {
    value: jest.fn().mockImplementation((...args: any[]) => ({
      text: args[0] as string,
      rate: 1,
      pitch: 1,
      voice: null,
    })),
    writable: true,
  });
};

// Simulate Node.js environment
export const mockNodeEnvironment = (): void => {
  delete (global as any).window;
  delete (global as any).document;

  // Mock Node.js process
  if (!(global as any).process) {
    (global as any).process = {
      env: { NODE_ENV: "development" },
      on: jest.fn(),
      removeListener: jest.fn(),
    };
  }
};

// Wait for async operations in tests
export const waitFor = (ms: number = 0): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Create mock webpack stats
export const createMockWebpackStats = (
  hasErrors: boolean = false,
  errors: (string | Error)[] = []
): MockWebpackStats => ({
  hasErrors: () => hasErrors,
  compilation: {
    errors: errors.map((err) =>
      typeof err === "string" ? new Error(err) : err
    ),
  },
});

// Create mock React error info
export const createMockErrorInfo = (
  componentStack: string = ""
): MockErrorInfo => ({
  componentStack:
    componentStack ||
    `
      in Component (at App.js:10)
      in App (at index.js:5)`,
});

// Voice engine test helpers
export const createVoiceEngineTestSuite = <
  T extends new (options?: VoiceEngineOptions) => any
>(
  VoiceEngineClass: T,
  mockImplementation: VoiceEngineMock
) => ({
  beforeEach: (): void => {
    jest.clearAllMocks();
  },

  testBasicFunctionality: (options: VoiceEngineOptions = {}): void => {
    const engine = new VoiceEngineClass(options);
    engine.speak("test message");

    expect(mockImplementation.speak).toHaveBeenCalledWith("test message");
  },

  testDisabledState: (
    options: VoiceEngineOptions = { enabled: false }
  ): void => {
    const engine = new VoiceEngineClass(options);
    engine.speak("test message");

    expect(mockImplementation.speak).not.toHaveBeenCalled();
  },
});

// Error pattern test data
export const commonErrorPatterns: ErrorPattern[] = [
  {
    error: new Error("map is not a function"),
    expectedPattern: "is not a function",
    description: "Array method error",
  },
  {
    error: new Error("Cannot read property 'length' of undefined"),
    expectedPattern: "Cannot read property",
    description: "Undefined property access",
  },
  {
    error: new TypeError("Cannot read properties of null"),
    expectedPattern: "Type error",
    description: "Null property access",
  },
  {
    error: new ReferenceError("myVar is not defined"),
    expectedPattern: "Reference error",
    description: "Undefined variable",
  },
  {
    error: new SyntaxError("Unexpected token }"),
    expectedPattern: "Syntax error",
    description: "Syntax error",
  },
];

// Mock fetch for testing web requests
export const mockFetch = (response: any): void => {
  (global as any).fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response)),
    })
  );
};

// Clean up mocks
export const cleanupMocks = (): void => {
  jest.clearAllMocks();
  jest.clearAllTimers();

  if ((global as any).fetch && (global as any).fetch.mockRestore) {
    (global as any).fetch.mockRestore();
  }
};

// // Test utilities for error-narrator tests

// export const createMockError = (message, type = "Error") => {
//   const error = new Error(message);
//   error.name = type;
//   return error;
// };

// export function createMockHashString(str) {
//   let hash = 0;
//   if (str.length === 0) return hash;
//   for (let i = 0; i < str.length; i++) {
//     const char = str.charCodeAt(i);
//     hash = (hash << 5) - hash + char;
//     hash = hash & hash; // Convert to 32-bit integer
//   }
//   return Math.abs(hash).toString();
// }

// export const createMockEvent = (error) => ({
//   error,
//   preventDefault: jest.fn(),
//   stopPropagation: jest.fn(),
// });

// export const createMockUnhandledRejection = (reason) => ({
//   reason,
//   preventDefault: jest.fn(),
//   promise: Promise.reject(reason),
// });

// // Simulate browser environment
// export const mockBrowserEnvironment = () => {
//   Object.defineProperty(window, "speechSynthesis", {
//     value: {
//       speak: jest.fn(),
//       cancel: jest.fn(),
//       getVoices: jest.fn(() => []),
//     },
//     writable: true,
//   });

//   Object.defineProperty(window, "SpeechSynthesisUtterance", {
//     value: jest.fn().mockImplementation((text) => ({
//       text,
//       rate: 1,
//       pitch: 1,
//       voice: null,
//     })),
//     writable: true,
//   });
// };

// // Simulate Node.js environment
// export const mockNodeEnvironment = () => {
//   delete global.window;
//   delete global.document;

//   // Mock Node.js process
//   if (!global.process) {
//     global.process = {
//       env: { NODE_ENV: "development" },
//       on: jest.fn(),
//       removeListener: jest.fn(),
//     };
//   }
// };

// // Wait for async operations in tests
// export const waitFor = (ms = 0) =>
//   new Promise((resolve) => setTimeout(resolve, ms));

// // Create mock webpack stats
// export const createMockWebpackStats = (hasErrors = false, errors = []) => ({
//   hasErrors: () => hasErrors,
//   compilation: {
//     errors: errors.map((err) =>
//       typeof err === "string" ? new Error(err) : err
//     ),
//   },
// });

// // Create mock React error info
// export const createMockErrorInfo = (componentStack = "") => ({
//   componentStack:
//     componentStack ||
//     `
//       in Component (at App.js:10)
//       in App (at index.js:5)`,
// });

// // Voice engine test helpers
// export const createVoiceEngineTestSuite = (
//   VoiceEngineClass,
//   mockImplementation
// ) => ({
//   beforeEach: () => {
//     jest.clearAllMocks();
//   },

//   testBasicFunctionality: (options = {}) => {
//     const engine = new VoiceEngineClass(options);
//     engine.speak("test message");

//     expect(mockImplementation.speak).toHaveBeenCalledWith("test message");
//   },

//   testDisabledState: (options = { enabled: false }) => {
//     const engine = new VoiceEngineClass(options);
//     engine.speak("test message");

//     expect(mockImplementation.speak).not.toHaveBeenCalled();
//   },
// });

// // Error pattern test data
// export const commonErrorPatterns = [
//   {
//     error: new Error("map is not a function"),
//     expectedPattern: "is not a function",
//     description: "Array method error",
//   },
//   {
//     error: new Error("Cannot read property 'length' of undefined"),
//     expectedPattern: "Cannot read property",
//     description: "Undefined property access",
//   },
//   {
//     error: new TypeError("Cannot read properties of null"),
//     expectedPattern: "Type error",
//     description: "Null property access",
//   },
//   {
//     error: new ReferenceError("myVar is not defined"),
//     expectedPattern: "Reference error",
//     description: "Undefined variable",
//   },
//   {
//     error: new SyntaxError("Unexpected token }"),
//     expectedPattern: "Syntax error",
//     description: "Syntax error",
//   },
// ];

// // Mock fetch for testing web requests
// export const mockFetch = (response) => {
//   global.fetch = jest.fn(() =>
//     Promise.resolve({
//       ok: true,
//       json: () => Promise.resolve(response),
//       text: () => Promise.resolve(JSON.stringify(response)),
//     })
//   );
// };

// // Clean up mocks
// export const cleanupMocks = () => {
//   jest.clearAllMocks();
//   jest.clearAllTimers();

//   if (global.fetch && global.fetch.mockRestore) {
//     global.fetch.mockRestore();
//   }
// };
