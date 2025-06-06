const say = require("say");

class NodeVoiceEngine {
  constructor(options = {}) {
    this.enabled = options.enabled ?? true;
    this.voice = options.voice || null;
    this.speed = options.speed || 1;
  }

  speak(message) {
    if (!this.enabled) return;

    say.speak(message, this.voice, this.speed);
  }
}

export { NodeVoiceEngine };
