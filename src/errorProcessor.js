class ErrorProcessor {
  static humanizeError(error, config = {}) {
    const message = error.message || error.toString();
    const errorType = error.constructor.name;
    const stack = error.stack || "";

    if (config.debug) {
      console.log("[ErrorProcessor] Processing error:", { message, errorType });
    }

    // Enhanced error patterns with more specific matching
    const patterns = {
      // Function-related errors
      "is not a function": {
        regex: /(.+?)\s+is not a function/i,
        handler: (match) => {
          const variable = match[1]?.trim() || "variable";
          return `${variable} is not a function. Check if it's properly imported or defined.`;
        },
      },

      // Property access errors
      "Cannot read property": {
        regex: /Cannot read property '(.+?)' of (.+)/i,
        handler: (match) => {
          const property = match[1] || "property";
          const object = match[2] || "undefined object";
          return `Cannot read property ${property}. The ${object} might be null or undefined.`;
        },
      },

      "Cannot read properties": {
        regex: /Cannot read properties of (.+?) \(reading '(.+?)'\)/i,
        handler: (match) => {
          const object = match[1] || "undefined";
          const property = match[2] || "property";
          return `Cannot read property ${property} of ${object}. Check if the object exists.`;
        },
      },

      // Syntax errors
      "Unexpected token": {
        regex: /Unexpected token (.+?)(?:\s+in JSON at position (\d+))?/i,
        handler: (match) => {
          const token = match[1] || "token";
          const position = match[2];
          if (position) {
            return `JSON syntax error at position ${position}. Unexpected ${token}.`;
          }
          return `Syntax error: unexpected ${token}. Check for missing brackets, commas, or quotes.`;
        },
      },

      // Module/Import errors
      "Module not found": {
        regex: /Module not found: (.+)/i,
        handler: (match) => {
          return `Module not found. Check your import path and make sure the package is installed.`;
        },
      },

      // Network errors
      "Failed to fetch": {
        regex: /Failed to fetch/i,
        handler: () =>
          `Network error: Failed to fetch data. Check your internet connection or API endpoint.`,
      },

      "Internal server error": {
        regex: /Internal server error/i,
        handler: () => `Server error: An internal server error occurred.`,
      },

      // React-specific errors
      "Objects are not valid as a React child": {
        regex: /Objects are not valid as a React child/i,
        handler: () =>
          `React error: Cannot render an object directly. Use JSON.stringify or render object properties individually.`,
      },

      "Cannot update a component while rendering a different component": {
        regex: /Cannot update a component.*while rendering/i,
        handler: () =>
          `React error: State update during render. Move state updates to useEffect or event handlers.`,
      },

      // Hook errors
      "Invalid hook call": {
        regex: /Invalid hook call/i,
        handler: () =>
          `React hook error: Hooks can only be called at the top level of function components.`,
      },

      // Assignment errors
      "Assignment to constant variable": {
        regex: /Assignment to constant variable/i,
        handler: () =>
          `Cannot reassign a constant variable. Use let or var for variables that need to change.`,
      },

      // Type-specific errors by error type
      ReferenceError: {
        regex: /(.+?) is not defined/i,
        handler: (match) => {
          const variable = match[1] || "variable";
          return `Reference error: ${variable} is not defined. Check spelling and scope.`;
        },
      },

      TypeError: {
        regex: /.*/,
        handler: () =>
          `Type error: Operation performed on wrong data type. Check your variable types.`,
      },

      RangeError: {
        regex: /.*/,
        handler: () => `Range error: Value is outside the allowed range.`,
      },

      URIError: {
        regex: /.*/,
        handler: () => `URI error: Invalid URI format.`,
      },
    };

    // Try to match patterns
    for (const [patternName, patternConfig] of Object.entries(patterns)) {
      // Check if error type matches (for type-specific patterns)
      if (
        patternName === errorType ||
        message.toLowerCase().includes(patternName.toLowerCase())
      ) {
        const match = message.match(patternConfig.regex);
        if (match) {
          const humanized = patternConfig.handler(match);
          if (config.debug) {
            console.log(
              "[ErrorProcessor] Pattern matched:",
              patternName,
              "->",
              humanized
            );
          }
          return this.truncateMessage(humanized, config.maxMessageLength);
        }
      }
    }

    // Extract useful info from stack trace if available
    if (stack && config.includeLocation !== false) {
      const locationMatch = stack.match(/at (.+?):(\d+):(\d+)/);
      if (locationMatch) {
        const file = locationMatch[1]?.split("/").pop() || "unknown file";
        const line = locationMatch[2];
        const cleanMessage = this.cleanMessage(message);
        return this.truncateMessage(
          `${cleanMessage} in ${file} at line ${line}`,
          config.maxMessageLength
        );
      }
    }

    // Fallback: clean up the raw message
    const cleaned = this.cleanMessage(message);
    return this.truncateMessage(cleaned, config.maxMessageLength);
  }

  static cleanMessage(message) {
    return (
      message
        // Remove webpack/bundler noise
        .replace(/webpack:\/\/\/.*?!/g, "")
        .replace(/\.\//g, "")
        // Remove file paths that are too long
        .replace(/[^\s]*node_modules[^\s]*/g, "dependency")
        // Clean up special characters while preserving readability
        .replace(/[{}[\]]/g, " ")
        .replace(/[^\w\s.,!?:-]/g, " ")
        // Clean up extra whitespace
        .replace(/\s+/g, " ")
        .trim()
    );
  }

  static truncateMessage(message, maxLength = 150) {
    if (message.length <= maxLength) {
      return message;
    }
    return message.substring(0, maxLength - 3) + "...";
  }

  static getErrorSeverity(error) {
    const message = error.message || error.toString();
    const errorType = error.constructor.name;

    // Critical errors that should always be spoken
    const critical = [
      "ReferenceError",
      "SyntaxError",
      "Module not found",
      "Failed to fetch",
    ];

    // Warning-level errors
    const warnings = [
      "ResizeObserver loop limit exceeded",
      "Non-Error promise rejection",
    ];

    if (
      critical.some(
        (pattern) => errorType === pattern || message.includes(pattern)
      )
    ) {
      return "critical";
    }

    if (warnings.some((pattern) => message.includes(pattern))) {
      return "warning";
    }

    return "normal";
  }

  static shouldIgnoreError(error, config = {}) {
    const message = error.message || error.toString();

    // Always ignore certain browser-specific errors
    const alwaysIgnore = [
      "ResizeObserver loop limit exceeded",
      "Non-Error promise rejection captured with value",
      "Loading chunk",
      "ChunkLoadError",
    ];

    return alwaysIgnore.some((pattern) =>
      message.toLowerCase().includes(pattern.toLowerCase())
    );
  }
}

export { ErrorProcessor };
