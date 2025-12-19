import { afterEach, jest } from "@jest/globals";
import "@testing-library/jest-dom";

// Mock Web Speech API
(global as any).speechSynthesis = {
  speak: jest.fn(),
  cancel: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  getVoices: jest.fn(() => []),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

(global as any).SpeechSynthesisUtterance = jest
  .fn()
  .mockImplementation((...args: any[]) => ({
    text: args[0] as string,
    voice: null,
    rate: 1,
    pitch: 1,
    volume: 1,
    onend: null,
    onerror: null,
    onstart: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }));

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
} as Console;

// Mock timers for testing debouncing/cooldowns
jest.useFakeTimers();

// Global test utilities
(global as any).createMockError = (
  message: string,
  name: string = "Error"
): Error => {
  const error = new Error(message);
  error.name = name;
  return error;
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
});

// import "@testing-library/jest-dom";
// import "jest-dom/extend-expect"; // For additional matchers
// import { TextEncoder, TextDecoder } from "util";

// // Polyfill for Node.js environment
// global.TextEncoder = TextEncoder;
// global.TextDecoder = TextDecoder;

// // Mock Web Speech API
// global.speechSynthesis = {
//   speak: jest.fn(),
//   cancel: jest.fn(),
//   pause: jest.fn(),
//   resume: jest.fn(),
//   getVoices: jest.fn(() => []),
//   addEventListener: jest.fn(),
//   removeEventListener: jest.fn(),
// };

// global.SpeechSynthesisUtterance = jest.fn().mockImplementation((text) => ({
//   text,
//   voice: null,
//   rate: 1,
//   pitch: 1,
//   volume: 1,
//   voice: null,
//   onend: null,
//   onerror: null,
//   onstart: null,
//   addEventListener: jest.fn(),
//   removeEventListener: jest.fn(),
// }));

// // Mock console methods to avoid noise in tests
// global.console = {
//   ...console,
//   warn: jest.fn(),
//   error: jest.fn(),
//   log: jest.fn(),
// };

// // Mock timers for testing debouncing/cooldowns
// jest.useFakeTimers();

// // Global test utilities
// global.createMockError = (message, name = "Error") => {
//   const error = new Error(message);
//   error.name = name;
//   return error;
// };

// // Clean up after each test
// afterEach(() => {
//   jest.clearAllMocks();
//   jest.clearAllTimers();
// });
