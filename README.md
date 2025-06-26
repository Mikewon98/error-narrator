# 🔊 Error Narrator

**Voice notifications for development errors - Never miss an error again!**

Error Narrator automatically speaks out loud when JavaScript errors occur during development, so you don't have to constantly watch the console. It uses text-to-speech to narrate errors in a human-friendly way, helping you catch issues faster and maintain your development flow.

## ✨ Features

- 🎯 **Automatic Error Detection** - Catches uncaught exceptions and unhandled promise rejections
- 🧠 **Smart Error Processing** - Converts technical errors into human-readable messages
- 🔄 **Queue Management** - Handles multiple errors without overwhelming you
- ⏱️ **Cooldown System** - Prevents spam from repeated errors
- 🎛️ **Highly Configurable** - Customize voice, rate, filters, and more
- 🌐 **Universal Support** - Works in browsers, Node.js, React, and webpack
- 📱 **Framework Integrations** - Built-in React components and webpack plugin

## 🚀 Quick Start

## Installation

```bash
npm install error-narrator
# or
yarn add error-narrator
# or
pnpm add error-narrator
```

For Node.js environments, you'll also need the `say` package:

```bash
npm install say
```

## Quick Start

### Browser (Vanilla JS)

```javascript
import ErrorNarrator from "error-narrator";

// Quick setup with defaults
const narrator = new ErrorNarrator();

// Test it out
narrator.test("Error narrator is working!");

// Manual error handling
try {
  someRiskyCode();
} catch (error) {
  narrator.handleError(error);
}
```

### Node.js

```javascript
const ErrorNarrator = require("error-narrator");

// Auto-setup global error handlers
const narrator = new ErrorNarrator({
  enabled: true,
  voice: "Alex", // macOS voice
  rate: 1.2,
});

// Test it
narrator.test("Node.js error narrator ready!");
```

### React Integration

```jsx
import React from "react";
import {
  ErrorNarratorProvider,
  useErrorNarrator,
} from "error-narrator/integration/react";

function App() {
  return (
    <ErrorNarratorProvider options={{ enabled: true, rate: 1.1 }}>
      <MyComponent />
    </ErrorNarratorProvider>
  );
}

function MyComponent() {
  const { handleError, test } = useErrorNarrator();

  const handleClick = () => {
    try {
      throw new Error("Demo error for testing");
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <div>
      <button onClick={handleClick}>Trigger Error</button>
      <button onClick={() => test("React integration working!")}>
        Test Voice
      </button>
    </div>
  );
}
```

## Configuration Options

```javascript
const narrator = new ErrorNarrator({
  enabled: true, // Enable/disable voice notifications
  voice: null, // Voice name (browser) or system voice (Node.js)
  rate: 1, // Speech rate (0.1 - 10)
  pitch: 1, // Speech pitch (0 - 2, browser only)
  volume: 1, // Speech volume (0 - 1, browser only)
  maxMessageLength: 100, // Maximum message length
  cooldownMs: 5000, // Cooldown between similar errors
  humanize: true, // Convert technical errors to human language
  fallbackToRaw: true, // Use raw error if humanization fails
  debug: false, // Enable debug logging

  filters: {
    ignorePatterns: [
      // Patterns to ignore
      "ResizeObserver loop limit exceeded",
      "Loading chunk",
    ],
    onlyPatterns: null, // Only speak errors matching these patterns
    errorTypes: [
      // Error types to handle
      "SyntaxError",
      "ReferenceError",
      "TypeError",
      "RangeError",
      "Error",
    ],
  },
});
```

## API Reference

### Core Methods

```javascript
// Create narrator instance
const narrator = new ErrorNarrator(options);

// Manual error handling
narrator.handleError(error);

// Speak custom message
narrator.speak("Custom message");

// Test the narrator
narrator.test("Test message");

// Control
narrator.enable();
narrator.disable();
narrator.clearQueue();

// Configuration
narrator.updateConfig({ rate: 1.5 });
narrator.getStatus();
```

### React Hook API

```javascript
const {
  narrator, // ErrorNarrator instance
  speak, // Speak custom message
  handleError, // Handle error manually
  enable, // Enable narrator
  disable, // Disable narrator
  test, // Test voice
  clearQueue, // Clear speech queue
  getStatus, // Get current status
  updateConfig, // Update configuration
} = useErrorNarrator();
```

## Error Humanization

Error Narrator automatically converts technical errors into human-readable messages:

| Original Error                                | Spoken Message                                                                                                |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `Cannot read property 'name' of undefined`    | "Cannot read property name of undefined. Check if the object exists."                                         |
| `fetch is not a function`                     | "fetch is not a function. Check if it's properly imported or defined."                                        |
| `Unexpected token '}' in JSON at position 45` | "JSON syntax error at position 45. Unexpected }."                                                             |
| `Module not found: ./nonexistent`             | "Module not found. Check your import path and make sure the package is installed."                            |
| `Objects are not valid as a React child`      | "React error: Cannot render an object directly. Use JSON.stringify or render object properties individually." |

## Framework Integrations

### React Error Boundary

```jsx
import {
  ErrorNarratorProvider,
  ErrorBoundary,
} from "error-narrator/integration/react";

function App() {
  return (
    <ErrorNarratorProvider options={{ enabled: true }}>
      <ErrorBoundary>
        <MyApp />
      </ErrorBoundary>
    </ErrorNarratorProvider>
  );
}
```

### Higher-Order Component

```jsx
import { withErrorNarration } from "error-narrator/integration/react";

const MyComponentWithNarration = withErrorNarration(MyComponent, {
  enabled: true,
  rate: 1.2,
});
```

### Webpack Plugin

```javascript
// webpack.config.js
const ErrorNarratorWebpackPlugin = require("error-narrator/integration/webpack");

module.exports = {
  plugins: [
    new ErrorNarratorWebpackPlugin({
      enabled: process.env.NODE_ENV === "development",
      voice: "Samantha",
      rate: 1.1,
    }),
  ],
};
```

## Advanced Usage

### Custom Error Processing

```javascript
import { ErrorProcessor } from "error-narrator";

// Check if error should be ignored
if (ErrorProcessor.shouldIgnoreError(error)) {
  return;
}

// Get humanized error message
const humanMessage = ErrorProcessor.humanizeError(error, config);

// Get error severity
const severity = ErrorProcessor.getErrorSeverity(error);
```

### Environment-Specific Setup

```javascript
// Browser-specific
import ErrorNarratorBrowser from "error-narrator/src/browser.js";
const narrator = new ErrorNarratorBrowser(options);

// Node.js-specific
const ErrorNarratorNode = require("error-narrator/src/node.js");
const narrator = new ErrorNarratorNode(options);
```

### Global Instance

```javascript
import { setupErrorNarrator, speak, handleError } from "error-narrator";

// Setup global instance
setupErrorNarrator({ enabled: true });

// Use global methods
speak("Global message");
handleError(new Error("Global error"));
```

## Platform-Specific Features

### Browser

- Uses Web Speech API
- Supports voice selection from available system voices
- Handles page visibility and focus states
- Automatic cleanup on page unload

### Node.js

- Uses `say` package for cross-platform TTS
- Supports macOS, Windows, and Linux
- Handles process events (uncaughtException, unhandledRejection)
- Optional process exit on uncaught exceptions

### Voice Options

**macOS**: Alex, Samantha, Victoria, Daniel, Fiona, and many more
**Windows**: Microsoft David, Microsoft Hazel, Microsoft Zira
**Linux**: Default espeak voice

## Examples

### Development Server Integration

```javascript
// server.js
const ErrorNarrator = require("error-narrator");

const narrator = new ErrorNarrator({
  enabled: process.env.NODE_ENV === "development",
  voice: "Alex",
  filters: {
    ignorePatterns: ["EADDRINUSE", "favicon.ico"],
  },
});

// Your server code...
```

### React Development

```jsx
// _app.js (Next.js) or App.js (Create React App)
import { ErrorNarratorProvider } from "error-narrator/integration/react";

export default function App({ Component, pageProps }) {
  return (
    <ErrorNarratorProvider
      options={{
        enabled: process.env.NODE_ENV === "development",
        rate: 1.1,
        maxMessageLength: 150,
      }}
    >
      <Component {...pageProps} />
    </ErrorNarratorProvider>
  );
}
```

### Testing Integration

```javascript
// test-setup.js
import { setupErrorNarrator } from "error-narrator";

if (process.env.NODE_ENV === "test") {
  setupErrorNarrator({
    enabled: false, // Disable during tests
    debug: true, // But enable debug logging
  });
}
```

## Troubleshooting

### Common Issues

**No voice output in browser:**

- Check if Web Speech API is supported
- Ensure page has user interaction (required by most browsers)
- Check browser permissions for speech synthesis

**No voice output in Node.js:**

- Install the `say` package: `npm install say`
- On Linux, install espeak: `sudo apt-get install espeak`
- On macOS, ensure system voices are available

**Errors not being caught:**

- Check if `autoSetup` is enabled (default: true)
- Verify error filters aren't too restrictive
- Enable debug mode to see what's happening

### Debug Mode

```javascript
const narrator = new ErrorNarrator({
  debug: true, // Enable detailed logging
});
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details.

## Changelog

### v1.0.0

- Initial release
- Browser and Node.js support
- React integration
- Webpack plugin
- Error humanization
- Queue management
- Cooldown system

## 🙋‍♂️ Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/mikewon98/error-narrator/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/mikewon98/error-narrator/discussions)
- 📧 **Email**: mikewon98@gmail.com

**Happy debugging! 🎉 Never miss an error again with Error Narrator.**
