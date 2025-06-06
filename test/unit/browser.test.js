import { BrowserVoiceEngine } from "../../src/browser";
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
      voiceEngine = new BrowserVoiceEngine();

      expect(voiceEngine.enabled).toBe(true);
      expect(voiceEngine.rate).toBe(1);
      expect(voiceEngine.pitch).toBe(1);
      expect(voiceEngine.voice).toBeNull();
    });

    test("should initialize with custom options", () => {
      const options = {
        enabled: false,
        rate: 1.5,
        pitch: 0.8,
        voice: "custom-voice",
      };

      voiceEngine = new BrowserVoiceEngine(options);

      expect(voiceEngine.enabled).toBe(false);
      expect(voiceEngine.rate).toBe(1.5);
      expect(voiceEngine.pitch).toBe(0.8);
      expect(voiceEngine.voice).toBe("custom-voice");
    });
  });

  describe("checkPermissions", () => {
    test("should return true when speechSynthesis is available", async () => {
      voiceEngine = new BrowserVoiceEngine();
      const result = await voiceEngine.checkPermissions();

      expect(result).toBe(true);
    });

    test("should handle missing speechSynthesis gracefully", async () => {
      const originalSpeechSynthesis = global.speechSynthesis;
      delete global.speechSynthesis;

      voiceEngine = new BrowserVoiceEngine();
      const result = await voiceEngine.checkPermissions();

      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalledWith(
        "Speech synthesis not supported"
      );

      global.speechSynthesis = originalSpeechSynthesis;
    });
  });

  describe("speak", () => {
    beforeEach(() => {
      voiceEngine = new BrowserVoiceEngine();
    });

    test("should speak a message", () => {
      const message = "Test message";
      voiceEngine.speak(message);

      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(1);

      const utterance = mockSpeechSynthesis.getLastUtterance();
      expect(utterance.text).toBe(message);
      expect(utterance.rate).toBe(1);
      expect(utterance.pitch).toBe(1);
    });

    test("should not speak when disabled", () => {
      voiceEngine = new BrowserVoiceEngine({ enabled: false });
      voiceEngine.speak("Test message");

      expect(mockSpeechSynthesis.speak).not.toHaveBeenCalled();
    });

    test("should apply custom rate and pitch", () => {
      voiceEngine = new BrowserVoiceEngine({ rate: 1.5, pitch: 0.8 });
      voiceEngine.speak("Test message");

      const utterance = mockSpeechSynthesis.getLastUtterance();
      expect(utterance.rate).toBe(1.5);
      expect(utterance.pitch).toBe(0.8);
    });

    test("should apply custom voice when specified", () => {
      const customVoice = { name: "Custom Voice" };
      voiceEngine = new BrowserVoiceEngine({ voice: customVoice });
      voiceEngine.speak("Test message");

      const utterance = mockSpeechSynthesis.getLastUtterance();
      expect(utterance.voice).toBe(customVoice);
    });

    test("should handle multiple messages", () => {
      voiceEngine.speak("Message 1");
      voiceEngine.speak("Message 2");
      voiceEngine.speak("Message 3");

      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(3);

      const utterances = mockSpeechSynthesis.getAllUtterances();
      expect(utterances).toHaveLength(3);
      expect(utterances[0].text).toBe("Message 1");
      expect(utterances[1].text).toBe("Message 2");
      expect(utterances[2].text).toBe("Message 3");
    });

    test("should handle empty messages", () => {
      voiceEngine.speak("");
      voiceEngine.speak(null);
      voiceEngine.speak(undefined);

      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(3);
    });
  });
});
