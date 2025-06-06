import React from "react";
import ErrorNarrator from "../browser";

export function createVoiceErrorBoundary() {
  return class VoiceErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false };
      console.log("VoiceErrorBoundary initialized");

      // Add global error handlers
      if (typeof window !== "undefined") {
        window.addEventListener("error", this.handleError);
        window.addEventListener("unhandledrejection", this.handleError);
      }
    }

    componentWillUnmount() {
      // Clean up event listeners
      if (typeof window !== "undefined") {
        window.removeEventListener("error", this.handleError);
        window.removeEventListener("unhandledrejection", this.handleError);
      }
    }

    handleError = (event) => {
      console.log("Error caught in handleError:", event);
      const error = event.error || event.reason || event;
      this.speakError(error);
    };

    speakError = (error) => {
      console.log("Speaking error:", error);
      if (process.env.NEXT_PUBLIC_NODE_ENV === "development") {
        if (window.speechSynthesis) {
          const message = error.message || "An error occurred";
          console.log("Speaking error message:", message);
          const utterance = new SpeechSynthesisUtterance(message);
          utterance.rate = 1.2;
          window.speechSynthesis.speak(utterance);
        } else {
          console.warn("Speech synthesis not available");
        }
      }
    };

    static getDerivedStateFromError(error) {
      console.log("Error caught in getDerivedStateFromError:", error);
      return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
      console.log("Error caught in componentDidCatch:", error, errorInfo);
      this.speakError(error);
    }

    render() {
      if (this.state.hasError) {
        console.log("Rendering error state");
        return this.props.fallback || <h1>Something went wrong.</h1>;
      }

      return this.props.children;
    }
  };
}
