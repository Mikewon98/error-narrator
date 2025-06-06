class ErrorNarratorBrowser {
  constructor(options = {}) {
    this.enabled = options.enabled ?? true;
    this.rate = options.rate ?? 1.0;
    this.cooldownMs = options.cooldownMs ?? 2000;
    this.lastSpoken = 0;
    console.log("ErrorNarratorBrowser initialized with options:", options);
  }

  speak(message) {
    console.log("Attempting to speak:", message);
    if (!this.enabled || !window.speechSynthesis) {
      console.warn("Speech synthesis not available or disabled");
      return;
    }

    const now = Date.now();
    if (now - this.lastSpoken < this.cooldownMs) {
      console.log("Skipping due to cooldown");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = this.rate;
    console.log("Speaking with rate:", this.rate);
    window.speechSynthesis.speak(utterance);
    this.lastSpoken = now;
  }
}

export default ErrorNarratorBrowser;
