// Enhanced Speech Synthesis mock
export const createSpeechSynthesisMock = () => {
  const mockUtterances = [];

  return {
    speak: jest.fn((utterance) => {
      mockUtterances.push(utterance);
      // Simulate speaking event
      setTimeout(() => {
        if (utterance.onstart) utterance.onstart();
        setTimeout(() => {
          if (utterance.onend) utterance.onend();
        }, 100);
      }, 50);
    }),

    cancel: jest.fn(() => {
      mockUtterances.length = 0;
    }),

    pause: jest.fn(),
    resume: jest.fn(),

    getVoices: jest.fn(() => [
      { name: "Test Voice 1", lang: "en-US" },
      { name: "Test Voice 2", lang: "en-GB" },
    ]),

    speaking: false,
    pending: false,
    paused: false,

    // Test utilities
    getLastUtterance: () => mockUtterances[mockUtterances.length - 1],
    getAllUtterances: () => [...mockUtterances],
    clearUtterances: () => (mockUtterances.length = 0),
  };
};
