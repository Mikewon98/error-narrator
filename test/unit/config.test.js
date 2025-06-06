import { Config } from "../../src/config";

describe("Config", () => {
  let config;

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    config = null;
  });

  describe("initialization", () => {
    test("should initialize with default config", () => {
      config = new Config();

      expect(config.config.enabled).toBe(
        process.env.NODE_ENV === "development"
      );
      expect(config.config.voice).toBeNull();
      expect(config.config.rate).toBe(1);
      expect(config.config.pitch).toBe(1);
      expect(config.config.maxMessageLength).toBe(100);
      expect(config.config.cooldownMs).toBe(5000);
    });

    test("should merge user config with defaults", () => {
      const userConfig = {
        enabled: true,
        rate: 1.5,
        cooldownMs: 3000,
        filters: {
          ignorePatterns: ["custom pattern"],
        },
      };

      config = new Config(userConfig);

      expect(config.config.enabled).toBe(true);
      expect(config.config.rate).toBe(1.5);
      expect(config.config.cooldownMs).toBe(3000);
      expect(config.config.pitch).toBe(1); // Should keep default
      expect(config.config.filters.ignorePatterns).toEqual(["custom pattern"]);
    });
  });

  describe("shouldSpeak", () => {
    beforeEach(() => {
      config = new Config({ cooldownMs: 1000 });
    });

    test("should allow speaking when cooldown has passed", () => {
      const error = new Error("Test error");

      expect(config.shouldSpeak(error)).toBe(true);
    });

    test("should prevent speaking during cooldown period", () => {
      const error = new Error("Test error");

      // First call should succeed
      expect(config.shouldSpeak(error)).toBe(true);

      // Immediate second call should be blocked
      expect(config.shouldSpeak(error)).toBe(false);

      // After cooldown, should work again
      jest.advanceTimersByTime(1001);
      expect(config.shouldSpeak(error)).toBe(true);
    });

    test("should ignore errors matching ignore patterns", () => {
      config = new Config({
        filters: {
          ignorePatterns: ["ResizeObserver", "Non-critical warning"],
        },
      });

      const ignoredError1 = new Error("ResizeObserver loop limit exceeded");
      const ignoredError2 = new Error("Non-critical warning occurred");
      const normalError = new Error("Actual error");

      expect(config.shouldSpeak(ignoredError1)).toBe(false);
      expect(config.shouldSpeak(ignoredError2)).toBe(false);
      expect(config.shouldSpeak(normalError)).toBe(true);
    });

    test("should handle only patterns filter", () => {
      config = new Config({
        filters: {
          onlyPatterns: ["Type error", "Reference error"],
        },
      });

      const typeError = new Error("Type error occurred");
      const referenceError = new Error("Reference error happened");
      const syntaxError = new Error("Syntax error occurred");

      expect(config.shouldSpeak(typeError)).toBe(true);

      // Advance time to bypass cooldown
      jest.advanceTimersByTime(5001);
      expect(config.shouldSpeak(referenceError)).toBe(true);

      // Advance time again
      jest.advanceTimersByTime(5001);
      expect(config.shouldSpeak(syntaxError)).toBe(false);
    });

    test("should handle errors without messages", () => {
      const error = {};
      expect(config.shouldSpeak(error)).toBe(true);
    });

    test("should update lastSpoken timestamp", () => {
      const error = new Error("Test error");
      const initialTime = config.lastSpoken;

      config.shouldSpeak(error);

      expect(config.lastSpoken).toBeGreaterThan(initialTime);
    });

    test("should handle multiple rapid errors correctly", () => {
      const error1 = new Error("Error 1");
      const error2 = new Error("Error 2");
      const error3 = new Error("Error 3");

      expect(config.shouldSpeak(error1)).toBe(true);
      expect(config.shouldSpeak(error2)).toBe(false);
      expect(config.shouldSpeak(error3)).toBe(false);

      jest.advanceTimersByTime(1001);
      expect(config.shouldSpeak(error3)).toBe(true);
    });
  });

  describe("edge cases", () => {
    test("should handle null/undefined user config", () => {
      config = new Config(null);
      expect(config.config).toBeDefined();

      config = new Config(undefined);
      expect(config.config).toBeDefined();
    });

    test("should handle invalid cooldown values", () => {
      config = new Config({ cooldownMs: -1000 });
      const error = new Error("Test");

      expect(config.shouldSpeak(error)).toBe(true);
      expect(config.shouldSpeak(error)).toBe(true); // Should still work with negative cooldown
    });
  });
});
