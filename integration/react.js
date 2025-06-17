import React, { createContext, useContext, useEffect, useRef } from "react";

// Create ErrorNarrator context
const ErrorNarratorContext = createContext(null);

// Provider component
export function ErrorNarratorProvider({
  children,
  options = {},
  onError = null,
}) {
  const narratorRef = useRef(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    let ErrorNarratorBrowser;

    const initializeNarrator = async () => {
      if (isInitializedRef.current) return;

      try {
        // Dynamic import to avoid SSR issues
        if (typeof window !== "undefined") {
          const module = await import("error-narrator/src/browser.js");
          ErrorNarratorBrowser = module.default;

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
        if (onError) {
          onError(error);
        }
      }
    };

    initializeNarrator();

    // Cleanup
    return () => {
      if (narratorRef.current) {
        narratorRef.current.disable();
        narratorRef.current.clearQueue();
      }
    };
  }, []);

  // Update config when options change
  useEffect(() => {
    if (narratorRef.current && isInitializedRef.current) {
      narratorRef.current.updateConfig(options);
    }
  }, [options]);

  const contextValue = {
    narrator: narratorRef.current,
    speak: (message) => narratorRef.current?.speak(message),
    handleError: (error) => narratorRef.current?.handleError(error),
    enable: () => narratorRef.current?.enable(),
    disable: () => narratorRef.current?.disable(),
    test: (message) => narratorRef.current?.test(message),
    clearQueue: () => narratorRef.current?.clearQueue(),
    getStatus: () => narratorRef.current?.getStatus(),
    updateConfig: (newConfig) => narratorRef.current?.updateConfig(newConfig),
  };

  return (
    <ErrorNarratorContext.Provider value={contextValue}>
      {children}
    </ErrorNarratorContext.Provider>
  );
}

// Hook to use ErrorNarrator in components
export function useErrorNarrator() {
  const context = useContext(ErrorNarratorContext);

  if (!context) {
    throw new Error(
      "useErrorNarrator must be used within an ErrorNarratorProvider"
    );
  }

  return context;
}

// HOC for automatic error boundary with narration
export function withErrorNarration(WrappedComponent, narratorOptions = {}) {
  return function ErrorNarrationComponent(props) {
    return (
      <ErrorNarratorProvider options={narratorOptions}>
        <ErrorBoundary>
          <WrappedComponent {...props} />
        </ErrorBoundary>
      </ErrorNarratorProvider>
    );
  };
}

// Error Boundary component that integrates with ErrorNarrator
class ErrorBoundary extends React.Component {
  static contextType = ErrorNarratorContext;

  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Use ErrorNarrator to speak the error
    if (this.context && this.context.handleError) {
      this.context.handleError(error);
    }

    // Log for debugging
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

// import React, { useEffect, useRef } from "react";
// import ErrorNarratorBrowser from "../src/browser";

// // Enhanced Error Boundary with ErrorNarrator integration
// export function createVoiceErrorBoundary(options = {}) {
//   return class VoiceErrorBoundary extends React.Component {
//     constructor(props) {
//       super(props);
//       this.state = { hasError: false, error: null, errorInfo: null };

//       // Initialize ErrorNarrator with merged options
//       const narratorOptions = {
//         autoSetup: false, // We'll handle errors manually in the boundary
//         ...options,
//         ...props.narratorOptions,
//       };

//       this.narrator = new ErrorNarratorBrowser(narratorOptions);

//       if (narratorOptions.debug) {
//         console.log(
//           "[VoiceErrorBoundary] Initialized with options:",
//           narratorOptions
//         );
//       }

//       // Setup global handlers if requested
//       if (props.captureGlobalErrors !== false) {
//         this.setupGlobalHandlers();
//       }
//     }

//     setupGlobalHandlers() {
//       if (typeof window === "undefined") return;

//       this.handleWindowError = (event) => {
//         const error = event.error || new Error(event.message);
//         this.narrator.handleError(error);
//       };

//       this.handleUnhandledRejection = (event) => {
//         const error =
//           event.reason instanceof Error
//             ? event.reason
//             : new Error(String(event.reason));
//         this.narrator.handleError(error);
//       };

//       window.addEventListener("error", this.handleWindowError);
//       window.addEventListener(
//         "unhandledrejection",
//         this.handleUnhandledRejection
//       );
//     }

//     componentWillUnmount() {
//       // Clean up event listeners
//       if (typeof window !== "undefined") {
//         window.removeEventListener("error", this.handleWindowError);
//         window.removeEventListener(
//           "unhandledrejection",
//           this.handleUnhandledRejection
//         );
//       }
//     }

//     static getDerivedStateFromError(error) {
//       return {
//         hasError: true,
//         error: error,
//         errorInfo: null,
//       };
//     }

//     componentDidCatch(error, errorInfo) {
//       this.setState({
//         error: error,
//         errorInfo: errorInfo,
//       });

//       // Handle the error with our narrator
//       this.narrator.handleError(error);

//       // Call custom error handler if provided
//       if (this.props.onError) {
//         this.props.onError(error, errorInfo);
//       }
//     }

//     render() {
//       if (this.state.hasError) {
//         // Custom error UI
//         if (this.props.fallback) {
//           if (typeof this.props.fallback === "function") {
//             return this.props.fallback(this.state.error, this.state.errorInfo);
//           }
//           return this.props.fallback;
//         }

//         // Default error UI
//         return (
//           <div
//             style={{
//               padding: "20px",
//               border: "1px solid #ff6b6b",
//               borderRadius: "8px",
//               backgroundColor: "#fff5f5",
//               margin: "20px 0",
//             }}
//           >
//             <h2 style={{ color: "#d63031", marginTop: 0 }}>
//               Something went wrong
//             </h2>
//             <details style={{ whiteSpace: "pre-wrap" }}>
//               <summary style={{ cursor: "pointer", marginBottom: "10px" }}>
//                 Error details
//               </summary>
//               <strong>Error:</strong> {this.state.error?.toString()}
//               {this.state.errorInfo && (
//                 <>
//                   <br />
//                   <br />
//                   <strong>Component Stack:</strong>
//                   {this.state.errorInfo.componentStack}
//                 </>
//               )}
//             </details>
//           </div>
//         );
//       }

//       return this.props.children;
//     }
//   };
// }

// // Hook for using ErrorNarrator in functional components
// export function useErrorNarrator(options = {}) {
//   const narratorRef = useRef(null);

//   useEffect(() => {
//     if (!narratorRef.current) {
//       narratorRef.current = new ErrorNarratorBrowser({
//         autoSetup: false,
//         ...options,
//       });
//     }

//     return () => {
//       if (narratorRef.current) {
//         narratorRef.current.clearQueue();
//       }
//     };
//   }, []);

//   const speak = (message) => {
//     if (narratorRef.current) {
//       narratorRef.current.speak(message);
//     }
//   };

//   const handleError = (error) => {
//     if (narratorRef.current) {
//       narratorRef.current.handleError(error);
//     }
//   };

//   const test = (message) => {
//     if (narratorRef.current) {
//       narratorRef.current.test(message);
//     }
//   };

//   const updateConfig = (newConfig) => {
//     if (narratorRef.current) {
//       narratorRef.current.updateConfig(newConfig);
//     }
//   };

//   const getStatus = () => {
//     if (narratorRef.current) {
//       return narratorRef.current.getStatus();
//     }
//     return null;
//   };

//   return {
//     speak,
//     handleError,
//     test,
//     updateConfig,
//     getStatus,
//     narrator: narratorRef.current,
//   };
// }

// // Component for easy setup
// export function ErrorNarratorProvider({
//   children,
//   options = {},
//   fallback,
//   onError,
//   captureGlobalErrors = true,
// }) {
//   const VoiceErrorBoundary = createVoiceErrorBoundary(options);

//   return (
//     <VoiceErrorBoundary
//       fallback={fallback}
//       onError={onError}
//       captureGlobalErrors={captureGlobalErrors}
//       narratorOptions={options}
//     >
//       {children}
//     </VoiceErrorBoundary>
//   );
// }

// // Development helper component
// export function ErrorNarratorDebug({ options = {} }) {
//   const { test, getStatus, updateConfig } = useErrorNarrator({
//     debug: true,
//     ...options,
//   });

//   const [status, setStatus] = React.useState(null);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       setStatus(getStatus());
//     }, 1000);

//     return () => clearInterval(interval);
//   }, [getStatus]);

//   const triggerTestError = () => {
//     throw new Error("This is a test error for ErrorNarrator");
//   };

//   const triggerTestSpeech = () => {
//     test("Testing error narrator speech functionality");
//   };

//   if (process.env.NODE_ENV !== "development") {
//     return null;
//   }

//   return (
//     <div
//       style={{
//         position: "fixed",
//         bottom: "20px",
//         right: "20px",
//         padding: "15px",
//         backgroundColor: "#f8f9fa",
//         border: "1px solid #dee2e6",
//         borderRadius: "8px",
//         fontSize: "12px",
//         zIndex: 9999,
//         maxWidth: "300px",
//       }}
//     >
//       <h4 style={{ margin: "0 0 10px 0" }}>ErrorNarrator Debug</h4>

//       <div style={{ marginBottom: "10px" }}>
//         <strong>Status:</strong>{" "}
//         {status?.enabled ? "✅ Enabled" : "❌ Disabled"}
//         <br />
//         <strong>Speaking:</strong> {status?.speaking ? "🔊 Yes" : "🔇 No"}
//         <br />
//         <strong>Queue:</strong> {status?.queueLength || 0} items
//       </div>

//       <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
//         <button
//           onClick={triggerTestSpeech}
//           style={{
//             padding: "5px 10px",
//             fontSize: "11px",
//             backgroundColor: "#007bff",
//             color: "white",
//             border: "none",
//             borderRadius: "4px",
//             cursor: "pointer",
//           }}
//         >
//           Test Speech
//         </button>

//         <button
//           onClick={triggerTestError}
//           style={{
//             padding: "5px 10px",
//             fontSize: "11px",
//             backgroundColor: "#dc3545",
//             color: "white",
//             border: "none",
//             borderRadius: "4px",
//             cursor: "pointer",
//           }}
//         >
//           Test Error
//         </button>

//         <button
//           onClick={() => updateConfig({ enabled: !status?.enabled })}
//           style={{
//             padding: "5px 10px",
//             fontSize: "11px",
//             backgroundColor: status?.enabled ? "#ffc107" : "#28a745",
//             color: status?.enabled ? "black" : "white",
//             border: "none",
//             borderRadius: "4px",
//             cursor: "pointer",
//           }}
//         >
//           {status?.enabled ? "Disable" : "Enable"}
//         </button>
//       </div>
//     </div>
//   );
// }

// // Legacy component for backward compatibility
// export const VoiceErrorBoundary = createVoiceErrorBoundary();

// import React from "react";
// import ErrorNarrator from "../browser";

// export function createVoiceErrorBoundary() {
//   return class VoiceErrorBoundary extends React.Component {
//     constructor(props) {
//       super(props);
//       this.state = { hasError: false };
//       console.log("VoiceErrorBoundary initialized");

//       // Add global error handlers
//       if (typeof window !== "undefined") {
//         window.addEventListener("error", this.handleError);
//         window.addEventListener("unhandledrejection", this.handleError);
//       }
//     }

//     componentWillUnmount() {
//       // Clean up event listeners
//       if (typeof window !== "undefined") {
//         window.removeEventListener("error", this.handleError);
//         window.removeEventListener("unhandledrejection", this.handleError);
//       }
//     }

//     handleError = (event) => {
//       console.log("Error caught in handleError:", event);
//       const error = event.error || event.reason || event;
//       this.speakError(error);
//     };

//     speakError = (error) => {
//       console.log("Speaking error:", error);
//       if (process.env.NEXT_PUBLIC_NODE_ENV === "development") {
//         if (window.speechSynthesis) {
//           const message = error.message || "An error occurred";
//           console.log("Speaking error message:", message);
//           const utterance = new SpeechSynthesisUtterance(message);
//           utterance.rate = 1.2;
//           window.speechSynthesis.speak(utterance);
//         } else {
//           console.warn("Speech synthesis not available");
//         }
//       }
//     };

//     static getDerivedStateFromError(error) {
//       console.log("Error caught in getDerivedStateFromError:", error);
//       return { hasError: true };
//     }

//     componentDidCatch(error, errorInfo) {
//       console.log("Error caught in componentDidCatch:", error, errorInfo);
//       this.speakError(error);
//     }

//     render() {
//       if (this.state.hasError) {
//         console.log("Rendering error state");
//         return this.props.fallback || <h1>Something went wrong.</h1>;
//       }

//       return this.props.children;
//     }
//   };
// }
