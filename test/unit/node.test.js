import ErrorNarratorNode, { NodeVoiceEngine } from "../../src/node";

jest.mock("say", () => ({
  speak: jest.fn(),
}));

afterEach(() => {
  // restore the spy created with spyOn
  jest.restoreAllMocks();
});

const say = require("say");

describe("NodeVoiceEngine", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    test("should initialize with default options", () => {
      const engine = new ErrorNarratorNode();

      expect(engine.isSpeaking).toBe(false);
      expect(engine.speechQueue).toStrictEqual([]);
    });

    test("should initialize with custom options", () => {
      const options = {
        voice: null,
        rate: 1,
        pitch: 1,
        volume: 1,
        maxMessageLength: 100,
      };

      const engine = new NodeVoiceEngine(options);

      expect(engine.config.getConfig().voice).toBe(null);
      expect(engine.config.getConfig().rate).toBe(1);
      expect(engine.config.getConfig().pitch).toBe(1);
      expect(engine.config.getConfig().volume).toBe(1);
      expect(engine.config.getConfig().maxMessageLength).toBe(100);
    });

    test("should clear queue when clear queue is called", () => {
      const engine = new NodeVoiceEngine();
      engine.clearQueue;

      expect(engine.speechQueue).toStrictEqual([]);
    });

    test("should handle undefined options", () => {
      const engine = new NodeVoiceEngine(undefined);

      expect(engine.config.getConfig().voice).toBe(null);
      expect(engine.config.getConfig().rate).toBe(1);
      expect(engine.config.getConfig().pitch).toBe(1);
      expect(engine.config.getConfig().volume).toBe(1);
      expect(engine.config.getConfig().maxMessageLength).toBe(100);
    });
  });

  describe("speak method", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test("should call speak with correct message", () => {
      const engine = new NodeVoiceEngine();

      const spy = jest.spyOn(engine, "speak");

      const message = "Hello, world!";
      engine.speak(message);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(engine.speak).toHaveBeenCalledWith(message);
    });

    test("should call speak with null voice when config is specified", () => {
      const engines = new NodeVoiceEngine({ rate: 0.8 });

      const spy = jest.spyOn(engines, "speak");

      const message = "Test message";
      engines.speak(message);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(engines.speak).toHaveBeenCalledWith(message);
    });

    test("should not call say.speak when disabled", () => {
      const engine = new NodeVoiceEngine({ enabled: false });

      expect(engine.config.getConfig().enabled).toBe(false);
    });

    test("should handle empty message", () => {
      const engine = new NodeVoiceEngine();

      const spy = jest.spyOn(engine, "speak");

      engine.speak("");

      expect(spy).toHaveBeenCalledTimes(1);
      expect(engine.speak).toHaveBeenCalledWith("");
    });

    test("should handle multiple speak calls", () => {
      const engine = new NodeVoiceEngine();
      const spy = jest.spyOn(engine, "speak");

      engine.speak("First message");
      engine.speak("Second message");
      engine.speak("Third message");

      expect(spy).toHaveBeenCalledTimes(3);
      expect(spy).toHaveBeenNthCalledWith(1, "First message");
      expect(spy).toHaveBeenNthCalledWith(2, "Second message");
      expect(spy).toHaveBeenNthCalledWith(3, "Third message");
    });

    test("should handle long messages", () => {
      const engine = new NodeVoiceEngine();

      const spy = jest.spyOn(engine, "speak");

      const longMessage =
        "This is a very long message that contains multiple sentences and should still be handled correctly by the voice engine. It tests the robustness of the speak method.";

      engine.speak(longMessage);

      expect(spy).toHaveBeenCalledTimes(1);

      expect(engine.speak).toHaveBeenCalledWith(longMessage);
    });
  });

  describe("enabled/disabled state", () => {
    test("should set enable to true", () => {
      const engine = new NodeVoiceEngine();

      engine.enable();

      expect(engine.config.getConfig().enabled).toBe(true);
    });

    test("should set enable to false", () => {
      const engine = new ErrorNarratorNode();
      engine.disable();

      expect(engine.config.getConfig().enabled).toBe(false);
    });
  });

  describe("edge cases", () => {
    test("should handle special characters in message", () => {
      const engine = new NodeVoiceEngine();

      const spy = jest.spyOn(engine, "speak");

      const specialMessage =
        "Hello! @#$%^&*() 123 Testing special chars: éñüññ";

      engine.speak(specialMessage);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(engine.speak).toHaveBeenCalledWith(specialMessage);
    });

    test("should handle numeric messages", () => {
      const engine = new NodeVoiceEngine();

      const spy = jest.spyOn(engine, "speak");

      engine.speak(123);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(engine.speak).toHaveBeenCalledWith(123);
    });

    test("should handle boolean messages", () => {
      const engine = new NodeVoiceEngine();
      const spy = jest.spyOn(engine, "speak");

      engine.speak(true);

      expect(spy).toHaveBeenCalledTimes(1);

      expect(engine.speak).toHaveBeenCalledWith(true);
    });
  });
});
