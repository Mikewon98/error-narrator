// Mock for the 'say' npm package
const mockSay = {
  speak: jest.fn((text, voice, speed, callback) => {
    // Simulate async behavior
    if (callback) {
      setTimeout(callback, 100);
    }
  }),

  stop: jest.fn(),

  getInstalledVoices: jest.fn(() =>
    Promise.resolve(["Alex", "Samantha", "Victoria"])
  ),
};

module.exports = mockSay;
