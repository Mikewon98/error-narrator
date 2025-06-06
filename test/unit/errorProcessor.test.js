import { ErrorProcessor } from "../../src/errorProcessor";

describe("ErrorProcessor", () => {
  describe("humanizeError", () => {
    test('should humanize "is not a function" error', () => {
      const error = new Error("map is not a function");
      const result = ErrorProcessor.humanizeError(error);

      expect(result).toContain("is not a function");
      expect(result).toContain("Check if it's properly defined");
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
      expect(result).toContain("variable is not defined");
    });

    test("should handle TypeError", () => {
      const error = new TypeError("Cannot read property of null");
      const result = ErrorProcessor.humanizeError(error);

      expect(result).toContain("Type error detected");
    });

    test("should handle syntax errors", () => {
      const error = new SyntaxError("Unexpected token }");
      const result = ErrorProcessor.humanizeError(error);

      expect(result).toContain("Syntax error");
      expect(result).toContain("brackets or commas");
    });

    test("should clean up and truncate long messages", () => {
      const longMessage = "A".repeat(200);
      const error = new Error(longMessage);
      const result = ErrorProcessor.humanizeError(error);

      expect(result.length).toBeLessThanOrEqual(100);
    });

    test("should handle errors without messages", () => {
      const error = {};
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
});
