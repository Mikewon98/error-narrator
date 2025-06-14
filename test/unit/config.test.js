import { Config, defaultConfig } from "../../src/config";

jest.useFakeTimers();

describe("Config", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeAll(() => {
    process.env.NODE_ENV = "development";
  });

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe("initialization", () => {
    test("should initialize with default config", () => {
      const config = new Config();
      expect(config.getConfig()).toEqual(defaultConfig);
    });

    test("should merge user config with defaults", () => {
      const userConfig = {
        enabled: true,
        rate: 1.5,
        cooldownMs: 3000,
        filters: {
          ignorePatterns: ["custom pattern"],
          errorTypes: [],
        },
      };

      const config = new Config(userConfig);

      expect(config.getConfig().enabled).toBe(true);
      expect(config.getConfig().rate).toBe(1.5);
      expect(config.getConfig().cooldownMs).toBe(3000);
      expect(config.getConfig().pitch).toBe(1);
      expect(config.getConfig().filters.ignorePatterns).toEqual([
        "custom pattern",
      ]);
      expect(config.getConfig().filters.errorTypes).toEqual([]);
    });
  });

  describe("shouldSpeak", () => {
    test("should return false if disabled", () => {
      const config = new Config({
        enabled: false,
        filters: {
          ignorePatterns: ["custom pattern"],
          errorTypes: [],
        },
      });
      const error = new TypeError("Test error");
      expect(config.shouldSpeak(error)).toBe(false);
    });

    // test("should allow speaking when cooldown has passed", () => {
    //   const config = new Config({
    //     filters: {
    //       ignorePatterns: ["custom pattern"],
    //       errorTypes: [],
    //     },
    //   }); // Uses default config
    //   const error = new TypeError("This is a TypeError"); // TypeError is in the allowed list
    //   expect(config.shouldSpeak(error)).toBe(true);
    // });

    test("should allow speaking when cooldown has passed", () => {
      const config = new Config({
        enabled: true,
        filters: {
          ignorePatterns: ["custom pattern"],
          errorTypes: ["TypeError"], // Allow TypeError specifically
        },
      });
      const error = new TypeError("This is a TypeError");
      expect(config.shouldSpeak(error)).toBe(true);
    });

    test("should prevent speaking during cooldown period", () => {
      const config = new Config({ cooldownMs: 5000, enabled: true });
      const error = new ReferenceError("This is a ReferenceError"); // ReferenceError is in the allowed list

      // First call should succeed
      expect(config.shouldSpeak(error)).toBe(true);

      // Immediate second call should be blocked by specific error cooldown
      expect(config.shouldSpeak(error)).toBe(false);

      // A different error should be blocked by the global cooldown
      const anotherError = new TypeError("Another error");
      expect(config.shouldSpeak(anotherError)).toBe(false);
    });

    test("should allow speaking again after cooldown", () => {
      const config = new Config({
        filters: {
          ignorePatterns: ["custom pattern"],
          errorTypes: ["TypeError"], // Allow TypeError specifically
        },
        cooldownMs: 5000,
        enabled: true,
      });
      const error = new TypeError("Test error"); // TypeError is in the allowed list

      config.shouldSpeak(error); // Speak once to start cooldown
      // jest.advanceTimersByTime(4999);
      setTimeout(() => {}, 4999);

      // Should still be blocked
      expect(config.shouldSpeak(error)).toBe(false);
      setTimeout(() => {}, 21);
      // jest.advanceTimersByTime(21); // Total time is 5020ms

      // After cooldown, should work again
      expect(config.shouldSpeak(error)).toBe(true);
    });

    test("should ignore errors matching ignore patterns", () => {
      const config = new Config({
        enabled: true,
        filters: {
          // Keep errorTypes to include Error type, or clear it entirely
          errorTypes: ["Error"], // Allow generic Error type
          ignorePatterns: ["ResizeObserver", "Non-critical warning"],
        },
      });

      const ignoredError1 = new Error("ResizeObserver loop limit exceeded");
      const ignoredError2 = new Error("Non-critical warning occurred");
      const normalError = new Error("Actual error"); // Now using Error type which is allowed

      expect(config.shouldSpeak(ignoredError1)).toBe(false);
      expect(config.shouldSpeak(ignoredError2)).toBe(false);
      expect(config.shouldSpeak(normalError)).toBe(true);
    });

    test("should handle 'only' patterns filter", () => {
      const config = new Config({
        enabled: true,
        filters: {
          errorTypes: ["Error"], // Allow Error type
          onlyPatterns: ["critical", "important"],
        },
      });

      const criticalError = new Error("This is a critical failure");
      const importantError = new Error("An important error");
      const otherError = new Error("Just a regular error");

      expect(config.shouldSpeak(criticalError)).toBe(true);

      // Advance time to bypass global cooldown for the next check
      jest.advanceTimersByTime(5001);
      expect(config.shouldSpeak(importantError)).toBe(true);

      jest.advanceTimersByTime(5001);
      expect(config.shouldSpeak(otherError)).toBe(false);
    });

    test("should handle error objects without a message property", () => {
      const config = new Config({
        filters: { errorTypes: ["Object"] },
        enabled: true,
      });
      const error = {}; // constructor.name will be 'Object'
      expect(config.shouldSpeak(error)).toBe(true);
    });

    test("should update lastSpoken timestamp", () => {
      const config = new Config({
        enabled: true,
        filters: { errorTypes: ["TypeError"] }, // Allow TypeError
      });
      const error = new TypeError("Test error");
      const errorKey = `${error.constructor.name}:${error.message.substring(
        0,
        50
      )}`;

      const initialGlobalTime = config.lastSpoken.get("global");
      const initialErrorTime = config.lastSpoken.get(errorKey);

      expect(initialGlobalTime).toBeUndefined();
      expect(initialErrorTime).toBeUndefined();

      config.shouldSpeak(error);

      expect(config.lastSpoken.get("global")).toBeGreaterThan(0);
      expect(config.lastSpoken.get(errorKey)).toBeGreaterThan(0);
      // Check that they are set to the current time (which is mocked)
      expect(config.lastSpoken.get(errorKey)).toEqual(Date.now());
    });
  });

  describe("edge cases", () => {
    test("should handle null/undefined user config", () => {
      let config = new Config(null);
      expect(config.getConfig()).toBeDefined();
      expect(config.getConfig()).toEqual(defaultConfig);

      config = new Config(undefined);
      expect(config.getConfig()).toBeDefined();
      expect(config.getConfig()).toEqual(defaultConfig);
    });

    test("should handle negative cooldown values gracefully", () => {
      // A negative cooldown should mean no cooldown at all.
      const config = new Config({
        enabled: true,
        cooldownMs: -1000,
        filters: { errorTypes: ["Error"] }, // Allow Error type
      });
      const error = new Error("Test");

      expect(config.shouldSpeak(error)).toBe(true);
      // It should speak again immediately as cooldown is less than 0
      expect(config.shouldSpeak(error)).toBe(true);
    });
  });
});

// ----------------------------------------------------------------------------------------------------------

// import { Config, defaultConfig } from "../../src/config";

// // Use fake timers for all tests in this file
// jest.useFakeTimers();

// describe("Config", () => {
// const originalEnv = process.env.NODE_ENV;

// beforeAll(() => {
//   process.env.NODE_ENV = "development";
// });

// afterAll(() => {
//   process.env.NODE_ENV = originalEnv;
// });

//   // No need for a global config variable or afterEach hook
//   // We will instantiate it fresh in each test.

//   describe("initialization", () => {
//     test("should initialize with default config", () => {
//       const config = new Config();
//       // Directly compare with the imported defaultConfig object
//       expect(config.getConfig()).toEqual(defaultConfig);
//     });

//     test("should merge user config with defaults", () => {
//       const userConfig = {
//         enabled: true,
//         rate: 1.5,
//         cooldownMs: 3000,
//         filters: {
//           ignorePatterns: ["custom pattern"],
//           // Also override errorTypes to ensure predictability
//           errorTypes: [],
//         },
//       };

//       const config = new Config(userConfig);

//       expect(config.getConfig().enabled).toBe(true);
//       expect(config.getConfig().rate).toBe(1.5);
//       expect(config.getConfig().cooldownMs).toBe(3000);
//       expect(config.getConfig().pitch).toBe(1); // Should keep default
//       expect(config.getConfig().filters.ignorePatterns).toEqual([
//         "custom pattern",
//       ]);
//       expect(config.getConfig().filters.errorTypes).toEqual([]);
//     });
//   });

//   describe("shouldSpeak", () => {
//     test("should return false if disabled", () => {
//       const config = new Config({ enabled: false });
//       const error = new TypeError("Test error");
//       expect(config.shouldSpeak(error)).toBe(false);
//     });

//     test("should allow speaking when cooldown has passed", () => {
//       const config = new Config(); // Uses default config
//       const error = new TypeError("This is a TypeError");
//       expect(config.shouldSpeak(error)).toBe(true);
//     });

//     test("should prevent speaking during cooldown period", () => {
//       const config = new Config({ cooldownMs: 5000 });
//       const error = new ReferenceError("This is a ReferenceError");

//       // First call should succeed
//       expect(config.shouldSpeak(error)).toBe(true);

//       // Immediate second call should be blocked by specific error cooldown
//       expect(config.shouldSpeak(error)).toBe(false);

//       // A different error should be blocked by the global cooldown
//       const anotherError = new TypeError("Another error");
//       expect(config.shouldSpeak(anotherError)).toBe(false);
//     });

//     test("should allow speaking again after cooldown", () => {
//       const config = new Config({ cooldownMs: 5000 });
//       const error = new TypeError("Test error");

//       config.shouldSpeak(error); // Speak once to start cooldown
//       jest.advanceTimersByTime(4999);

//       // Should still be blocked
//       expect(config.shouldSpeak(error)).toBe(false);

//       jest.advanceTimersByTime(2); // Total time is 5001ms

//       // After cooldown, should work again
//       expect(config.shouldSpeak(error)).toBe(true);
//     });

//     test("should ignore errors matching ignore patterns", () => {
//       const config = new Config({
//         filters: {
//           // Clear errorTypes filter to test ignorePatterns in isolation
//           errorTypes: [],
//           ignorePatterns: ["ResizeObserver", "Non-critical warning"],
//         },
//       });

//       const ignoredError1 = new Error("ResizeObserver loop limit exceeded");
//       const ignoredError2 = new Error("Non-critical warning occurred");
//       const normalError = new TypeError("Actual error");

//       expect(config.shouldSpeak(ignoredError1)).toBe(false);
//       expect(config.shouldSpeak(ignoredError2)).toBe(false);
//       expect(config.shouldSpeak(normalError)).toBe(true);
//     });

//     test("should handle 'only' patterns filter", () => {
//       const config = new Config({
//         filters: {
//           errorTypes: [], // Clear other filters
//           onlyPatterns: ["critical", "important"],
//         },
//       });

//       const criticalError = new Error("This is a critical failure");
//       const importantError = new Error("An important error");
//       const otherError = new Error("Just a regular error");

//       expect(config.shouldSpeak(criticalError)).toBe(true);

//       // Advance time to bypass global cooldown for the next check
//       jest.advanceTimersByTime(5001);
//       expect(config.shouldSpeak(importantError)).toBe(true);

//       jest.advanceTimersByTime(5001);
//       expect(config.shouldSpeak(otherError)).toBe(false);
//     });

//     test("should handle error objects without a message property", () => {
//       const config = new Config({ filters: { errorTypes: ["Object"] } });
//       const error = {}; // constructor.name will be 'Object'
//       expect(config.shouldSpeak(error)).toBe(true);
//     });

//     test("should update lastSpoken timestamp", () => {
//       const config = new Config();
//       const error = new TypeError("Test error");
//       const errorKey = `${error.constructor.name}:${error.message.substring(
//         0,
//         50
//       )}`;

//       const initialGlobalTime = config.lastSpoken.get("global");
//       const initialErrorTime = config.lastSpoken.get(errorKey);

//       expect(initialGlobalTime).toBeUndefined();
//       expect(initialErrorTime).toBeUndefined();

//       config.shouldSpeak(error);

//       expect(config.lastSpoken.get("global")).toBeGreaterThan(0);
//       expect(config.lastSpoken.get(errorKey)).toBeGreaterThan(0);
//       // Check that they are set to the current time (which is mocked)
//       jest.useFakeTimers();
//       jest.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
//       expect(config.lastSpoken.get(errorKey)).toEqual(Date.now());
//     });
//   });

//   describe("edge cases", () => {
//     test("should handle null/undefined user config", () => {
//       let config = new Config(null);
//       expect(config.getConfig()).toBeDefined();
//       expect(config.getConfig()).toEqual(defaultConfig);

//       config = new Config(undefined);
//       expect(config.getConfig()).toBeDefined();
//       expect(config.getConfig()).toEqual(defaultConfig);
//     });

//     test("should handle negative cooldown values gracefully", () => {
//       // A negative cooldown should mean no cooldown at all.
//       const config = new Config({
//         cooldownMs: -1000,
//         filters: { errorTypes: [] },
//       });
//       const error = new Error("Test");

//       expect(config.shouldSpeak(error)).toBe(true);
//       // It should speak again immediately as cooldown is less than 0
//       expect(config.shouldSpeak(error)).toBe(true);
//     });
//   });
// });

// -----------------------------------------------------------------------------------------------------------

// import { Config } from "../../src/config";

// describe("Config", () => {
//   let config;

//   beforeEach(() => {
//     jest.useFakeTimers();
//   });

//   afterEach(() => {
//     jest.useRealTimers();
//     config = null;
//   });

//   describe("initialization", () => {
//     test("should initialize with default config", () => {
//       config = new Config();

//       expect(config.config.enabled).toBe(
//         process.env.NODE_ENV === "development"
//       );
//       expect(config.config.voice).toBeNull();
//       expect(config.config.rate).toBe(1);
//       expect(config.config.pitch).toBe(1);
//       expect(config.config.maxMessageLength).toBe(100);
//       expect(config.config.cooldownMs).toBe(5000);
//     });

//     test("should merge user config with defaults", () => {
//       const userConfig = {
//         enabled: true,
//         rate: 1.5,
//         cooldownMs: 3000,
//         filters: {
//           ignorePatterns: ["custom pattern"],
//         },
//       };

//       config = new Config(userConfig);

//       expect(config.config.enabled).toBe(true);
//       expect(config.config.rate).toBe(1.5);
//       expect(config.config.cooldownMs).toBe(3000);
//       expect(config.config.pitch).toBe(1); // Should keep default
//       expect(config.config.filters.ignorePatterns).toEqual(["custom pattern"]);
//     });
//   });

//   describe("shouldSpeak", () => {
//     beforeEach(() => {
//       config = new Config({ cooldownMs: 1000 });
//     });

//     test("should allow speaking when cooldown has passed", () => {
//       const error = new TypeError("Test error");

//       expect(config.shouldSpeak(error)).toBe(true);
//     });

//     test("should prevent speaking during cooldown period", () => {
//       const error = new TypeError("Test error");

//       // First call should succeed
//       expect(config.shouldSpeak(error)).toBe(true);

//       // Immediate second call should be blocked
//       expect(config.shouldSpeak(error)).toBe(false);

//       // After cooldown, should work again
//       jest.advanceTimersByTime(1001);
//       expect(config.shouldSpeak(error)).toBe(true);
//     });

//     test("should ignore errors matching ignore patterns", () => {
//       config = new Config({
//         filters: {
//           ignorePatterns: ["ResizeObserver", "Non-critical warning"],
//         },
//       });

//       const ignoredError1 = new Error("ResizeObserver loop limit exceeded");
//       const ignoredError2 = new Error("Non-critical warning occurred");
//       const normalError = new Error("Actual error");
//       const typeError = new Error("Cannot read property");

//       expect(config.shouldSpeak(ignoredError1)).toBe(false);
//       expect(config.shouldSpeak(ignoredError2)).toBe(false);
//       expect(config.shouldSpeak(normalError)).toBe(false);
//       expect(config.shouldSpeak(typeError)).toBe(true);
//     });

//     test("should handle only patterns filter", () => {
//       config = new Config({
//         filters: {
//           onlyPatterns: ["Type error", "Reference error"],
//         },
//       });

//       const typeError = new Error("Type error occurred");
//       const referenceError = new Error("Reference error happened");
//       const syntaxError = new Error("Syntax error occurred");

//       expect(config.shouldSpeak(typeError)).toBe(true);

//       // Advance time to bypass cooldown
//       jest.advanceTimersByTime(5001);
//       expect(config.shouldSpeak(referenceError)).toBe(true);

//       // Advance time again
//       jest.advanceTimersByTime(5001);
//       expect(config.shouldSpeak(syntaxError)).toBe(false);
//     });

//     test("should handle errors without messages", () => {
//       const error = {};
//       expect(config.shouldSpeak(error)).toBe(true);
//     });

//     test("should update lastSpoken timestamp", () => {
//       const error = new Error("Test error");
//       const initialTime = config.lastSpoken;

//       config.shouldSpeak(error);

//       expect(config.lastSpoken).toBeGreaterThan(initialTime);
//     });

//     test("should handle multiple rapid errors correctly", () => {
//       const error1 = new Error("Error 1");
//       const error2 = new Error("Error 2");
//       const error3 = new Error("Error 3");

//       expect(config.shouldSpeak(error1)).toBe(true);
//       expect(config.shouldSpeak(error2)).toBe(false);
//       expect(config.shouldSpeak(error3)).toBe(false);

//       jest.advanceTimersByTime(1001);
//       expect(config.shouldSpeak(error3)).toBe(true);
//     });
//   });

//   describe("edge cases", () => {
//     test("should handle null/undefined user config", () => {
//       config = new Config(null);
//       expect(config.config).toBeDefined();

//       config = new Config(undefined);
//       expect(config.config).toBeDefined();
//     });

//     test("should handle invalid cooldown values", () => {
//       config = new Config({ cooldownMs: -1000 });
//       const error = new Error("Test");

//       expect(config.shouldSpeak(error)).toBe(true);
//       expect(config.shouldSpeak(error)).toBe(true); // Should still work with negative cooldown
//     });
//   });
// });
