# 🔊 Error Narrator

**Voice notifications for development errors - Never miss an error again!**

Error Narrator automatically speaks out loud when JavaScript errors occur during development, so you don't have to constantly watch the console. It uses text-to-speech to narrate errors in a human-friendly way, helping you catch issues faster and maintain your development flow.

## ✨ Features

- 🎯 **Smart Error Processing** - Converts technical errors into human-readable messages
- 🔄 **Universal Support** - Works in Node.js, browsers, React, Next.js, and more
- ⚡ **Intelligent Filtering** - Prevents spam with cooldowns and pattern filtering
- 🎛️ **Highly Configurable** - Customize voice, rate, filtering, and behavior
- 🚀 **Easy Integration** - Drop-in solution with zero configuration needed
- 🔇 **Development Only** - Automatically disabled in production
- 📦 **React Integration** - Built-in Error Boundaries and hooks
- 🎨 **Queue Management** - Handles multiple errors gracefully

## 🚀 Quick Start

### Installation

```bash
npm install error-narrator
# or
yarn add error-narrator
# or
pnpm add error-narrator
```

### Basic Usage

```javascript
import { setupErrorNarrator } from "error-narrator";

// Auto-setup with default configuration
setupErrorNarrator();

// That's it! Errors will now be spoken out loud
```

### Test It

```javascript
import { test } from "error-narrator";

// Test the narrator
test("Error narrator is working!");

// Trigger a test error
setTimeout(() => {
  throw new Error("This is a test error");
}, 1000);
```

## 📚 Usage Examples

### Browser/Vanilla JavaScript

```javascript
import ErrorNarrator from "error-narrator";

const narrator = new ErrorNarrator({
  enabled: true,
  voice: null, // Use system default
  rate: 1,
  pitch: 1,
  volume: 1,
  maxMessageLength: 100,
  cooldownMs: 5000,
});

// Manual error handling
try {
  riskyOperation();
} catch (error) {
  narrator.handleError(error);
}

// Speak custom messages
narrator.speak("Build completed successfully!");
```

### React Integration

#### Error Boundary Approach

```jsx
import React from "react";
import { ErrorNarratorProvider } from "error-narrator/react";

function App() {
  return (
    <ErrorNarratorProvider
      options={{
        enabled: process.env.NODE_ENV === "development",
        rate: 1.2,
        maxMessageLength: 80,
      }}
      fallback={({ error }) => <div>Something went wrong: {error.message}</div>}
    >
      <YourAppComponents />
    </ErrorNarratorProvider>
  );
}
```

#### Hook Approach

```jsx
import React from "react";
import { useErrorNarrator } from "error-narrator/react";

function MyComponent() {
  const { handleError, speak, test } = useErrorNarrator({
    enabled: true,
    rate: 1.1,
  });

  const handleAsyncOperation = async () => {
    try {
      await fetchData();
      speak("Data loaded successfully!");
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <div>
      <button onClick={handleAsyncOperation}>Load Data</button>
      <button onClick={() => test("Testing narrator")}>Test Voice</button>
    </div>
  );
}
```

### Next.js Integration

```javascript
// pages/_app.js or app/layout.js
import { setupErrorNarrator } from "error-narrator";

// Setup for the entire application
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  setupErrorNarrator({
    enabled: true,
    filters: {
      ignorePatterns: ["ResizeObserver loop limit exceeded", "Loading chunk"],
    },
  });
}

export default function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
```

### Node.js Integration

```javascript
const { ErrorNarratorNode } = require("error-narrator");

const narrator = new ErrorNarratorNode({
  enabled: process.env.NODE_ENV === "development",
  voice: "Alex", // macOS voice
  rate: 1.0,
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  narrator.handleError(error);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (error) => {
  narrator.handleError(error);
});
```

## ⚙️ Configuration

### Complete Configuration Options

```javascript
const config = {
  // Basic settings
  enabled: process.env.NODE_ENV === "development",
  voice: null, // Use system default or specify voice name
  rate: 1, // Speech rate (0.1 - 10)
  pitch: 1, // Speech pitch (0 - 2)
  volume: 1, // Speech volume (0 - 1)

  // Message settings
  maxMessageLength: 100, // Truncate long messages
  cooldownMs: 5000, // Minimum time between speeches

  // Error processing
  humanize: true, // Convert technical errors to human-friendly
  fallbackToRaw: true, // Use raw message if humanization fails
  includeLocation: true, // Include file/line info when available

  // Filtering
  filters: {
    // Patterns to ignore
    ignorePatterns: [
      "ResizeObserver loop limit exceeded",
      "Non-Error promise rejection captured",
      "Loading chunk",
    ],

    // Only allow these patterns (if specified)
    onlyPatterns: null,

    // Error types to handle
    errorTypes: [
      "SyntaxError",
      "ReferenceError",
      "TypeError",
      "RangeError",
      "Error",
    ],
  },

  // Development settings
  debug: true, // Enable debug logging
};
```

### Environment-Specific Configuration

```javascript
// Development vs Production
const isDevelopment = process.env.NODE_ENV === "development";

const config = {
  enabled: isDevelopment,
  debug: isDevelopment,
  maxMessageLength: isDevelopment ? 150 : 50,
  cooldownMs: isDevelopment ? 3000 : 10000,
};
```

## 🎯 Error Processing Examples

Error Narrator converts technical JavaScript errors into human-friendly messages:

| Original Error                                | Spoken Message                                                                                                |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `Cannot read property 'name' of undefined`    | "Cannot read property name of undefined. Check if the object exists."                                         |
| `fetch is not a function`                     | "fetch is not a function. Check if it's properly imported or defined."                                        |
| `Unexpected token '}' in JSON at position 45` | "JSON syntax error at position 45. Unexpected }."                                                             |
| `Module not found: ./nonexistent`             | "Module not found. Check your import path and make sure the package is installed."                            |
| `Objects are not valid as a React child`      | "React error: Cannot render an object directly. Use JSON.stringify or render object properties individually." |

## 🔧 API Reference

### Core Methods

#### `setupErrorNarrator(options)`

Quick setup with global instance.

```javascript
import { setupErrorNarrator } from "error-narrator";
setupErrorNarrator({ rate: 1.2 });
```

#### `createErrorNarrator(options)`

Create a new instance.

```javascript
import { createErrorNarrator } from "error-narrator";
const narrator = createErrorNarrator({ enabled: true });
```

#### `speak(message)`

Speak a custom message.

```javascript
import { speak } from "error-narrator";
speak("Custom notification message");
```

#### `handleError(error)`

Manually handle an error.

```javascript
import { handleError } from "error-narrator";
try {
  riskyCode();
} catch (error) {
  handleError(error);
}
```

### Instance Methods

#### `narrator.speak(message)`

Queue a message to be spoken.

#### `narrator.handleError(error)`

Process and potentially speak an error.

#### `narrator.test(message?)`

Test the narrator with a sample message.

#### `narrator.enable()`

Enable the narrator.

#### `narrator.disable()`

Disable the narrator and clear queue.

#### `narrator.updateConfig(newConfig)`

Update configuration dynamically.

#### `narrator.getStatus()`

Get current status and configuration.

```javascript
const status = narrator.getStatus();
console.log(status);
// {
//   enabled: true,
//   initialized: true,
//   speaking: false,
//   queueLength: 0,
//   config: { ... }
// }
```

#### `narrator.clearQueue()`

Clear the speech queue and stop current speech.

### React Components & Hooks

#### `<ErrorNarratorProvider>`

Wrap your app with voice error handling.

```jsx
<ErrorNarratorProvider
  options={{ rate: 1.2 }}
  fallback={<ErrorFallback />}
  onError={(error, errorInfo) => console.log(error)}
  captureGlobalErrors={true}
>
  <App />
</ErrorNarratorProvider>
```

#### `useErrorNarrator(options)`

Hook for functional components.

```jsx
const { speak, handleError, test, updateConfig, getStatus, narrator } =
  useErrorNarrator({ enabled: true });
```

#### `<ErrorNarratorDebug>`

Development helper component (only shows in development).

```jsx
<ErrorNarratorDebug options={{ rate: 1.5 }} />
```

## 🔍 Filtering & Cooldowns

### Smart Cooldown System

Error Narrator implements intelligent cooldowns to prevent spam:

- **Global Cooldown**: Minimum time between any speeches
- **Error-Specific Cooldown**: Longer cooldowns for repeated identical errors
- **Escalating Cooldowns**: Repeated errors get progressively longer cooldowns

### Pattern Filtering

```javascript
const config = {
  filters: {
    // Ignore these patterns
    ignorePatterns: [
      "ResizeObserver loop limit exceeded",
      "Loading chunk",
      "Non-Error promise rejection",
    ],

    // Only allow these patterns (whitelist mode)
    onlyPatterns: ["ReferenceError", "TypeError", "SyntaxError"],

    // Specific error types to handle
    errorTypes: ["Error", "TypeError", "ReferenceError"],
  },
};
```

## 🎨 Voice Customization

### Browser Voices

```javascript
// List available voices
const voices = window.speechSynthesis.getVoices();
console.log(voices.map((v) => v.name));

// Use specific voice
const narrator = new ErrorNarrator({
  voice: "Google UK English Female",
  rate: 1.2,
  pitch: 1.1,
  volume: 0.8,
});
```

### Node.js Voices (macOS)

```javascript
const narrator = new ErrorNarratorNode({
  voice: "Alex", // macOS built-in voice
  rate: 1.0,
});

// Available voices on macOS: Alex, Alice, Allison, Ava, Belle, etc.
```

## 🚀 Integration Examples

### Webpack Development

```javascript
// webpack.config.js
module.exports = {
  // ... other config
  plugins: [
    // Add error narrator in development
    process.env.NODE_ENV === "development" && {
      apply(compiler) {
        compiler.hooks.done.tap("ErrorNarrator", () => {
          const { speak } = require("error-narrator");
          speak("Build completed");
        });
      },
    },
  ].filter(Boolean),
};
```

### Express.js Error Handling

```javascript
const express = require("express");
const { ErrorNarratorNode } = require("error-narrator");

const app = express();
const narrator = new ErrorNarratorNode({
  enabled: process.env.NODE_ENV === "development",
});

// Error handling middleware
app.use((error, req, res, next) => {
  narrator.handleError(error);
  res.status(500).json({ error: "Internal Server Error" });
});
```

### Jest Testing Integration

```javascript
// jest.setup.js
import { setupErrorNarrator } from "error-narrator";

if (process.env.ENABLE_ERROR_NARRATOR === "true") {
  setupErrorNarrator({
    enabled: true,
    maxMessageLength: 50,
    cooldownMs: 1000,
  });
}
```

## 🔧 Development & Debugging

### Debug Mode

Enable debug mode to see detailed logging:

```javascript
const narrator = new ErrorNarrator({
  debug: true,
  enabled: true,
});

// Console output will show:
// [ErrorNarrator] Config initialized: {...}
// [ErrorNarrator] Handling error: {...}
// [ErrorNarrator] Speaking with settings: {...}
```

### Development Helper

Use the debug component in React:

```jsx
import { ErrorNarratorDebug } from "error-narrator/react";

function App() {
  return (
    <div>
      <YourApp />
      <ErrorNarratorDebug /> {/* Only shows in development */}
    </div>
  );
}
```

### Manual Testing

```javascript
import { test, handleError } from "error-narrator";

// Test basic functionality
test("Error narrator is working!");

// Test error processing
handleError(new Error("Test error message"));

// Test different error types
handleError(new ReferenceError("testVariable is not defined"));
handleError(new TypeError("Cannot read property 'name' of undefined"));
```

## 📱 Browser Compatibility

- **Chrome/Edge**: Full support with Web Speech API
- **Firefox**: Full support with Web Speech API
- **Safari**: Full support with Web Speech API
- **Mobile**: Limited support (depends on device TTS)

## 🖥️ Node.js Compatibility

- **macOS**: Full support with built-in `say` command
- **Windows**: Requires additional TTS software
- **Linux**: Requires `espeak` or similar TTS software

## ⚡ Performance Considerations

- Messages are queued and processed sequentially
- Automatic truncation of long error messages
- Intelligent cooldowns prevent performance impact
- Minimal memory footprint with cleanup on disable

## 🔒 Production Safety

Error Narrator is designed to be safe for production:

- Automatically disabled when `NODE_ENV !== 'development'`
- Graceful fallbacks when TTS is unavailable
- No impact on application performance when disabled
- Safe error handling prevents narrator from breaking your app

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for details.

## 📄 License

MIT License - see LICENSE file for details.

## 🙋‍♂️ Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/mikewon98/error-narrator/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/mikewon98/error-narrator/discussions)
- 📧 **Email**: mikewon98@gmail.com

**Happy debugging! 🎉 Never miss an error again with Error Narrator.**
