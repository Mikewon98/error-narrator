import ErrorNarrator from "../../src/index";
import { waitFor, createMockError, cleanupMocks } from "../setup/testUtils";

describe("Full Flow E2E Tests", () => {
  let errorNarrator;
  let originalConsoleError;
  let mockSpeechSynthesis;

  beforeAll(() => {
    // Mock console.error to avoid noise
    originalConsoleError = console.error;
    console.error = jest.fn();

    // Setup mock speech synthesis
    mockSpeechSynthesis = {
      speak: jest.fn(),
      cancel: jest.fn(),
      getVoices: jest.fn(() => []),
      speaking: false,
      pending: false,
    };

    global.speechSynthesis = mockSpeechSynthesis;
    global.SpeechSynthesisUtterance = jest.fn().mockImplementation((text) => ({
      text,
      rate: 1,
      pitch: 1,
      voice: null,
    }));
  });

  beforeEach(() => {
    cleanupMocks();
    process.env.NODE_ENV = "development";
  });

  afterEach(() => {
    if (errorNarrator) {
      // Clean up event listeners if your implementation supports it
      errorNarrator = null;
    }
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  describe("Browser Environment Full Flow", () => {
    test("should initialize and handle window errors", async () => {
      errorNarrator = new ErrorNarrator({
        enabled: true,
        cooldownMs: 100,
      });

      // Simulate a window error
      const error = createMockError("map is not a function", "TypeError");
      const errorEvent = new ErrorEvent("error", { error });

      window.dispatchEvent(errorEvent);

      await waitFor(50); // Allow async processing

      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(1);
      const call = mockSpeechSynthesis.speak.mock.calls[0][0];
      expect(call.text).toContain("Development error");
      expect(call.text).toContain("is not a function");
    });

    test("should handle unhandled promise rejections", async () => {
      errorNarrator = new ErrorNarrator({
        enabled: true,
        cooldownMs: 100,
      });

      // Simulate unhandled promise rejection
      const reason = createMockError("Promise rejected", "Error");
      const rejectionEvent = {
        reason,
        preventDefault: jest.fn(),
      };

      window.dispatchEvent(
        Object.assign(new Event("unhandledrejection"), rejectionEvent)
      );

      await waitFor(50);

      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(1);
      const call = mockSpeechSynthesis.speak.mock.calls[0][0];
      expect(call.text).toContain("Development error");
    });

    test("should respect cooldown periods", async () => {
      errorNarrator = new ErrorNarrator({
        enabled: true,
        cooldownMs: 200,
      });

      // First error
      const error1 = createMockError("First error");
      window.dispatchEvent(new ErrorEvent("error", { error: error1 }));

      await waitFor(50);
      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(1);

      // Second error immediately (should be blocked)
      const error2 = createMockError("Second error");
      window.dispatchEvent(new ErrorEvent("error", { error: error2 }));

      await waitFor(50);
      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(1); // Still 1

      // Wait for cooldown and try again
      await waitFor(200);

      const error3 = createMockError("Third error");
      window.dispatchEvent(new ErrorEvent("error", { error: error3 }));

      await waitFor(50);
      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(2); // Now 2
    });

    test("should filter ignored error patterns", async () => {
      errorNarrator = new ErrorNarrator({
        enabled: true,
        filters: {
          ignorePatterns: ["ResizeObserver", "Non-critical"],
        },
      });

      // Should be ignored
      const ignoredError = createMockError(
        "ResizeObserver loop limit exceeded"
      );
      window.dispatchEvent(new ErrorEvent("error", { error: ignoredError }));

      await waitFor(50);
      expect(mockSpeechSynthesis.speak).not.toHaveBeenCalled();

      // Should not be ignored
      const normalError = createMockError("Actual runtime error");
      window.dispatchEvent(new ErrorEvent("error", { error: normalError }));

      await waitFor(50);
      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(1);
    });

    test("should handle manual speak calls", () => {
      errorNarrator = new ErrorNarrator({ enabled: true });

      errorNarrator.speak("Manual test message");

      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(1);
      const call = mockSpeechSynthesis.speak.mock.calls[0][0];
      expect(call.text).toBe("Manual test message");
    });

    test("should be disabled in production environment", async () => {
      process.env.NODE_ENV = "production";

      errorNarrator = new ErrorNarrator(); // Should be disabled by default

      const error = createMockError("Production error");
      window.dispatchEvent(new ErrorEvent("error", { error }));

      await waitFor(50);
      expect(mockSpeechSynthesis.speak).not.toHaveBeenCalled();
    });
  });

  describe("Configuration Edge Cases", () => {
    test("should handle invalid configuration gracefully", () => {
      expect(() => {
        errorNarrator = new ErrorNarrator({
          enabled: "invalid",
          rate: "not-a-number",
          cooldownMs: -1000,
        });
      }).not.toThrow();

      expect(errorNarrator).toBeDefined();
    });

    test("should handle missing speechSynthesis API", async () => {
      const originalSpeechSynthesis = global.speechSynthesis;
      delete global.speechSynthesis;

      expect(() => {
        errorNarrator = new ErrorNarrator({ enabled: true });
      }).not.toThrow();

      // Restore for other tests
      global.speechSynthesis = originalSpeechSynthesis;
    });

    test("should handle complex error objects", async () => {
      errorNarrator = new ErrorNarrator({ enabled: true });

      const complexError = {
        message: "Complex error with nested data",
        stack: "Error stack trace...",
        name: "CustomError",
        nested: {
          data: "some data",
        },
      };

      window.dispatchEvent(new ErrorEvent("error", { error: complexError }));

      await waitFor(50);
      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(1);
    });
  });

  describe("Performance Tests", () => {
    test("should handle rapid error bursts without blocking", async () => {
      errorNarrator = new ErrorNarrator({
        enabled: true,
        cooldownMs: 50,
      });

      // Fire 10 errors rapidly
      const startTime = Date.now();
      for (let i = 0; i < 10; i++) {
        const error = createMockError(`Rapid error ${i}`);
        window.dispatchEvent(new ErrorEvent("error", { error }));
      }
      const endTime = Date.now();

      // Should complete quickly (non-blocking)
      expect(endTime - startTime).toBeLessThan(100);

      await waitFor(100);

      // Only first error should have been spoken due to cooldown
      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(1);
    });

    test("should handle very long error messages", async () => {
      errorNarrator = new ErrorNarrator({ enabled: true });

      const longMessage = "A".repeat(1000);
      const error = createMockError(longMessage);

      window.dispatchEvent(new ErrorEvent("error", { error }));

      await waitFor(50);

      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(1);
      const call = mockSpeechSynthesis.speak.mock.calls[0][0];
      // Should be truncated
      expect(call.text.length).toBeLessThan(200);
    });
  });
});
