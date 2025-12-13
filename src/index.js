// Universal entry point that works in both browser and Node.js environments

let ErrorNarrator;
let ErrorNarratorBrowser;
let ErrorNarratorNode;

// Check environment and set up appropriate implementation
if (typeof window !== "undefined" && typeof document !== "undefined") {
  // Browser environment - use dynamic import with immediate loading
  import("./browser.js")
    .then((module) => {
      ErrorNarratorBrowser = module.default;
      ErrorNarrator = module.default;
    })
    .catch((error) => {
      console.error(
        "[ErrorNarrator] Failed to load browser implementation:",
        error
      );
    });
} else if (
  typeof process !== "undefined" &&
  process.versions &&
  process.versions.node
) {
  // Node.js environment - use synchronous require
  try {
    const { default: NodeImpl } = require("./node.js");
    ErrorNarratorNode = NodeImpl;
    ErrorNarrator = NodeImpl;
  } catch (error) {
    console.error(
      "[ErrorNarrator] Failed to load Node.js implementation:",
      error
    );
  }
}

// Factory function to create ErrorNarrator instances
function createErrorNarrator(options = {}) {
  if (!ErrorNarrator) {
    throw new Error(
      "ErrorNarrator implementation not available for this environment. Make sure the appropriate implementation is loaded."
    );
  }
  return new ErrorNarrator(options);
}

// Async factory function for cases where you need to wait for module loading
async function createErrorNarratorAsync(options = {}) {
  // If already loaded, return immediately
  if (ErrorNarrator) {
    return new ErrorNarrator(options);
  }

  // If in browser environment, wait for dynamic import
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    try {
      const module = await import("./browser.js");
      ErrorNarrator = module.default;
      ErrorNarratorBrowser = module.default;
      return new ErrorNarrator(options);
    } catch (error) {
      console.error(
        "[ErrorNarrator] Failed to load browser implementation:",
        error
      );
      throw error;
    }
  }

  // If in Node.js environment, should already be loaded synchronously
  if (ErrorNarrator) {
    return new ErrorNarrator(options);
  }

  throw new Error(
    "ErrorNarrator implementation not available for this environment"
  );
}

// Global instance for quick setup
let globalInstance = null;

// Quick setup function
function setupErrorNarrator(options = {}) {
  if (!globalInstance) {
    globalInstance = createErrorNarrator(options);
  }
  return globalInstance;
}

// Async setup function
async function setupErrorNarratorAsync(options = {}) {
  if (!globalInstance) {
    globalInstance = await createErrorNarratorAsync(options);
  }
  return globalInstance;
}

// Convenience methods for global instance
function speak(message) {
  if (!globalInstance) {
    globalInstance = createErrorNarrator();
  }
  return globalInstance.speak(message);
}

function handleError(error) {
  if (!globalInstance) {
    globalInstance = createErrorNarrator();
  }
  return globalInstance.handleError(error);
}

function enable() {
  if (!globalInstance) {
    globalInstance = createErrorNarrator();
  }
  return globalInstance.enable();
}

function disable() {
  if (!globalInstance) {
    globalInstance = createErrorNarrator();
  }
  return globalInstance.disable();
}

function test(message) {
  if (!globalInstance) {
    globalInstance = createErrorNarrator();
  }
  return globalInstance.test(message);
}

// Default export should be the constructor/factory
export default ErrorNarrator || createErrorNarrator;

export {
  ErrorNarrator,
  ErrorNarratorBrowser,
  ErrorNarratorNode,
  createErrorNarrator,
  createErrorNarratorAsync,
  setupErrorNarrator,
  setupErrorNarratorAsync,
  speak,
  handleError,
  enable,
  disable,
  test,
};
