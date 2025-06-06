import { NodeVoiceEngine } from "../../src/node";

jest.mock("say", () => ({
  speak: jest.fn(),
}));

const say = require("say");

describe("NodeVoiceEngine", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    test("should initialize with default options", () => {
      const engine = new NodeVoiceEngine();

      expect(engine.enabled).toBe(true);
      expect(engine.voice).toBe(null);
      expect(engine.speed).toBe(1);
    });

    test("should initialize with custom options", () => {
      const options = {
        enabled: false,
        voice: "Alex",
        speed: 1.5,
      };

      const engine = new NodeVoiceEngine(options);

      expect(engine.enabled).toBe(false);
      expect(engine.voice).toBe("Alex");
      expect(engine.speed).toBe(1.5);
    });

    test("should use default enabled value when explicitly set to null", () => {
      const options = {
        enabled: null,
        voice: "Samantha",
        speed: 0.8,
      };

      const engine = new NodeVoiceEngine(options);

      expect(engine.enabled).toBe(true);
      expect(engine.voice).toBe("Samantha");
      expect(engine.speed).toBe(0.8);
    });

    test("should handle undefined options", () => {
      const engine = new NodeVoiceEngine(undefined);

      expect(engine.enabled).toBe(true);
      expect(engine.voice).toBe(null);
      expect(engine.speed).toBe(1);
    });

    test("should handle partial options", () => {
      const engine = new NodeVoiceEngine({ voice: "Daniel" });

      expect(engine.enabled).toBe(true);
      expect(engine.voice).toBe("Daniel");
      expect(engine.speed).toBe(1);
    });
  });

  describe("speak method", () => {
    test("should call say.speak with correct parameters when enabled", () => {
      const engine = new NodeVoiceEngine({
        enabled: true,
        voice: "Alex",
        speed: 1.2,
      });

      const message = "Hello, world!";
      engine.speak(message);

      expect(say.speak).toHaveBeenCalledTimes(1);
      expect(say.speak).toHaveBeenCalledWith(message, "Alex", 1.2);
    });

    test("should call say.speak with null voice when no voice specified", () => {
      const engine = new NodeVoiceEngine({ speed: 0.8 });

      const message = "Test message";
      engine.speak(message);

      expect(say.speak).toHaveBeenCalledTimes(1);
      expect(say.speak).toHaveBeenCalledWith(message, null, 0.8);
    });

    test("should not call say.speak when disabled", () => {
      const engine = new NodeVoiceEngine({ enabled: false });

      const message = "This should not be spoken";
      engine.speak(message);

      expect(say.speak).not.toHaveBeenCalled();
    });

    test("should handle empty message", () => {
      const engine = new NodeVoiceEngine();

      engine.speak("");

      expect(say.speak).toHaveBeenCalledTimes(1);
      expect(say.speak).toHaveBeenCalledWith("", null, 1);
    });

    test("should handle multiple speak calls", () => {
      const engine = new NodeVoiceEngine({ voice: "Victoria", speed: 1.1 });

      engine.speak("First message");
      engine.speak("Second message");
      engine.speak("Third message");

      expect(say.speak).toHaveBeenCalledTimes(3);
      expect(say.speak).toHaveBeenNthCalledWith(
        1,
        "First message",
        "Victoria",
        1.1
      );
      expect(say.speak).toHaveBeenNthCalledWith(
        2,
        "Second message",
        "Victoria",
        1.1
      );
      expect(say.speak).toHaveBeenNthCalledWith(
        3,
        "Third message",
        "Victoria",
        1.1
      );
    });

    test("should handle long messages", () => {
      const engine = new NodeVoiceEngine();
      const longMessage =
        "This is a very long message that contains multiple sentences and should still be handled correctly by the voice engine. It tests the robustness of the speak method.";

      engine.speak(longMessage);

      expect(say.speak).toHaveBeenCalledTimes(1);
      expect(say.speak).toHaveBeenCalledWith(longMessage, null, 1);
    });
  });

  describe("enabled/disabled state", () => {
    test("should respect enabled state changes during runtime", () => {
      const engine = new NodeVoiceEngine({ enabled: true });

      // Initially enabled - should speak
      engine.speak("First message");
      expect(say.speak).toHaveBeenCalledTimes(1);

      // Disable and try to speak
      engine.enabled = false;
      engine.speak("Second message");
      expect(say.speak).toHaveBeenCalledTimes(1); // Still 1, not called again

      // Re-enable and speak
      engine.enabled = true;
      engine.speak("Third message");
      expect(say.speak).toHaveBeenCalledTimes(2); // Now called again
    });

    test("should handle falsy enabled values correctly", () => {
      const testCases = [
        { enabled: false, shouldSpeak: false },
        { enabled: 0, shouldSpeak: false },
        { enabled: "", shouldSpeak: false },
        { enabled: null, shouldSpeak: true },
        { enabled: true, shouldSpeak: true },
        { enabled: undefined, shouldSpeak: true }, // ?? operator makes this true
      ];

      testCases.forEach(({ enabled, shouldSpeak }, index) => {
        jest.clearAllMocks();
        const engine = new NodeVoiceEngine({ enabled });

        engine.speak(`Test message ${index}`);

        if (shouldSpeak) {
          expect(say.speak).toHaveBeenCalledTimes(1);
        } else {
          expect(say.speak).not.toHaveBeenCalled();
        }
      });
    });
  });

  describe("edge cases", () => {
    test("should handle special characters in message", () => {
      const engine = new NodeVoiceEngine();
      const specialMessage =
        "Hello! @#$%^&*() 123 Testing special chars: éñüññ";

      engine.speak(specialMessage);

      expect(say.speak).toHaveBeenCalledWith(specialMessage, null, 1);
    });

    test("should handle numeric messages", () => {
      const engine = new NodeVoiceEngine();

      engine.speak(123);

      expect(say.speak).toHaveBeenCalledWith(123, null, 1);
    });

    test("should handle boolean messages", () => {
      const engine = new NodeVoiceEngine();

      engine.speak(true);

      expect(say.speak).toHaveBeenCalledWith(true, null, 1);
    });
  });
});
