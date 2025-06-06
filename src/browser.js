class BrowserVoiceEngine {
  constructor(options = {}) {
    this.enabled = options.enabled ?? true;
    this.voice = options.voice || null;
    this.rate = options.rate || 1;
    this.pitch = options.pitch || 1;
    this.checkPermissions();
  }

  async checkPermissions() {
    if (!("speechSynthesis" in window)) {
      console.warn("Speech synthesis not supported");
      return false;
    }
    return true;
  }

  speak(message) {
    if (!this.enabled) return;

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = this.rate;
    utterance.pitch = this.pitch;

    if (this.voice) {
      utterance.voice = this.voice;
    }

    speechSynthesis.speak(utterance);
  }
}

export { BrowserVoiceEngine };
