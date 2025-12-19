import { Config, ErrorNarratorConfig } from "./config";
import { ErrorProcessor } from "./errorProcessor";

export interface ErrorNarratorStatus {
  enabled: boolean;
  initialized: boolean;
  speaking: boolean;
  queueLength: number;
  config: ReturnType<Config["getConfig"]>;
}

export interface ErrorNarratorOptions extends ErrorNarratorConfig {
  autoSetup?: boolean;
}

export class ErrorNarratorBrowser {
  private config: Config;
  private isInitialized: boolean = false;
  private speechQueue: string[] = [];
  private isSpeaking: boolean = false;
  private currentMessage: string | null = null;

  constructor(options: ErrorNarratorOptions = {}) {
    this.config = new Config(options);

    if (this.config.getConfig().debug) {
      console.log("[ErrorNarratorBrowser] Initialized with options:", options);
    }

    this.initSpeechSynthesis();

    if (options.autoSetup !== false) {
      this.setupGlobalHandlers();
    }
  }

  private initSpeechSynthesis(): void {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      console.warn("[ErrorNarratorBrowser] Speech synthesis not available");
      return;
    }

    const loadVoices = (): void => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        this.isInitialized = true;
        if (this.config.getConfig().debug) {
          console.log(
            "[ErrorNarratorBrowser] Speech synthesis initialized, voices available:",
            voices.length
          );
        }
      } else {
        setTimeout(loadVoices, 100);
      }
    };

    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    loadVoices();
  }

  private setupGlobalHandlers(): void {
    if (typeof window === "undefined") return;

    window.addEventListener("error", (event: ErrorEvent) => {
      this.handleError(event.error || new Error(event.message));
    });

    window.addEventListener(
      "unhandledrejection",
      (event: PromiseRejectionEvent) => {
        this.handleError(
          event.reason instanceof Error
            ? event.reason
            : new Error("Unhandled promise rejection")
        );
      }
    );

    if (this.config.getConfig().debug) {
      console.log("[ErrorNarratorBrowser] Global error handlers setup");
    }
  }

  handleError(error: Error): void {
    if (!error) return;

    const configData = this.config.getConfig();

    if (configData.debug) {
      console.log("[ErrorNarratorBrowser] Handling error:", error);
    }

    if (ErrorProcessor.shouldIgnoreError(error)) {
      if (configData.debug) {
        console.log(
          "[ErrorNarratorBrowser] Ignoring error based on processor rules"
        );
      }
      return;
    }

    let message: string | null;
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

    if (this.speechQueue.includes(message) || this.currentMessage === message) {
      if (configData.debug) {
        console.log(
          "[ErrorNarratorBrowser] Ignoring duplicate message in queue:",
          message
        );
      }
      return;
    }

    const syntheticError: Error = {
      message: message,
      name: error.constructor.name,
      constructor: { name: error.constructor.name } as any,
      toString: () => message,
    } as Error;

    if (!this.config.shouldSpeak(syntheticError)) {
      if (configData.debug) {
        console.log(
          "[ErrorNarratorBrowser] Not speaking due to config rules (cooldown)"
        );
      }
      return;
    }

    this.speak(message);
  }

  speak(message: string): void {
    const configData = this.config.getConfig();

    if (configData.debug) {
      console.log("[ErrorNarratorBrowser] Attempting to speak:", message);
    }

    if (
      !configData.enabled ||
      typeof window === "undefined" ||
      !window.speechSynthesis
    ) {
      if (configData.debug) {
        console.warn(
          "[ErrorNarratorBrowser] Speech synthesis not available or disabled"
        );
      }
      return;
    }

    this.speechQueue.push(message);
    this.processSpeechQueue();
  }

  private processSpeechQueue(): void {
    if (this.isSpeaking || this.speechQueue.length === 0) {
      return;
    }

    console.log(`[Queue] ${this.speechQueue.length}`);

    const message = this.speechQueue.shift();
    if (!message) return;

    const configData = this.config.getConfig();
    this.isSpeaking = true;
    this.currentMessage = message;

    try {
      const utterance = new SpeechSynthesisUtterance(message);

      utterance.rate = configData.rate || 1;
      utterance.pitch = configData.pitch || 1;
      utterance.volume = configData.volume || 1;

      if (configData.voice && this.isInitialized) {
        const voices = window.speechSynthesis.getVoices();
        const selectedVoice = voices.find(
          (voice) =>
            voice.name === configData.voice || voice.lang === configData.voice
        );
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }

      utterance.onend = () => {
        this.isSpeaking = false;
        this.currentMessage = null;
        if (configData.debug) {
          console.log("[ErrorNarratorBrowser] Speech completed");
          console.log(`[QueueAfterCompletion] ${this.speechQueue.length}`);
        }
        setTimeout(() => this.processSpeechQueue(), 100);
      };

      utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
        this.isSpeaking = false;
        this.currentMessage = null;
        console.warn("[ErrorNarratorBrowser] Speech error:", event.error);
        setTimeout(() => this.processSpeechQueue(), 100);
      };

      if (configData.debug) {
        console.log("[ErrorNarratorBrowser] Speaking with settings:", {
          rate: utterance.rate,
          pitch: utterance.pitch,
          volume: utterance.volume,
          voice: utterance.voice?.name,
        });
      }

      window.speechSynthesis.speak(utterance);
    } catch (speechError) {
      this.isSpeaking = false;
      this.currentMessage = null;
      console.error(
        "[ErrorNarratorBrowser] Speech synthesis error:",
        speechError
      );
      setTimeout(() => this.processSpeechQueue(), 100);
    }
  }

  updateConfig(newConfig: ErrorNarratorConfig): void {
    this.config.updateConfig(newConfig);
  }

  enable(): void {
    this.config.updateConfig({ enabled: true });
  }

  disable(): void {
    this.config.updateConfig({ enabled: false });
    this.clearQueue();
  }

  clearQueue(): void {
    this.speechQueue = [];
    this.currentMessage = null;
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
  }

  test(message: string = "Error narrator is working correctly"): void {
    this.speak(message);
  }

  getStatus(): ErrorNarratorStatus {
    return {
      enabled: this.config.getConfig().enabled,
      initialized: this.isInitialized,
      speaking: this.isSpeaking,
      queueLength: this.speechQueue.length + (this.isSpeaking ? 1 : 0),
      config: this.config.getConfig(),
    };
  }
}

export default ErrorNarratorBrowser;

// -------------------------------- The below is commented for a fix on the queue issue ------------------------------

// import { Config, ErrorNarratorConfig } from "./config";
// import { ErrorProcessor } from "./errorProcessor";

// export interface ErrorNarratorStatus {
//   enabled: boolean;
//   initialized: boolean;
//   speaking: boolean;
//   queueLength: number;
//   config: ReturnType<Config["getConfig"]>;
// }

// export interface ErrorNarratorOptions extends ErrorNarratorConfig {
//   autoSetup?: boolean;
// }

// export class ErrorNarratorBrowser {
//   private config: Config;
//   private isInitialized: boolean = false;
//   private speechQueue: string[] = [];
//   private isSpeaking: boolean = false;

//   constructor(options: ErrorNarratorOptions = {}) {
//     this.config = new Config(options);

//     if (this.config.getConfig().debug) {
//       console.log("[ErrorNarratorBrowser] Initialized with options:", options);
//     }

//     this.initSpeechSynthesis();

//     if (options.autoSetup !== false) {
//       this.setupGlobalHandlers();
//     }
//   }

//   private initSpeechSynthesis(): void {
//     if (typeof window === "undefined" || !window.speechSynthesis) {
//       console.warn("[ErrorNarratorBrowser] Speech synthesis not available");
//       return;
//     }

//     const loadVoices = (): void => {
//       const voices = window.speechSynthesis.getVoices();
//       if (voices.length > 0) {
//         this.isInitialized = true;
//         if (this.config.getConfig().debug) {
//           console.log(
//             "[ErrorNarratorBrowser] Speech synthesis initialized, voices available:",
//             voices.length
//           );
//         }
//       } else {
//         setTimeout(loadVoices, 100);
//       }
//     };

//     if (window.speechSynthesis.onvoiceschanged !== undefined) {
//       window.speechSynthesis.onvoiceschanged = loadVoices;
//     }

//     loadVoices();
//   }

//   private setupGlobalHandlers(): void {
//     if (typeof window === "undefined") return;

//     window.addEventListener("error", (event: ErrorEvent) => {
//       this.handleError(event.error || new Error(event.message));
//     });

//     window.addEventListener(
//       "unhandledrejection",
//       (event: PromiseRejectionEvent) => {
//         this.handleError(
//           event.reason instanceof Error
//             ? event.reason
//             : new Error("Unhandled promise rejection")
//         );
//       }
//     );

//     if (this.config.getConfig().debug) {
//       console.log("[ErrorNarratorBrowser] Global error handlers setup");
//     }
//   }

//   handleError(error: Error): void {
//     if (!error) return;

//     const configData = this.config.getConfig();

//     if (configData.debug) {
//       console.log("[ErrorNarratorBrowser] Handling error:", error);
//     }

//     if (ErrorProcessor.shouldIgnoreError(error)) {
//       if (configData.debug) {
//         console.log(
//           "[ErrorNarratorBrowser] Ignoring error based on processor rules"
//         );
//       }
//       return;
//     }

//     let message: string | null;
//     if (configData.humanize) {
//       try {
//         message = ErrorProcessor.humanizeError(error, configData);
//       } catch (processingError) {
//         console.warn(
//           "[ErrorNarratorBrowser] Error processing failed:",
//           processingError
//         );
//         message = configData.fallbackToRaw
//           ? error.message || error.toString()
//           : null;
//       }
//     } else {
//       message = error.message || error.toString();
//     }

//     if (!message) {
//       return;
//     }

//     if (this.speechQueue.includes(message)) {
//       if (configData.debug) {
//         console.log(
//           "[ErrorNarratorBrowser] Ignoring duplicate message in queue:",
//           message
//         );
//       }
//       return;
//     }

//     const syntheticError: Error = {
//       message: message,
//       name: error.constructor.name,
//       constructor: { name: error.constructor.name } as any,
//       toString: () => message,
//     } as Error;

//     if (!this.config.shouldSpeak(syntheticError)) {
//       if (configData.debug) {
//         console.log(
//           "[ErrorNarratorBrowser] Not speaking due to config rules (cooldown)"
//         );
//       }
//       return;
//     }

//     this.speak(message);
//   }

//   speak(message: string): void {
//     const configData = this.config.getConfig();

//     if (configData.debug) {
//       console.log("[ErrorNarratorBrowser] Attempting to speak:", message);
//     }

//     if (
//       !configData.enabled ||
//       typeof window === "undefined" ||
//       !window.speechSynthesis
//     ) {
//       if (configData.debug) {
//         console.warn(
//           "[ErrorNarratorBrowser] Speech synthesis not available or disabled"
//         );
//       }
//       return;
//     }

//     this.speechQueue.push(message);
//     this.processSpeechQueue();
//   }

//   private processSpeechQueue(): void {
//     if (this.isSpeaking || this.speechQueue.length === 0) {
//       return;
//     }

//     console.log(`[Queue] ${this.speechQueue.length}`);

//     const message = this.speechQueue.shift();
//     if (!message) return;

//     const configData = this.config.getConfig();
//     this.isSpeaking = true;

//     try {
//       const utterance = new SpeechSynthesisUtterance(message);

//       utterance.rate = configData.rate || 1;
//       utterance.pitch = configData.pitch || 1;
//       utterance.volume = configData.volume || 1;

//       if (configData.voice && this.isInitialized) {
//         const voices = window.speechSynthesis.getVoices();
//         const selectedVoice = voices.find(
//           (voice) =>
//             voice.name === configData.voice || voice.lang === configData.voice
//         );
//         if (selectedVoice) {
//           utterance.voice = selectedVoice;
//         }
//       }

//       utterance.onend = () => {
//         this.isSpeaking = false;
//         if (configData.debug) {
//           console.log("[ErrorNarratorBrowser] Speech completed");
//           console.log(`[QueueAfterCompletion] ${this.speechQueue.length}`);
//         }
//         setTimeout(() => this.processSpeechQueue(), 100);
//       };

//       utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
//         this.isSpeaking = false;
//         console.warn("[ErrorNarratorBrowser] Speech error:", event.error);
//         setTimeout(() => this.processSpeechQueue(), 100);
//       };

//       if (configData.debug) {
//         console.log("[ErrorNarratorBrowser] Speaking with settings:", {
//           rate: utterance.rate,
//           pitch: utterance.pitch,
//           volume: utterance.volume,
//           voice: utterance.voice?.name,
//         });
//       }

//       window.speechSynthesis.speak(utterance);
//     } catch (speechError) {
//       this.isSpeaking = false;
//       console.error(
//         "[ErrorNarratorBrowser] Speech synthesis error:",
//         speechError
//       );
//       setTimeout(() => this.processSpeechQueue(), 100);
//     }
//   }

//   updateConfig(newConfig: ErrorNarratorConfig): void {
//     this.config.updateConfig(newConfig);
//   }

//   enable(): void {
//     this.config.updateConfig({ enabled: true });
//   }

//   disable(): void {
//     this.config.updateConfig({ enabled: false });
//     this.clearQueue();
//   }

//   clearQueue(): void {
//     this.speechQueue = [];
//     if (typeof window !== "undefined" && window.speechSynthesis) {
//       window.speechSynthesis.cancel();
//     }
//     this.isSpeaking = false;
//   }

//   test(message: string = "Error narrator is working correctly"): void {
//     this.speak(message);
//   }

//   getStatus(): ErrorNarratorStatus {
//     return {
//       enabled: this.config.getConfig().enabled,
//       initialized: this.isInitialized,
//       speaking: this.isSpeaking,
//       queueLength: this.speechQueue.length,
//       config: this.config.getConfig(),
//     };
//   }
// }

// export default ErrorNarratorBrowser;

// -------------------------------- The above is commented for a fix on the queue issue ------------------------------

// import { Config } from "./config.js";
// import { ErrorProcessor } from "./errorProcessor.js";

// class ErrorNarratorBrowser {
//   constructor(options = {}) {
//     this.config = new Config(options);
//     this.isInitialized = false;
//     this.speechQueue = [];
//     this.isSpeaking = false;

//     if (this.config.getConfig().debug) {
//       console.log("[ErrorNarratorBrowser] Initialized with options:", options);
//     }

//     // Initialize speech synthesis
//     this.initSpeechSynthesis();

//     // Auto-setup global error handlers if enabled
//     if (options.autoSetup !== false) {
//       this.setupGlobalHandlers();
//     }
//   }

//   initSpeechSynthesis() {
//     if (typeof window === "undefined" || !window.speechSynthesis) {
//       console.warn("[ErrorNarratorBrowser] Speech synthesis not available");
//       return;
//     }

//     // Wait for voices to load
//     const loadVoices = () => {
//       const voices = window.speechSynthesis.getVoices();
//       if (voices.length > 0) {
//         this.isInitialized = true;
//         if (this.config.getConfig().debug) {
//           console.log(
//             "[ErrorNarratorBrowser] Speech synthesis initialized, voices available:",
//             voices.length,
//             " -----------",
//             voices[2]
//           );
//         }
//       } else {
//         // Retry after a short delay
//         setTimeout(loadVoices, 100);
//       }
//     };

//     if (window.speechSynthesis.onvoiceschanged !== undefined) {
//       window.speechSynthesis.onvoiceschanged = loadVoices;
//     }

//     loadVoices();
//   }

//   setupGlobalHandlers() {
//     if (typeof window === "undefined") return;

//     // Handle uncaught errors
//     window.addEventListener("error", (event) => {
//       this.handleError(event.error || new Error(event.message));
//     });

//     // Handle unhandled promise rejections
//     window.addEventListener("unhandledrejection", (event) => {
//       this.handleError(
//         event.reason || new Error("Unhandled promise rejection")
//       );
//     });

//     if (this.config.getConfig().debug) {
//       console.log("[ErrorNarratorBrowser] Global error handlers setup");
//     }
//   }

//   handleError(error) {
//     if (!error) return;

//     const configData = this.config.getConfig();

//     if (configData.debug) {
//       console.log("[ErrorNarratorBrowser] Handling error:", error);
//     }

//     if (ErrorProcessor.shouldIgnoreError(error, configData)) {
//       if (configData.debug) {
//         console.log(
//           "[ErrorNarratorBrowser] Ignoring error based on processor rules"
//         );
//       }
//       return;
//     }

//     // Process the error message first to get the final text
//     let message;
//     if (configData.humanize) {
//       try {
//         message = ErrorProcessor.humanizeError(error, configData);
//       } catch (processingError) {
//         console.warn(
//           "[ErrorNarratorBrowser] Error processing failed:",
//           processingError
//         );
//         message = configData.fallbackToRaw
//           ? error.message || error.toString()
//           : null;
//       }
//     } else {
//       message = error.message || error.toString();
//     }

//     if (!message) {
//       return;
//     }

//     // *** FIXED: Check if the exact same message is already in the queue ***
//     if (this.speechQueue.includes(message)) {
//       if (configData.debug) {
//         console.log(
//           "[ErrorNarratorBrowser] Ignoring duplicate message in queue:",
//           message
//         );
//       }
//       return;
//     }

//     // *** FIXED: Create a synthetic error object with the processed message for cooldown check ***
//     // This ensures cooldown is based on the final message that will be spoken
//     const syntheticError = {
//       message: message,
//       constructor: { name: error.constructor.name },
//       toString: () => message,
//     };

//     // Now, check the cooldown from the config using the processed message
//     if (!this.config.shouldSpeak(syntheticError)) {
//       if (configData.debug) {
//         console.log(
//           "[ErrorNarratorBrowser] Not speaking due to config rules (cooldown)"
//         );
//       }
//       return;
//     }

//     // If all checks pass, then speak.
//     this.speak(message);
//   }

//   speak(message) {
//     const configData = this.config.getConfig();

//     if (configData.debug) {
//       console.log("[ErrorNarratorBrowser] Attempting to speak:", message);
//     }

//     if (
//       !configData.enabled ||
//       typeof window === "undefined" ||
//       !window.speechSynthesis
//     ) {
//       if (configData.debug) {
//         console.warn(
//           "[ErrorNarratorBrowser] Speech synthesis not available or disabled"
//         );
//       }
//       return;
//     }

//     // Add to queue
//     this.speechQueue.push(message);
//     this.processSpeechQueue();
//   }

//   processSpeechQueue() {
//     if (this.isSpeaking || this.speechQueue.length === 0) {
//       return;
//     }
//     console.log(`[Queue] ${this.speechQueue.length}`);

//     const message = this.speechQueue.shift();
//     const configData = this.config.getConfig();

//     this.isSpeaking = true;

//     try {
//       const utterance = new SpeechSynthesisUtterance(message);

//       // Apply configuration
//       utterance.rate = configData.rate || 1;
//       utterance.pitch = configData.pitch || 1;
//       utterance.volume = configData.volume || 1;

//       // Set voice if specified
//       if (configData.voice && this.isInitialized) {
//         const voices = window.speechSynthesis.getVoices();
//         const selectedVoice = voices.find(
//           (voice) =>
//             voice.name === configData.voice || voice.lang === configData.voice
//         );
//         if (selectedVoice) {
//           utterance.voice = selectedVoice;
//         }
//       }

//       // Handle speech events
//       utterance.onend = () => {
//         this.isSpeaking = false;
//         if (configData.debug) {
//           console.log("[ErrorNarratorBrowser] Speech completed");
//           console.log(`[QueueAfterCompletion] ${this.speechQueue.length}`);
//         }
//         // Process next item in queue
//         setTimeout(() => this.processSpeechQueue(), 100);
//       };

//       utterance.onerror = (event) => {
//         this.isSpeaking = false;
//         console.warn("[ErrorNarratorBrowser] Speech error:", event.error);
//         // Process next item in queue
//         setTimeout(() => this.processSpeechQueue(), 100);
//       };

//       if (configData.debug) {
//         console.log("[ErrorNarratorBrowser] Speaking with settings:", {
//           rate: utterance.rate,
//           pitch: utterance.pitch,
//           volume: utterance.volume,
//           voice: utterance.voice?.name,
//         });
//       }

//       window.speechSynthesis.speak(utterance);
//     } catch (speechError) {
//       this.isSpeaking = false;
//       console.error(
//         "[ErrorNarratorBrowser] Speech synthesis error:",
//         speechError
//       );
//       // Process next item in queue
//       setTimeout(() => this.processSpeechQueue(), 100);
//     }
//   }

//   // Public API methods
//   updateConfig(newConfig) {
//     this.config.updateConfig(newConfig);
//   }

//   enable() {
//     this.config.updateConfig({ enabled: true });
//   }

//   disable() {
//     this.config.updateConfig({ enabled: false });
//     this.clearQueue();
//   }

//   clearQueue() {
//     this.speechQueue = [];
//     if (typeof window !== "undefined" && window.speechSynthesis) {
//       window.speechSynthesis.cancel();
//     }
//     this.isSpeaking = false;
//   }

//   // Test method
//   test(message = "Error narrator is working correctly") {
//     this.speak(message);
//   }

//   // Get current status
//   getStatus() {
//     return {
//       enabled: this.config.getConfig().enabled,
//       initialized: this.isInitialized,
//       speaking: this.isSpeaking,
//       queueLength: this.speechQueue.length,
//       config: this.config.getConfig(),
//     };
//   }
// }

// export default ErrorNarratorBrowser;
