import { ErrorProcessor } from "./errorProcessor";
import { BrowserVoiceEngine } from "./browser";
import { NodeVoiceEngine } from "./node";
import { Config } from "./config";

class ErrorNarrator {
  constructor(options = {}) {
    this.config = new Config(options);
    this.voiceEngine = this.detectEnvironment()
      ? new BrowserVoiceEngine(options)
      : new NodeVoiceEngine(options);

    this.setupGlobalErrorHandling();
  }

  detectEnvironment() {
    return typeof window !== "undefined" && typeof document !== "undefined";
  }

  setupGlobalErrorHandling() {
    if (typeof window !== "undefined") {
      // Browser environment
      window.addEventListener("error", (event) => {
        this.handleError(event.error);
      });

      window.addEventListener("unhandledrejection", (event) => {
        this.handleError(event.reason);
      });
    } else {
      // Node.js environment
      process.on("uncaughtException", (error) => {
        this.handleError(error);
      });

      process.on("unhandledRejection", (reason) => {
        this.handleError(reason);
      });
    }
  }

  handleError(error) {
    if (!this.config.shouldSpeak(error)) return;

    const humanMessage = ErrorProcessor.humanizeError(error);
    this.voiceEngine.speak(`Development error: ${humanMessage}`);
  }

  // Manual trigger for custom error handling
  speak(message) {
    this.voiceEngine.speak(message);
  }
}

export default ErrorNarrator;
