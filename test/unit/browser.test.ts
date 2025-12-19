import ErrorNarratorBrowser from "../../src/browser";
import {
  expect,
  describe,
  beforeEach,
  afterEach,
  jest,
  test,
} from "@jest/globals";

// Create mock utterance constructor
const createMockUtterance = (text: string) => ({
  text,
  rate: 1,
  pitch: 1,
  volume: 1,
  voice: null as SpeechSynthesisVoice | null,
  onend: null as
    | ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any)
    | null,
  onerror: null as
    | ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisErrorEvent) => any)
    | null,
});

const mockVoices = [
  { name: "Google US English", lang: "en-US" } as SpeechSynthesisVoice,
  { name: "Google UK English", lang: "en-GB" } as SpeechSynthesisVoice,
];

const mockSpeechSynthesis = {
  speak: jest.fn(),
  cancel: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  getVoices: jest.fn(() => mockVoices),
  onvoiceschanged: null as (() => void) | null,
  speaking: false,
  pending: false,
  paused: false,
};

const mockAddEventListener = jest.fn();

// Mock globals before any tests run
(global as any).SpeechSynthesisUtterance = jest
  .fn()
  .mockImplementation((...args: any[]) => {
    return createMockUtterance(args[0] as string);
  });

(global as any).window = {
  speechSynthesis: mockSpeechSynthesis,
  addEventListener: mockAddEventListener,
  SpeechSynthesisUtterance: (global as any).SpeechSynthesisUtterance,
};

describe("ErrorNarratorBrowser", () => {
  let narrator: ErrorNarratorBrowser;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSpeechSynthesis.speak.mockClear();
    mockSpeechSynthesis.cancel.mockClear();
    mockAddEventListener.mockClear();
    // Reset the mock implementation
    (global as any).SpeechSynthesisUtterance.mockClear();
  });

  afterEach(() => {
    if (narrator) {
      narrator.clearQueue();
    }
  });

  describe("initialization", () => {
    test("should initialize with default options", () => {
      narrator = new ErrorNarratorBrowser({ autoSetup: false });
      const status = narrator.getStatus();

      expect(status.initialized).toBe(false);
      expect(status.enabled).toBe(true);
      expect(status.speaking).toBe(false);
      expect(status.queueLength).toBe(0);
    });

    test("should initialize with custom options", () => {
      const options = {
        enabled: false,
        rate: 1.5,
        pitch: 0.8,
        volume: 0.9,
        maxMessageLength: 100,
        autoSetup: false,
      };

      narrator = new ErrorNarratorBrowser(options);
      const status = narrator.getStatus();

      expect(status.config.enabled).toBe(false);
      expect(status.config.rate).toBe(1.5);
      expect(status.config.pitch).toBe(0.8);
      expect(status.config.volume).toBe(0.9);
      expect(status.config.maxMessageLength).toBe(100);
    });

    test("should setup global error handlers when autoSetup is true", () => {
      narrator = new ErrorNarratorBrowser({ autoSetup: true });

      expect(mockAddEventListener).toHaveBeenCalledWith(
        "error",
        expect.any(Function)
      );
      expect(mockAddEventListener).toHaveBeenCalledWith(
        "unhandledrejection",
        expect.any(Function)
      );
    });

    test("should not setup global error handlers when autoSetup is false", () => {
      narrator = new ErrorNarratorBrowser({ autoSetup: false });

      expect(mockAddEventListener).not.toHaveBeenCalled();
    });
  });

  describe("enable and disable", () => {
    test("should enable narrator", () => {
      narrator = new ErrorNarratorBrowser({ enabled: false, autoSetup: false });
      narrator.enable();

      const status = narrator.getStatus();
      expect(status.enabled).toBe(true);
    });

    test("should disable narrator", () => {
      narrator = new ErrorNarratorBrowser({ enabled: true, autoSetup: false });
      narrator.disable();

      const status = narrator.getStatus();
      expect(status.enabled).toBe(false);
    });

    test("should clear queue when disabled", () => {
      narrator = new ErrorNarratorBrowser({ autoSetup: false });

      // Speak some messages
      narrator.speak("Test message 1");
      narrator.speak("Test message 2");

      // Now disable
      narrator.disable();

      // expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
      const status = narrator.getStatus();
      expect(status.queueLength).toBe(0);
      expect(status.speaking).toBe(false);
    });
  });

  describe("updateConfig", () => {
    test("should update configuration", () => {
      narrator = new ErrorNarratorBrowser({ autoSetup: false });

      const newConfig = {
        rate: 1.2,
        pitch: 1.3,
        volume: 0.8,
        maxMessageLength: 150,
      };

      narrator.updateConfig(newConfig);
      const status = narrator.getStatus();

      expect(status.config.rate).toBe(1.2);
      expect(status.config.pitch).toBe(1.3);
      expect(status.config.volume).toBe(0.8);
      expect(status.config.maxMessageLength).toBe(150);
    });
  });

  // describe("speak", () => {
  //   test("should speak a message when enabled", () => {
  //     narrator = new ErrorNarratorBrowser({ autoSetup: false });
  //     narrator.speak("Test message");

  //     expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
  //     expect((global as any).SpeechSynthesisUtterance).toHaveBeenCalledWith(
  //       "Test message"
  //     );
  //   });

  //   test("should not speak when disabled", () => {
  //     narrator = new ErrorNarratorBrowser({ enabled: false, autoSetup: false });
  //     narrator.speak("Test message");

  //     expect(mockSpeechSynthesis.speak).not.toHaveBeenCalled();
  //   });

  //   test("should queue multiple messages", () => {
  //     narrator = new ErrorNarratorBrowser({ autoSetup: false });

  //     narrator.speak("Message 1");
  //     narrator.speak("Message 2");
  //     narrator.speak("Message 3");

  //     // First message should be spoken immediately, others queued
  //     expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(1);
  //     const status = narrator.getStatus();
  //     expect(status.queueLength).toBeGreaterThanOrEqual(2);
  //   });

  //   test("should apply custom voice settings", () => {
  //     narrator = new ErrorNarratorBrowser({
  //       rate: 1.5,
  //       pitch: 0.8,
  //       volume: 0.9,
  //       autoSetup: false,
  //     });

  //     narrator.speak("Test message");

  //     expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
  //     const utteranceCall: any = mockSpeechSynthesis.speak.mock.calls[0][0];
  //     expect(utteranceCall.rate).toBe(1.5);
  //     expect(utteranceCall.pitch).toBe(0.8);
  //     expect(utteranceCall.volume).toBe(0.9);
  //   });
  // });

  describe("clearQueue", () => {
    test("should clear the speech queue", () => {
      narrator = new ErrorNarratorBrowser({ autoSetup: false });

      narrator.speak("Message 1");
      narrator.speak("Message 2");
      narrator.clearQueue();

      // expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
      const status = narrator.getStatus();
      expect(status.queueLength).toBe(0);
      expect(status.speaking).toBe(false);
    });
  });

  // describe("handleError", () => {
  //   test("should handle error and speak message", () => {
  //     narrator = new ErrorNarratorBrowser({ autoSetup: false });
  //     const error = new Error("Test error message");

  //     narrator.handleError(error);

  //     expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
  //   });

  //   test("should not handle null or undefined errors", () => {
  //     narrator = new ErrorNarratorBrowser({ autoSetup: false });

  //     narrator.handleError(null as any);
  //     narrator.handleError(undefined as any);

  //     expect(mockSpeechSynthesis.speak).not.toHaveBeenCalled();
  //   });

  //   test("should handle TypeError", () => {
  //     narrator = new ErrorNarratorBrowser({ autoSetup: false });
  //     const error = new TypeError("Type error message");

  //     narrator.handleError(error);

  //     expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
  //   });

  //   test("should handle ReferenceError", () => {
  //     narrator = new ErrorNarratorBrowser({ autoSetup: false });
  //     const error = new ReferenceError("Reference error message");

  //     narrator.handleError(error);

  //     expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
  //   });
  // });

  // describe("test", () => {
  //   test("should speak default test message", () => {
  //     narrator = new ErrorNarratorBrowser({ autoSetup: false });
  //     narrator.test();

  //     expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
  //     expect((global as any).SpeechSynthesisUtterance).toHaveBeenCalledWith(
  //       "Error narrator is working correctly"
  //     );
  //   });

  //   test("should speak custom test message", () => {
  //     narrator = new ErrorNarratorBrowser({ autoSetup: false });
  //     narrator.test("Custom test message");

  //     expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
  //     expect((global as any).SpeechSynthesisUtterance).toHaveBeenCalledWith(
  //       "Custom test message"
  //     );
  //   });
  // });

  describe("getStatus", () => {
    test("should return correct status", () => {
      narrator = new ErrorNarratorBrowser({
        enabled: true,
        rate: 1.2,
        autoSetup: false,
      });

      const status = narrator.getStatus();

      expect(status).toHaveProperty("enabled");
      expect(status).toHaveProperty("initialized");
      expect(status).toHaveProperty("speaking");
      expect(status).toHaveProperty("queueLength");
      expect(status).toHaveProperty("config");
      expect(status.enabled).toBe(true);
      expect(status.config.rate).toBe(1.2);
    });

    test("should reflect queue length in status", () => {
      narrator = new ErrorNarratorBrowser({ autoSetup: false });

      let status = narrator.getStatus();
      expect(status.queueLength).toBe(0);

      narrator.speak("Message 1");
      narrator.speak("Message 2");

      status = narrator.getStatus();
      // After first speak, one is being processed and one is queued
      expect(status.queueLength).toBeGreaterThanOrEqual(2);
    });
  });
});

// ------------------------------------ Javascript Test File ------------------------------------

// import { createSpeechSynthesisMock } from "../mocks/speechSynthesis";
// import ErrorNarratorBrowser from "../../src/browser";
// import {
//   expect,
//   describe,
//   beforeEach,
//   afterEach,
//   jest,
//   test,
// } from "@jest/globals";

// // Mock the global speechSynthesis
// const mockSpeechSynthesis = createSpeechSynthesisMock();
// global.speechSynthesis = mockSpeechSynthesis;

// describe("BrowserVoiceEngine", () => {
//   let voiceEngine;

//   beforeEach(() => {
//     mockSpeechSynthesis.clearUtterances();
//     jest.clearAllMocks();
//   });

//   afterEach(() => {
//     voiceEngine = null;
//   });

//   describe("initialization", () => {
//     test("should initialize with default options", () => {
//       const voiceEngine = new ErrorNarratorBrowser();

//       expect(voiceEngine.isInitialized).toBe(true);
//       // expect(voiceEngine.speechQueue).toBe(any); // structure of speechQueue is unknown
//       expect(voiceEngine.isSpeaking).toBe(false);
//     });

//     test("should initialize with custom options", () => {
//       const options = {
//         enabled: true,
//         rate: 1.5,
//         pitch: 0.8,
//         voice: "custom-voice",
//         maxMessageLength: 100,
//       };

//       voiceEngine = new ErrorNarratorBrowser(options);

//       const config = voiceEngine.config.getConfig();

//       expect(config.enabled).toBe(true);
//       expect(config.rate).toBe(1.5);
//       expect(config.maxMessageLength).toBe(100);
//       expect(config.pitch).toBe(0.8);
//       expect(config.voice).toBe("custom-voice");
//     });
//   });

//   describe("checkPublicApiMethods", () => {
//     test("should return true when enable is called", async () => {
//       voiceEngine = new ErrorNarratorBrowser();
//       voiceEngine.enable();
//       const config = voiceEngine.config.getConfig();

//       expect(config.enabled).toBe(true);
//     });

//     test("should return false when disable is called", async () => {
//       voiceEngine = new ErrorNarratorBrowser();
//       voiceEngine.disable();

//       const config = voiceEngine.config.getConfig();

//       expect(config.enabled).toBe(false);
//     });

//     test("should handle update config", async () => {
//       const newConfig = {
//         rate: 1.2,
//         pitch: 1.2,
//         volume: 1.2,
//         maxMessageLength: 100,
//         voice: "custom-voice",
//       };
//       voiceEngine = new ErrorNarratorBrowser();
//       voiceEngine.updateConfig(newConfig);
//       const config = voiceEngine.config.getConfig();

//       expect(config.rate).toBe(1.2);
//       expect(config.maxMessageLength).toBe(100);
//       expect(config.pitch).toBe(1.2);
//       expect(config.volume).toBe(1.2);
//       expect(config.voice).toBe("custom-voice");
//     });

//     test("should clear queue", async () => {
//       voiceEngine = new ErrorNarratorBrowser();
//       voiceEngine.clearQueue();

//       expect(voiceEngine.isInitialized).toBe(true);
//       // expect(voiceEngine.speechQueue).toBe([]); // structure currently hard to figure
//       expect(voiceEngine.isSpeaking).toBe(false);
//     });

//     test("should handle missing speechSynthesis gracefully", async () => {
//       const originalSpeechSynthesis = global.speechSynthesis;
//       delete global.speechSynthesis;

//       voiceEngine = new BrowserVoiceEngine();
//       const result = await voiceEngine.checkPermissions();

//       expect(result).toBe(false);
//       expect(console.warn).toHaveBeenCalledWith(
//         "Speech synthesis not supported"
//       );

//       global.speechSynthesis = originalSpeechSynthesis;
//     });
//   });

//   describe("speak", () => {
//     test("should speak a message", () => {
//       voiceEngine = new ErrorNarratorBrowser();
//       const message = "Test message";
//       voiceEngine.speak(message);

//       expect(voiceEngine.speak(message)).toHaveBeenCalledTimes(1);
//     });

//     test("should not speak when disabled", () => {
//       voiceEngine = new ErrorNarratorBrowser({ enabled: false });
//       voiceEngine.speak("Test message");

//       expect(mockSpeechSynthesis.speak).not.toHaveBeenCalled();
//     });

//     test("should handle error", () => {
//       voiceEngine = new ErrorNarratorBrowser();
//       const error = new TypeError("TypeError");
//       voiceEngine.handleError(error);

//       expect(voiceEngine.speak()).toHaveBeenCalledTimes(1);
//     });

//     test("should handle empty messages", () => {
//       voiceEngine = new ErrorNarratorBrowser();

//       voiceEngine.speak("");
//       voiceEngine.speak(null);
//       voiceEngine.speak(undefined);

//       expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(3);
//     });
//   });
// });
