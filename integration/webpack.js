// Webpack plugin for error-narrator
// Provides build-time error narration and runtime injection

const path = require("path");

class ErrorNarratorWebpackPlugin {
  constructor(options = {}) {
    this.options = {
      enabled: process.env.NODE_ENV === "development",
      voice: null,
      rate: 1,
      pitch: 1,
      volume: 1,
      maxMessageLength: 100,
      cooldownMs: 5000,
      debug: process.env.NODE_ENV === "development",
      humanize: true,
      fallbackToRaw: true,
      speakWarnings: false,
      speakErrors: true,
      filters: {
        ignorePatterns: [
          "ResizeObserver loop limit exceeded",
          "Non-Error promise rejection captured",
          "Loading chunk",
          "ChunkLoadError",
          "webpack-dev-server",
          "HMR",
          "Hot Module Replacement",
        ],
        onlyPatterns: null,
        errorTypes: [
          "SyntaxError",
          "ReferenceError",
          "TypeError",
          "RangeError",
          "Error",
          "ModuleError",
          "ModuleBuildError",
        ],
      },
      ...options,
    };

    this.lastSpoken = new Map();
    this.errorCounts = new Map();
    this.speechQueue = [];
    this.isSpeaking = false;
    this.narrator = null;

    if (this.options.debug) {
      console.log(
        "[ErrorNarratorWebpackPlugin] Initialized with options:",
        this.options
      );
    }
  }

  apply(compiler) {
    if (!this.options.enabled) {
      if (this.options.debug) {
        console.log("[ErrorNarratorWebpackPlugin] Plugin disabled");
      }
      return;
    }

    // Initialize the appropriate narrator based on environment
    this.initializeNarrator();

    const pluginName = "ErrorNarratorWebpackPlugin";

    // Hook into compilation errors
    compiler.hooks.compilation.tap(pluginName, (compilation) => {
      // Handle module build errors
      compilation.hooks.failedModule.tap(pluginName, (module) => {
        if (module.errors && module.errors.length > 0) {
          module.errors.forEach((error) =>
            this.handleWebpackError(error, module)
          );
        }
      });

      // Handle general compilation errors
      compilation.hooks.afterCompile.tap(pluginName, (compilation) => {
        if (compilation.errors && compilation.errors.length > 0) {
          compilation.errors.forEach((error) => this.handleWebpackError(error));
        }

        if (
          this.options.speakWarnings &&
          compilation.warnings &&
          compilation.warnings.length > 0
        ) {
          compilation.warnings.forEach((warning) =>
            this.handleWebpackWarning(warning)
          );
        }
      });
    });

    // Hook into done event for build completion
    compiler.hooks.done.tap(pluginName, (stats) => {
      const compilation = stats.compilation;

      // Handle errors from stats
      if (compilation.errors && compilation.errors.length > 0) {
        compilation.errors.forEach((error) => this.handleWebpackError(error));
      }

      // Handle warnings if enabled
      if (
        this.options.speakWarnings &&
        compilation.warnings &&
        compilation.warnings.length > 0
      ) {
        compilation.warnings.forEach((warning) =>
          this.handleWebpackWarning(warning)
        );
      }
    });

    // Hook into failed event
    compiler.hooks.failed.tap(pluginName, (error) => {
      this.handleWebpackError(error);
    });

    if (this.options.debug) {
      console.log("[ErrorNarratorWebpackPlugin] Webpack hooks registered");
    }
  }

  initializeNarrator() {
    try {
      // Try to use the error-narrator package if available
      if (typeof window !== "undefined") {
        // Browser environment - use dynamic import
        import("../src/browser.js")
          .then((module) => {
            const ErrorNarratorBrowser = module.default;
            this.narrator = new ErrorNarratorBrowser({
              ...this.options,
              autoSetup: false, // We handle errors manually
            });
            if (this.options.debug) {
              console.log(
                "[ErrorNarratorWebpackPlugin] Browser narrator initialized"
              );
            }
          })
          .catch((error) => {
            if (this.options.debug) {
              console.warn(
                "[ErrorNarratorWebpackPlugin] Failed to load browser narrator:",
                error
              );
            }
            this.initializeFallbackNarrator();
          });
      } else {
        // Node.js environment
        try {
          const ErrorNarratorNode = require("../src/node.js");
          this.narrator = new ErrorNarratorNode({
            ...this.options,
            autoSetup: false,
          });
          if (this.options.debug) {
            console.log(
              "[ErrorNarratorWebpackPlugin] Node narrator initialized"
            );
          }
        } catch (error) {
          if (this.options.debug) {
            console.warn(
              "[ErrorNarratorWebpackPlugin] Failed to load node narrator:",
              error
            );
          }
          this.initializeFallbackNarrator();
        }
      }
    } catch (error) {
      if (this.options.debug) {
        console.warn(
          "[ErrorNarratorWebpackPlugin] Failed to initialize narrator:",
          error
        );
      }
      this.initializeFallbackNarrator();
    }
  }

  initializeFallbackNarrator() {
    // Fallback implementation when the main package is not available
    if (typeof window !== "undefined" && window.speechSynthesis) {
      // Browser fallback
      this.narrator = {
        speak: (message) => this.fallbackBrowserSpeak(message),
        handleError: (error) => this.handleError(error),
      };
    } else {
      // Node.js fallback - try to use 'say' package directly
      try {
        const say = require("say");
        this.narrator = {
          speak: (message) => this.fallbackNodeSpeak(message, say),
          handleError: (error) => this.handleError(error),
        };
      } catch (error) {
        if (this.options.debug) {
          console.warn(
            "[ErrorNarratorWebpackPlugin] No speech synthesis available"
          );
        }
        this.narrator = {
          speak: () => {},
          handleError: () => {},
        };
      }
    }
  }

  handleWebpackError(error, module = null) {
    if (!this.options.speakErrors) return;

    // Process webpack-specific error
    const processedError = this.processWebpackError(error, module);

    if (this.shouldSpeak(processedError)) {
      this.speak(processedError.message);
    }
  }

  handleWebpackWarning(warning) {
    if (!this.options.speakWarnings) return;

    const processedWarning = this.processWebpackError(warning);

    if (this.shouldSpeak(processedWarning)) {
      this.speak(`Warning: ${processedWarning.message}`);
    }
  }

  processWebpackError(error, module = null) {
    let message = error.message || error.toString();
    let errorType = error.constructor?.name || "WebpackError";

    // Extract useful information from webpack errors
    if (error.module && error.module.resource) {
      const filename = path.basename(error.module.resource);
      message = `${message} in ${filename}`;
    } else if (module && module.resource) {
      const filename = path.basename(module.resource);
      message = `${message} in ${filename}`;
    }

    // Clean up webpack-specific noise
    message = this.cleanWebpackMessage(message);

    // Humanize common webpack errors
    message = this.humanizeWebpackError(message, errorType);

    return {
      message: this.truncateMessage(message),
      type: errorType,
      original: error,
    };
  }

  cleanWebpackMessage(message) {
    return (
      message
        // Remove webpack loader syntax
        .replace(/webpack:\/\/\/.*?!/g, "")
        .replace(/\.\//g, "")
        // Remove long file paths
        .replace(/[^\s]*node_modules[^\s]*/g, "dependency")
        // Clean up module identifiers
        .replace(/Module build failed.*?:/i, "Build failed:")
        .replace(/ModuleError:/i, "Module error:")
        .replace(/ModuleBuildError:/i, "Build error:")
        // Remove excessive technical details
        .replace(/\s+at\s+.*$/gm, "")
        // Clean up whitespace
        .replace(/\s+/g, " ")
        .trim()
    );
  }

  humanizeWebpackError(message, errorType) {
    const patterns = {
      "Module not found": () =>
        "Module not found. Check your import path or install the missing package.",
      "Cannot resolve module": () =>
        "Cannot resolve module. Check the file path or package name.",
      "Unexpected token": () =>
        "Syntax error. Check for missing brackets, commas, or quotes.",
      "Invalid or unexpected token": () =>
        "Invalid syntax. Check your code for typos or missing punctuation.",
      SyntaxError: () =>
        "Syntax error in your code. Check for missing brackets or semicolons.",
      ReferenceError: () =>
        "Reference error. Variable or function not defined.",
      TypeError: () => "Type error. Check your data types and function calls.",
      "Module build failed": () =>
        "Build failed. Check your code for syntax errors.",
      "Failed to compile": () =>
        "Compilation failed. Check the error details below.",
    };

    for (const [pattern, handler] of Object.entries(patterns)) {
      if (message.toLowerCase().includes(pattern.toLowerCase())) {
        return handler();
      }
    }

    return message;
  }

  shouldSpeak(processedError) {
    if (!this.options.enabled) return false;

    const now = Date.now();
    const message = processedError.message;
    const errorType = processedError.type;

    // Create a hash for deduplication
    const messageHash = this.hashString(message);
    const errorKey = `${errorType}:${messageHash}`;

    // Check if message is in queue already
    if (this.speechQueue.includes(message)) {
      return false;
    }

    // Check global cooldown
    const lastGlobalSpoken = this.lastSpoken.get("global");
    if (lastGlobalSpoken && now - lastGlobalSpoken < this.options.cooldownMs) {
      return false;
    }

    // Check specific error cooldown
    const lastErrorSpoken = this.lastSpoken.get(errorKey);
    if (lastErrorSpoken) {
      const errorCount = this.errorCounts.get(errorKey) || 0;
      const specificCooldown =
        this.options.cooldownMs * Math.min(errorCount + 1, 5);

      if (now - lastErrorSpoken < specificCooldown) {
        return false;
      }
    }

    // Check ignore patterns
    if (
      this.options.filters.ignorePatterns?.some((pattern) =>
        message.toLowerCase().includes(pattern.toLowerCase())
      )
    ) {
      return false;
    }

    // Check only patterns
    if (
      this.options.filters.onlyPatterns &&
      this.options.filters.onlyPatterns.length > 0
    ) {
      const matchesOnlyPattern = this.options.filters.onlyPatterns.some(
        (pattern) => message.toLowerCase().includes(pattern.toLowerCase())
      );
      if (!matchesOnlyPattern) {
        return false;
      }
    }

    // Update tracking
    this.lastSpoken.set("global", now);
    this.lastSpoken.set(errorKey, now);
    const errorCount = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, errorCount + 1);

    return true;
  }

  speak(message) {
    if (this.narrator && this.narrator.speak) {
      this.narrator.speak(message);
    } else {
      // Fallback to direct speech
      this.speechQueue.push(message);
      this.processSpeechQueue();
    }
  }

  processSpeechQueue() {
    if (this.isSpeaking || this.speechQueue.length === 0) return;

    const message = this.speechQueue.shift();
    this.isSpeaking = true;

    if (typeof window !== "undefined" && window.speechSynthesis) {
      this.fallbackBrowserSpeak(message);
    } else {
      // Try Node.js speech
      try {
        const say = require("say");
        this.fallbackNodeSpeak(message, say);
      } catch (error) {
        console.log(`[ErrorNarratorWebpackPlugin] Would speak: ${message}`);
        this.isSpeaking = false;
        setTimeout(() => this.processSpeechQueue(), 100);
      }
    }
  }

  fallbackBrowserSpeak(message) {
    try {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = this.options.rate || 1;
      utterance.pitch = this.options.pitch || 1;
      utterance.volume = this.options.volume || 1;

      utterance.onend = () => {
        this.isSpeaking = false;
        setTimeout(() => this.processSpeechQueue(), 100);
      };

      utterance.onerror = () => {
        this.isSpeaking = false;
        setTimeout(() => this.processSpeechQueue(), 100);
      };

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      this.isSpeaking = false;
      setTimeout(() => this.processSpeechQueue(), 100);
    }
  }

  fallbackNodeSpeak(message, say) {
    try {
      const options = {
        voice: this.options.voice || null,
        speed: this.options.rate || 1.0,
      };

      say.speak(message, options.voice, options.speed, (error) => {
        this.isSpeaking = false;
        if (error && this.options.debug) {
          console.warn("[ErrorNarratorWebpackPlugin] Speech error:", error);
        }
        setTimeout(() => this.processSpeechQueue(), 100);
      });
    } catch (error) {
      this.isSpeaking = false;
      setTimeout(() => this.processSpeechQueue(), 100);
    }
  }

  truncateMessage(message) {
    const maxLength = this.options.maxMessageLength || 150;
    if (message.length <= maxLength) {
      return message;
    }
    return message.substring(0, maxLength - 3) + "...";
  }

  hashString(str) {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString();
  }

  handleError(error) {
    // Generic error handler for fallback narrator
    const processedError = {
      message: error.message || error.toString(),
      type: error.constructor?.name || "Error",
      original: error,
    };

    if (this.shouldSpeak(processedError)) {
      this.speak(processedError.message);
    }
  }
}

module.exports = ErrorNarratorWebpackPlugin;
