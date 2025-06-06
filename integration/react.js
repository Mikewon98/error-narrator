import React from "react";
import { ErrorProcessor } from "../src/errorProcessor";

function createVoiceErrorBoundary(VoiceEngine) {
  return class VoiceErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.voiceEngine = new VoiceEngine(props.voiceOptions);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
      return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
      if (process.env.NODE_ENV === "development") {
        const humanMessage = ErrorProcessor.humanizeError(error);
        this.voiceEngine.speak(`Development error: ${humanMessage}`);
      }
    }

    render() {
      if (this.state.hasError) {
        return this.props.fallback || <h1>Something went wrong.</h1>;
      }
      return this.props.children;
    }
  };
}

export { createVoiceErrorBoundary };
