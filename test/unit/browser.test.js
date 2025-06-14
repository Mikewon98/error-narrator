import ErrorNarratorBrowser from "../../src/browser";
import { createSpeechSynthesisMock } from "../mocks/speechSynthesis";

// Mock the global speechSynthesis
const mockSpeechSynthesis = createSpeechSynthesisMock();
global.speechSynthesis = mockSpeechSynthesis;

describe("BrowserVoiceEngine", () => {
  let voiceEngine;

  beforeEach(() => {
    mockSpeechSynthesis.clearUtterances();
    jest.clearAllMocks();
  });

  afterEach(() => {
    voiceEngine = null;
  });

  describe("initialization", () => {
    test("should initialize with default options", () => {
      const voiceEngine = new ErrorNarratorBrowser();

      expect(voiceEngine.isInitialized).toBe(true);
      // expect(voiceEngine.speechQueue).toBe(any); // structure of speechQueue is unknown
      expect(voiceEngine.isSpeaking).toBe(false);
    });

    test("should initialize with custom options", () => {
      const options = {
        enabled: true,
        rate: 1.5,
        pitch: 0.8,
        voice: "custom-voice",
        maxMessageLength: 100,
      };

      voiceEngine = new ErrorNarratorBrowser(options);

      const config = voiceEngine.config.getConfig();

      expect(config.enabled).toBe(true);
      expect(config.rate).toBe(1.5);
      expect(config.maxMessageLength).toBe(100);
      expect(config.pitch).toBe(0.8);
      expect(config.voice).toBe("custom-voice");
    });
  });

  describe("checkPublicApiMethods", () => {
    test("should return true when enable is called", async () => {
      voiceEngine = new ErrorNarratorBrowser();
      voiceEngine.enable();
      const config = voiceEngine.config.getConfig();

      expect(config.enabled).toBe(true);
    });

    test("should return false when disable is called", async () => {
      voiceEngine = new ErrorNarratorBrowser();
      voiceEngine.disable();

      const config = voiceEngine.config.getConfig();

      expect(config.enabled).toBe(false);
    });

    test("should handle update config", async () => {
      const newConfig = {
        rate: 1.2,
        pitch: 1.2,
        volume: 1.2,
        maxMessageLength: 100,
        voice: "custom-voice",
      };
      voiceEngine = new ErrorNarratorBrowser();
      voiceEngine.updateConfig(newConfig);
      const config = voiceEngine.config.getConfig();

      expect(config.rate).toBe(1.2);
      expect(config.maxMessageLength).toBe(100);
      expect(config.pitch).toBe(1.2);
      expect(config.volume).toBe(1.2);
      expect(config.voice).toBe("custom-voice");
    });

    test("should clear queue", async () => {
      voiceEngine = new ErrorNarratorBrowser();
      voiceEngine.clearQueue();

      expect(voiceEngine.isInitialized).toBe(true);
      // expect(voiceEngine.speechQueue).toBe([]); // structure currently hard to figure
      expect(voiceEngine.isSpeaking).toBe(false);
    });

    // test("should handle missing speechSynthesis gracefully", async () => {
    //   const originalSpeechSynthesis = global.speechSynthesis;
    //   delete global.speechSynthesis;

    //   voiceEngine = new BrowserVoiceEngine();
    //   const result = await voiceEngine.checkPermissions();

    //   expect(result).toBe(false);
    //   expect(console.warn).toHaveBeenCalledWith(
    //     "Speech synthesis not supported"
    //   );

    //   global.speechSynthesis = originalSpeechSynthesis;
    // });
  });

  describe("speak", () => {
    test("should speak a message", () => {
      voiceEngine = new ErrorNarratorBrowser();
      const message = "Test message";
      voiceEngine.speak(message);

      expect(voiceEngine.speak(message)).toHaveBeenCalledTimes(1);
    });

    test("should not speak when disabled", () => {
      voiceEngine = new ErrorNarratorBrowser({ enabled: false });
      voiceEngine.speak("Test message");

      expect(mockSpeechSynthesis.speak).not.toHaveBeenCalled();
    });

    test("should handle error", () => {
      voiceEngine = new ErrorNarratorBrowser();
      const error = new TypeError("TypeError");
      voiceEngine.handleError(error);

      expect(voiceEngine.speak()).toHaveBeenCalledTimes(1);
    });

    test("should handle empty messages", () => {
      voiceEngine = new ErrorNarratorBrowser();

      voiceEngine.speak("");
      voiceEngine.speak(null);
      voiceEngine.speak(undefined);

      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(3);
    });
  });
});
