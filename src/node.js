import { Config } from "./config.js";
import { ErrorProcessor } from "./errorProcessor.js";

let say;
try {
  say = require("say");
} catch (error) {
  console.warn(
    "[ErrorNarratorNode] Say package not found. Install with: npm install say"
  );
}

class ErrorNarratorNode {
  constructor(options = {}) {
    this.config = new Config(options);
    this.speechQueue = [];
    this.isSpeaking = false;

    if (this.config.getConfig().debug) {
      console.log("[ErrorNarratorNode] Initialized with options:", options);
    }

    // Auto-setup global error handlers if enabled
    if (options.autoSetup !== false) {
      this.setupGlobalHandlers();
    }
  }

  setupGlobalHandlers() {
    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      this.handleError(error);
      // Don't exit the process immediately, let the error be handled
      setTimeout(() => {
        if (this.config.getConfig().exitOnUncaught !== false) {
          process.exit(1);
        }
      }, 2000);
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason, promise) => {
      const error =
        reason instanceof Error ? reason : new Error(String(reason));
      this.handleError(error);
    });

    // Handle warning events
    process.on("warning", (warning) => {
      if (this.config.getConfig().speakWarnings) {
        this.handleError(warning);
      }
    });

    if (this.config.getConfig().debug) {
      console.log("[ErrorNarratorNode] Global error handlers setup");
    }
  }

  handleError(error) {
    if (!error) return;

    const configData = this.config.getConfig();

    if (configData.debug) {
      console.log("[ErrorNarratorBrowser] Handling error:", error);
    }

    if (ErrorProcessor.shouldIgnoreError(error, configData)) {
      if (configData.debug) {
        console.log(
          "[ErrorNarratorBrowser] Ignoring error based on processor rules"
        );
      }
      return;
    }

    // Process the error message first to get the final text
    let message;
    if (configData.humanize) {
      try {
        message = ErrorProcessor.humanizeError(error, configData);
      } catch (processingError) {
        console.warn(
          "[ErrorNarratorBrowser] Error processing failed:",
          processingError
        );
        message = configData.fallbackToRaw
          ? error.message || error.toString()
          : null;
      }
    } else {
      message = error.message || error.toString();
    }

    if (!message) {
      return;
    }

    // *** NEW: Check if the exact same message is already in the queue ***
    if (this.speechQueue.includes(message)) {
      if (configData.debug) {
        console.log(
          "[ErrorNarratorBrowser] Ignoring duplicate message in queue:",
          message
        );
      }
      return;
    }

    // Now, check the cooldown from the config
    if (!this.config.shouldSpeak(error)) {
      if (configData.debug) {
        console.log(
          "[ErrorNarratorBrowser] Not speaking due to config rules (cooldown)"
        );
      }
      return;
    }

    // If all checks pass, then speak.
    this.speak(message);
  }

  speak(message) {
    const configData = this.config.getConfig();

    if (configData.debug) {
      console.log("[ErrorNarratorNode] Attempting to speak:", message);
    }

    if (!configData.enabled) {
      if (configData.debug) {
        console.log("[ErrorNarratorNode] Speech disabled");
      }
      return;
    }

    if (!say) {
      console.warn(
        "[ErrorNarratorNode] Say package not available. Install with: npm install say"
      );
      return;
    }

    // Add to queue
    this.speechQueue.push(message);
    this.processSpeechQueue();
  }

  processSpeechQueue() {
    if (this.isSpeaking || this.speechQueue.length === 0) {
      return;
    }

    const message = this.speechQueue.shift();
    const configData = this.config.getConfig();

    this.isSpeaking = true;

    try {
      const options = {
        voice: configData.voice || null,
        speed: configData.rate || 1.0,
      };

      if (configData.debug) {
        console.log("[ErrorNarratorNode] Speaking with options:", options);
      }

      say.speak(message, options.voice, options.speed, (error) => {
        this.isSpeaking = false;

        if (error) {
          console.warn("[ErrorNarratorNode] Speech error:", error);
        } else if (configData.debug) {
          console.log("[ErrorNarratorNode] Speech completed");
        }

        // Process next item in queue
        setTimeout(() => this.processSpeechQueue(), 100);
      });
    } catch (speechError) {
      this.isSpeaking = false;
      console.error("[ErrorNarratorNode] Speech synthesis error:", speechError);
      // Process next item in queue
      setTimeout(() => this.processSpeechQueue(), 100);
    }
  }

  // Public API methods
  updateConfig(newConfig) {
    this.config.updateConfig(newConfig);
  }

  enable() {
    this.config.updateConfig({ enabled: true });
  }

  disable() {
    this.config.updateConfig({ enabled: false });
    this.clearQueue();
  }

  clearQueue() {
    this.speechQueue = [];
    // if (say) {
    //   say.stop();
    // }
    this.isSpeaking = false;
  }

  // Test method
  test(message = "Error narrator is working correctly") {
    this.speak(message);
  }

  // Get available voices (Node.js specific)
  getVoices() {
    if (!say) return [];

    // This is platform-specific
    const platform = process.platform;
    if (platform === "darwin") {
      // macOS voices
      return [
        "Alex",
        "Alice",
        "Alva",
        "Amelie",
        "Anna",
        "Carmit",
        "Damien",
        "Daniel",
        "Diego",
        "Ellen",
        "Fiona",
        "Fred",
        "Ioana",
        "Joana",
        "Jorge",
        "Juan",
        "Kanya",
        "Karen",
        "Kyoko",
        "Laura",
        "Lekha",
        "Luca",
        "Luciana",
        "Maged",
        "Mariska",
        "Mei-Jia",
        "Melina",
        "Milena",
        "Moira",
        "Monica",
        "Nora",
        "Paulina",
        "Samantha",
        "Sara",
        "Satu",
        "Sin-ji",
        "Tessa",
        "Thomas",
        "Ting-Ting",
        "Veena",
        "Victoria",
        "Xander",
        "Yelda",
        "Yuna",
        "Yuri",
        "Zosia",
        "Zuzana",
      ];
    } else if (platform === "win32") {
      // Windows voices (common ones)
      return ["Microsoft David", "Microsoft Hazel", "Microsoft Zira"];
    } else {
      // Linux (espeak)
      return ["default"];
    }
  }

  // Get current status
  getStatus() {
    return {
      enabled: this.config.getConfig().enabled,
      available: !!say,
      speaking: this.isSpeaking,
      queueLength: this.speechQueue.length,
      platform: process.platform,
      config: this.config.getConfig(),
    };
  }
}

// Also export the old NodeVoiceEngine for backward compatibility
class NodeVoiceEngine extends ErrorNarratorNode {
  constructor(options = {}) {
    console.warn(
      "[NodeVoiceEngine] This class is deprecated. Use ErrorNarratorNode instead."
    );
    super(options);
  }
}

export default ErrorNarratorNode;
export { NodeVoiceEngine };
