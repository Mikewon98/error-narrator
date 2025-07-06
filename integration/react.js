import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// Create ErrorNarrator context
const ErrorNarratorContext = createContext(null);

// Provider component
export function ErrorNarratorProvider({
  children,
  options = {},
  onError = null,
}) {
  const narratorRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    // Only initialize on client-side
    if (typeof window === "undefined") return;

    let isMounted = true;

    const initializeNarrator = async () => {
      try {
        // Use dynamic import with proper error handling
        const { default: ErrorNarratorBrowser } = await import(
          "../src/browser.js"
        );

        if (!isMounted) return;

        narratorRef.current = new ErrorNarratorBrowser({
          autoSetup: true,
          ...options,
        });

        setIsInitialized(true);

        if (options.debug) {
          console.log("[ErrorNarratorProvider] Initialized successfully");
        }
      } catch (error) {
        console.error("[ErrorNarratorProvider] Failed to initialize:", error);
        setInitError(error);
        if (onError) {
          onError(error);
        }
      }
    };

    initializeNarrator();

    // Cleanup function
    return () => {
      isMounted = false;
      if (narratorRef.current) {
        narratorRef.current.disable();
        narratorRef.current.clearQueue();
      }
    };
  }, []);

  // Update config when options change
  useEffect(() => {
    if (narratorRef.current && isInitialized) {
      narratorRef.current.updateConfig(options);
    }
  }, [options, isInitialized]);

  const contextValue = {
    narrator: narratorRef.current,
    isInitialized,
    initError,
    speak: (message) => {
      if (narratorRef.current) {
        return narratorRef.current.speak(message);
      }
      console.warn("[ErrorNarrator] Not initialized yet");
    },
    handleError: (error) => {
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
    test: (message) => {
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
    updateConfig: (newConfig) => {
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
