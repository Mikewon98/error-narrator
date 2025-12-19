import { ErrorProcessor } from "../../src/errorProcessor";
import { describe, test, expect, jest } from "@jest/globals";

describe("ErrorProcessor", () => {
  describe("humanizeError", () => {
    test('should humanize "is not a function" error', () => {
      const error = new Error("map is not a function");
      const result = ErrorProcessor.humanizeError(error);

      expect(result).toContain("is not a function");
      expect(result).toContain("Check if it's properly");
    });

    test('should humanize "Cannot read property" error', () => {
      const error = new Error("Cannot read property 'length' of undefined");
      const result = ErrorProcessor.humanizeError(error);

      expect(result).toContain("Cannot read property");
      expect(result).toContain("null or undefined");
    });

    test("should handle ReferenceError", () => {
      const error = new ReferenceError("myVariable is not defined");
      const result = ErrorProcessor.humanizeError(error);

      expect(result).toContain("Reference error");
      expect(result).toContain("myVariable is not defined");
    });

    test("should handle TypeError", () => {
      const error = new TypeError("Cannot read property of null");
      const result = ErrorProcessor.humanizeError(error);

      expect(result).toContain("Type error");
    });

    test("should handle syntax errors", () => {
      const error = new SyntaxError("Unexpected token }");
      const result = ErrorProcessor.humanizeError(error);

      expect(result).toContain("Syntax error");
      expect(result).toContain("brackets, commas, or quotes");
    });

    test("should clean up and truncate long messages", () => {
      const longMessage = "A".repeat(200);
      const error = new Error(longMessage);
      const result = ErrorProcessor.humanizeError(error, {
        maxMessageLength: 100,
      });

      expect(result.length).toBeLessThanOrEqual(100);
    });

    test("should handle errors without messages", () => {
      const error = {} as Error;
      const result = ErrorProcessor.humanizeError(error);

      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    test("should remove special characters from fallback messages", () => {
      const error = new Error('Error: {complex: [object], with: "quotes"}');
      const result = ErrorProcessor.humanizeError(error);

      expect(result).not.toMatch(/[{}[\]"]/);
    });
  });

  describe("cleanMessage", () => {
    test("should remove webpack noise", () => {
      const message = "webpack:///./src/file.js! Error occurred";
      const result = ErrorProcessor.cleanMessage(message);

      expect(result).not.toContain("webpack://");
      expect(result).not.toContain("./");
    });

    test("should replace node_modules paths", () => {
      const message = "Error in /path/to/node_modules/package/file.js:10:5";
      const result = ErrorProcessor.cleanMessage(message);

      expect(result).toContain("dependency");
      expect(result).not.toContain("node_modules");
    });

    test("should clean up special characters", () => {
      const message = "Error: {value: [1, 2, 3]}";
      const result = ErrorProcessor.cleanMessage(message);

      expect(result).not.toContain("{");
      expect(result).not.toContain("[");
      expect(result).not.toContain("]");
      expect(result).not.toContain("}");
    });

    test("should normalize whitespace", () => {
      const message = "Error    with    multiple    spaces";
      const result = ErrorProcessor.cleanMessage(message);

      expect(result).toBe("Error with multiple spaces");
    });
  });

  describe("truncateMessage", () => {
    test("should not truncate messages under limit", () => {
      const message = "Short message";
      const result = ErrorProcessor.truncateMessage(message, 50);

      expect(result).toBe(message);
    });

    test("should truncate messages over limit", () => {
      const message = "A".repeat(200);
      const result = ErrorProcessor.truncateMessage(message, 100);

      expect(result.length).toBe(100);
      expect(result).toMatch(/\.\.\.$/);
    });

    test("should use default max length of 150", () => {
      const message = "A".repeat(200);
      const result = ErrorProcessor.truncateMessage(message);

      expect(result.length).toBe(150);
    });
  });

  describe("getErrorSeverity", () => {
    test("should return critical for ReferenceError", () => {
      const error = new ReferenceError("variable is not defined");
      const severity = ErrorProcessor.getErrorSeverity(error);

      expect(severity).toBe("critical");
    });

    test("should return critical for SyntaxError", () => {
      const error = new SyntaxError("Unexpected token");
      const severity = ErrorProcessor.getErrorSeverity(error);

      expect(severity).toBe("critical");
    });

    test("should return critical for module errors", () => {
      const error = new Error("Module not found: ./myModule");
      const severity = ErrorProcessor.getErrorSeverity(error);

      expect(severity).toBe("critical");
    });

    test("should return critical for network errors", () => {
      const error = new Error("Failed to fetch");
      const severity = ErrorProcessor.getErrorSeverity(error);

      expect(severity).toBe("critical");
    });

    test("should return warning for ResizeObserver errors", () => {
      const error = new Error("ResizeObserver loop limit exceeded");
      const severity = ErrorProcessor.getErrorSeverity(error);

      expect(severity).toBe("warning");
    });

    test("should return normal for generic errors", () => {
      const error = new Error("Something went wrong");
      const severity = ErrorProcessor.getErrorSeverity(error);

      expect(severity).toBe("normal");
    });
  });

  describe("shouldIgnoreError", () => {
    test("should ignore ResizeObserver errors", () => {
      const error = new Error("ResizeObserver loop limit exceeded");
      const shouldIgnore = ErrorProcessor.shouldIgnoreError(error);

      expect(shouldIgnore).toBe(true);
    });

    test("should ignore non-Error promise rejections", () => {
      const error = new Error(
        "Non-Error promise rejection captured with value"
      );
      const shouldIgnore = ErrorProcessor.shouldIgnoreError(error);

      expect(shouldIgnore).toBe(true);
    });

    test("should ignore chunk loading errors", () => {
      const error = new Error("Loading chunk 5 failed");
      const shouldIgnore = ErrorProcessor.shouldIgnoreError(error);

      expect(shouldIgnore).toBe(true);
    });

    test("should ignore ChunkLoadError", () => {
      const error = new Error("ChunkLoadError: Loading chunk failed");
      const shouldIgnore = ErrorProcessor.shouldIgnoreError(error);

      expect(shouldIgnore).toBe(true);
    });

    test("should not ignore regular errors", () => {
      const error = new Error("Normal error message");
      const shouldIgnore = ErrorProcessor.shouldIgnoreError(error);

      expect(shouldIgnore).toBe(false);
    });

    test("should not ignore ReferenceError", () => {
      const error = new ReferenceError("variable is not defined");
      const shouldIgnore = ErrorProcessor.shouldIgnoreError(error);

      expect(shouldIgnore).toBe(false);
    });
  });

  describe("error pattern matching", () => {
    test("should handle modern Cannot read properties syntax", () => {
      const error = new Error(
        "Cannot read properties of undefined (reading 'map')"
      );
      const result = ErrorProcessor.humanizeError(error);

      expect(result).toContain("Cannot read property");
      expect(result).toContain("undefined");
    });

    test("should handle network errors", () => {
      const error = new Error("Failed to fetch");
      const result = ErrorProcessor.humanizeError(error);

      expect(result).toContain("Network error");
      expect(result).toContain("internet connection");
    });

    test("should handle React-specific errors", () => {
      const error = new Error("Objects are not valid as a React child");
      const result = ErrorProcessor.humanizeError(error);

      expect(result).toContain("React error");
      expect(result).toContain("JSON.stringify");
    });

    test("should handle hook errors", () => {
      const error = new Error("Invalid hook call");
      const result = ErrorProcessor.humanizeError(error);

      expect(result).toContain("React hook error");
      expect(result).toContain("top level");
    });

    test("should handle assignment to constant", () => {
      const error = new TypeError("Assignment to constant variable");
      const result = ErrorProcessor.humanizeError(error);

      expect(result).toContain("constant variable");
      expect(result).toContain("let or var");
    });

    test("should handle JSON syntax errors", () => {
      const error = new SyntaxError(
        "Unexpected token } in JSON at position 42"
      );
      const result = ErrorProcessor.humanizeError(error);

      expect(result).toContain("JSON syntax error");
      expect(result).toContain("position 42");
    });
  });

  describe("debug mode", () => {
    test("should log debug info when debug is enabled", () => {
      const consoleSpy = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});
      const error = new Error("map is not a function");

      ErrorProcessor.humanizeError(error, { debug: true });

      expect(consoleSpy).toHaveBeenCalledWith(
        "[ErrorProcessor] Processing error:",
        expect.any(Object)
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        "[ErrorProcessor] Pattern matched:",
        expect.any(String),
        "->",
        expect.any(String)
      );

      consoleSpy.mockRestore();
    });

    test("should not log when debug is disabled", () => {
      const consoleSpy = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});
      const error = new Error("map is not a function");

      ErrorProcessor.humanizeError(error, { debug: false });

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("location extraction", () => {
    test("should include file location from stack trace", () => {
      const error = new Error("Test error");
      error.stack = `Error: Test error
    at myFunction (app.js:42:15)
    at main (index.js:10:5)`;

      const result = ErrorProcessor.humanizeError(error, {
        includeLocation: true,
      });

      expect(result).toContain("app.js");
      expect(result).toContain("line 42");
    });

    test("should not include location when disabled", () => {
      const error = new Error("Test error");
      error.stack = `Error: Test error
    at myFunction (app.js:42:15)`;

      const result = ErrorProcessor.humanizeError(error, {
        includeLocation: false,
      });

      expect(result).not.toContain("app.js");
      expect(result).not.toContain("line");
    });
  });
});
