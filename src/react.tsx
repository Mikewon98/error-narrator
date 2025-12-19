import { ErrorNarratorConfig } from "./config";
import ErrorNarratorBrowser, {
  ErrorNarratorStatus,
  ErrorNarratorOptions,
} from "./browser";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  ReactNode,
  Component,
  ErrorInfo,
} from "react";

// Context types
interface ErrorNarratorContextValue {
  narrator: ErrorNarratorBrowser | null;
  speak: (message: string) => void;
  handleError: (error: Error) => void;
  enable: () => void;
  disable: () => void;
  test: (message?: string) => void;
  clearQueue: () => void;
  getStatus: () => ErrorNarratorStatus | { enabled: false; initialized: false };
  updateConfig: (newConfig: ErrorNarratorConfig) => void;
}

const ErrorNarratorContext = createContext<ErrorNarratorContextValue | null>(
  null
);

// Provider props
interface ErrorNarratorProviderProps {
  children: ReactNode;
  options?: ErrorNarratorOptions;
  onError?: (error: Error) => void;
}

export function ErrorNarratorProvider({
  children,
  options = {},
  onError,
}: ErrorNarratorProviderProps) {
  const narratorRef = useRef<ErrorNarratorBrowser | null>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    const initializeNarrator = async () => {
      if (isInitializedRef.current) return;

      try {
        if (typeof window !== "undefined") {
          narratorRef.current = new ErrorNarratorBrowser({
            autoSetup: true,
            ...options,
          });

          isInitializedRef.current = true;

          if (options.debug) {
            console.log("[ErrorNarratorProvider] Initialized successfully");
          }
        }
      } catch (error) {
        console.error("[ErrorNarratorProvider] Failed to initialize:", error);
        if (onError && error instanceof Error) {
          onError(error);
        }
      }
    };

    initializeNarrator();

    return () => {
      if (narratorRef.current) {
        narratorRef.current.disable();
        narratorRef.current.clearQueue();
      }
    };
  }, []);

  useEffect(() => {
    if (narratorRef.current && isInitializedRef.current) {
      narratorRef.current.updateConfig(options);
    }
  }, [options]);

  const contextValue: ErrorNarratorContextValue = {
    narrator: narratorRef.current,
    speak: (message: string) => {
      if (narratorRef.current) {
        return narratorRef.current.speak(message);
      }
      console.warn("[ErrorNarrator] Not initialized yet");
    },
    handleError: (error: Error) => {
      if (narratorRef.current) {
        return narratorRef.current.handleError(error);
      }
      console.warn("[ErrorNarrator] Not initialized yet");
    },
    enable: () => {
      if (narratorRef.current) {
        return narratorRef.current.enable();
      }
    },
    disable: () => {
      if (narratorRef.current) {
        return narratorRef.current.disable();
      }
    },
    test: (message?: string) => {
      if (narratorRef.current) {
        return narratorRef.current.test(message);
      }
      console.warn("[ErrorNarrator] Not initialized yet");
    },
    clearQueue: () => {
      if (narratorRef.current) {
        return narratorRef.current.clearQueue();
      }
    },
    getStatus: () => {
      if (narratorRef.current) {
        return narratorRef.current.getStatus();
      }
      return { enabled: false, initialized: false };
    },
    updateConfig: (newConfig: ErrorNarratorConfig) => {
      if (narratorRef.current) {
        return narratorRef.current.updateConfig(newConfig);
      }
    },
  };

  return (
    <ErrorNarratorContext.Provider value={contextValue}>
      {children}
    </ErrorNarratorContext.Provider>
  );
}

// Hook
export function useErrorNarrator(): ErrorNarratorContextValue {
  const context = useContext(ErrorNarratorContext);

  if (!context) {
    throw new Error(
      "useErrorNarrator must be used within an ErrorNarratorProvider"
    );
  }

  return context;
}

// HOC
export function withErrorNarration<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  narratorOptions: ErrorNarratorOptions = {}
) {
  return function ErrorNarrationComponent(props: P) {
    return (
      <ErrorNarratorProvider options={narratorOptions}>
        <ErrorBoundary>
          <WrappedComponent {...props} />
        </ErrorBoundary>
      </ErrorNarratorProvider>
    );
  };
}

// Error Boundary types
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  static contextType = ErrorNarratorContext;
  declare context: React.ContextType<typeof ErrorNarratorContext>;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (this.context && this.context.handleError) {
      this.context.handleError(error);
    }

    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "20px",
            border: "1px solid #ff6b6b",
            borderRadius: "8px",
            backgroundColor: "#ffe0e0",
            color: "#d63031",
          }}
        >
          <h2>Something went wrong</h2>
          <p>An error occurred and has been narrated.</p>
          <details style={{ marginTop: "10px" }}>
            <summary>Error details</summary>
            <pre
              style={{
                marginTop: "10px",
                padding: "10px",
                backgroundColor: "#f8f9fa",
                borderRadius: "4px",
                fontSize: "12px",
                overflow: "auto",
              }}
            >
              {this.state.error?.toString()}
            </pre>
          </details>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              marginTop: "10px",
              padding: "8px 16px",
              backgroundColor: "#0984e3",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export { ErrorBoundary };

// import React, { createContext, useContext, useEffect, useRef } from "react";
// import { ErrorProcessor } from "./errorProcessor.js";
// import { Config } from "./config.js";

// // Create ErrorNarrator context
// const ErrorNarratorContext = createContext(null);

// // Provider component
// export function ErrorNarratorProvider({
//   children,
//   options = {},
//   onError = null,
// }) {
//   const narratorRef = useRef(null);
//   const isInitializedRef = useRef(false);

//   useEffect(() => {
//     const initializeNarrator = async () => {
//       if (isInitializedRef.current) return;

//       try {
//         // Dynamic import to avoid SSR issues
//         if (typeof window !== "undefined") {
//           narratorRef.current = new ErrorNarratorBrowser({
//             autoSetup: true,
//             ...options,
//           });

//           isInitializedRef.current = true;

//           if (options.debug) {
//             console.log("[ErrorNarratorProvider] Initialized successfully");
//           }
//         }
//       } catch (error) {
//         console.error("[ErrorNarratorProvider] Failed to initialize:", error);
//         if (onError) {
//           onError(error);
//         }
//       }
//     };

//     initializeNarrator();

//     // Cleanup
//     return () => {
//       if (narratorRef.current) {
//         narratorRef.current.disable();
//         narratorRef.current.clearQueue();
//       }
//     };
//   }, []);

//   // Update config when options change
//   useEffect(() => {
//     if (narratorRef.current && isInitializedRef.current) {
//       narratorRef.current.updateConfig(options);
//     }
//   }, [options]);

//   const contextValue = {
//     narrator: narratorRef.current,
//     speak: (message) => {
//       if (narratorRef.current) {
//         return narratorRef.current.speak(message);
//       }
//       console.warn("[ErrorNarrator] Not initialized yet");
//     },
//     handleError: (error) => {
//       if (narratorRef.current) {
//         return narratorRef.current.handleError(error);
//       }
//       console.warn("[ErrorNarrator] Not initialized yet");
//     },
//     enable: () => {
//       if (narratorRef.current) {
//         return narratorRef.current.enable();
//       }
//     },
//     disable: () => {
//       if (narratorRef.current) {
//         return narratorRef.current.disable();
//       }
//     },
//     test: (message) => {
//       if (narratorRef.current) {
//         return narratorRef.current.test(message);
//       }
//       console.warn("[ErrorNarrator] Not initialized yet");
//     },
//     clearQueue: () => {
//       if (narratorRef.current) {
//         return narratorRef.current.clearQueue();
//       }
//     },
//     getStatus: () => {
//       if (narratorRef.current) {
//         return narratorRef.current.getStatus();
//       }
//       return { enabled: false, initialized: false };
//     },
//     updateConfig: (newConfig) => {
//       if (narratorRef.current) {
//         return narratorRef.current.updateConfig(newConfig);
//       }
//     },
//   };

//   return (
//     <ErrorNarratorContext.Provider value={contextValue}>
//       {children}
//     </ErrorNarratorContext.Provider>
//   );
// }

// // Hook to use ErrorNarrator in components
// export function useErrorNarrator() {
//   const context = useContext(ErrorNarratorContext);

//   if (!context) {
//     throw new Error(
//       "useErrorNarrator must be used within an ErrorNarratorProvider"
//     );
//   }

//   return context;
// }

// // HOC for automatic error boundary with narration
// export function withErrorNarration(WrappedComponent, narratorOptions = {}) {
//   return function ErrorNarrationComponent(props) {
//     return (
//       <ErrorNarratorProvider options={narratorOptions}>
//         <ErrorBoundary>
//           <WrappedComponent {...props} />
//         </ErrorBoundary>
//       </ErrorNarratorProvider>
//     );
//   };
// }

// // Error Boundary component that integrates with ErrorNarrator
// class ErrorBoundary extends React.Component {
//   static contextType = ErrorNarratorContext;

//   constructor(props) {
//     super(props);
//     this.state = { hasError: false, error: null };
//   }

//   static getDerivedStateFromError(error) {
//     return { hasError: true, error };
//   }

//   componentDidCatch(error, errorInfo) {
//     // Use ErrorNarrator to speak the error
//     if (this.context && this.context.handleError) {
//       this.context.handleError(error);
//     }

//     // Log for debugging
//     console.error("ErrorBoundary caught an error:", error, errorInfo);
//   }

//   render() {
//     if (this.state.hasError) {
//       return (
//         <div
//           style={{
//             padding: "20px",
//             border: "1px solid #ff6b6b",
//             borderRadius: "8px",
//             backgroundColor: "#ffe0e0",
//             color: "#d63031",
//           }}
//         >
//           <h2>Something went wrong</h2>
//           <p>An error occurred and has been narrated.</p>
//           <details style={{ marginTop: "10px" }}>
//             <summary>Error details</summary>
//             <pre
//               style={{
//                 marginTop: "10px",
//                 padding: "10px",
//                 backgroundColor: "#f8f9fa",
//                 borderRadius: "4px",
//                 fontSize: "12px",
//                 overflow: "auto",
//               }}
//             >
//               {this.state.error?.toString()}
//             </pre>
//           </details>
//           <button
//             onClick={() => this.setState({ hasError: false, error: null })}
//             style={{
//               marginTop: "10px",
//               padding: "8px 16px",
//               backgroundColor: "#0984e3",
//               color: "white",
//               border: "none",
//               borderRadius: "4px",
//               cursor: "pointer",
//             }}
//           >
//             Try again
//           </button>
//         </div>
//       );
//     }

//     return this.props.children;
//   }
// }

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
// export { ErrorBoundary };
