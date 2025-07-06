// Universal entry point that works in both browser and Node.js environments
import { Config } from "./config.js";
import { ErrorProcessor } from "./errorProcessor.js";

// Remove top-level await and use synchronous loading
let ErrorNarrator;
let ErrorNarratorBrowser;
let ErrorNarratorNode;

// Check environment and set up appropriate implementation
if (typeof window !== "undefined" && typeof document !== "undefined") {
  // Browser environment - use lazy loading
  const BrowserImpl = lazy(() => import("./browser.js"));
  ErrorNarratorBrowser = BrowserImpl;
  ErrorNarrator = BrowserImpl;
} else if (
  typeof process !== "undefined" &&
  process.versions &&
  process.versions.node
) {
  // Node.js environment - use synchronous require
  try {
    const NodeImpl = require("./node.js").default;
    ErrorNarratorNode = NodeImpl;
    ErrorNarrator = NodeImpl;
  } catch (error) {
    console.error(
      "[ErrorNarrator] Failed to load Node.js implementation:",
      error
    );
  }
}

// Lazy loading helper for browser
function lazy(importFn) {
  let modulePromise = null;
  let Module = null;

  return function LazyErrorNarrator(options = {}) {
    if (Module) {
      return new Module(options);
    }

    if (!modulePromise) {
      modulePromise = importFn().then((mod) => {
        Module = mod.default;
        return Module;
      });
    }

    // Return a proxy that delays initialization
    return new Proxy(
      {},
      {
        get(target, prop) {
          if (Module) {
            const instance = new Module(options);
            return instance[prop];
          }

          // Return a function that waits for the module to load
          return function (...args) {
            if (Module) {
              const instance = new Module(options);
              return instance[prop](...args);
            }

            return modulePromise.then((LoadedModule) => {
              const instance = new LoadedModule(options);
              return instance[prop](...args);
            });
          };
        },
      }
    );
  };
}

// Factory function to create ErrorNarrator instances
function createErrorNarrator(options = {}) {
  if (!ErrorNarrator) {
    throw new Error(
      "ErrorNarrator implementation not available for this environment"
    );
  }
  return new ErrorNarrator(options);
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
  Config,
  ErrorProcessor,
  createErrorNarrator,
  setupErrorNarrator,
  speak,
  handleError,
  enable,
  disable,
  test,
};
