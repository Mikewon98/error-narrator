import "@testing-library/jest-dom";
import "jest-dom/extend-expect"; // For additional matchers
import { TextEncoder, TextDecoder } from "util";

// Polyfill for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock Web Speech API
global.speechSynthesis = {
  speak: jest.fn(),
  cancel: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  getVoices: jest.fn(() => []),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

global.SpeechSynthesisUtterance = jest.fn().mockImplementation((text) => ({
  text,
  voice: null,
  rate: 1,
  pitch: 1,
  volume: 1,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
};

// Mock timers for testing debouncing/cooldowns
jest.useFakeTimers();

// Global test utilities
global.createMockError = (message, name = "Error") => {
  const error = new Error(message);
  error.name = name;
  return error;
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
});
