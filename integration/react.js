// React integration for error-narrator
// This file provides easy setup for React applications

const ErrorNarrator = require("../src/browser");

class ReactErrorNarratorPlugin {
  constructor(options = {}) {
    this.options = {
      enabled: process.env.NODE_ENV === "development",
      autoInject: true,
      ...options,
    };
  }

  // For Create React App integration
  setupForCRA() {
    if (typeof window === "undefined") return;

    const narrator = new ErrorNarrator(this.options);

    // Attach to window for global access
    window.errorNarrator = narrator;

    // Setup console error interception
    const originalError = console.error;
    console.error = function (...args) {
      // Check if this looks like a React error
      const message = args.join(" ");
      if (
        message.includes("Warning:") ||
        message.includes("Error:") ||
        message.includes("Uncaught")
      ) {
        const error = new Error(message);
        narrator.handleError(error);
      }

      return originalError.apply(console, args);
    };

    return narrator;
  }

  // For manual integration
  create() {
    return new ErrorNarrator(this.options);
  }
}

// Auto-setup if in browser environment
if (typeof window !== "undefined" && typeof document !== "undefined") {
  const plugin = new ReactErrorNarratorPlugin();

  // Wait for DOM to be ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      plugin.setupForCRA();
    });
  } else {
    plugin.setupForCRA();
  }
}

module.exports = ReactErrorNarratorPlugin;

// import React from "react";
// import { ErrorProcessor } from "../src/errorProcessor";

// function createVoiceErrorBoundary(VoiceEngine) {
//   return class VoiceErrorBoundary extends React.Component {
//     constructor(props) {
//       super(props);
//       this.voiceEngine = new VoiceEngine(props.voiceOptions);
//       this.state = { hasError: false };
//     }

//     static getDerivedStateFromError(error) {
//       return { hasError: true };
//     }

//     componentDidCatch(error, errorInfo) {
//       if (process.env.NODE_ENV === "development") {
//         const humanMessage = ErrorProcessor.humanizeError(error);
//         this.voiceEngine.speak(`Development error: ${humanMessage}`);
//       }
//     }

//     render() {
//       if (this.state.hasError) {
//         return this.props.fallback || <h1>Something went wrong.</h1>;
//       }
//       return this.props.children;
//     }
//   };
// }

// export { createVoiceErrorBoundary };
