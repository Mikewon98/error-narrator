// Universal entry point that works in both browser and Node.js environments
import { Config } from "./config.js";
import { ErrorProcessor } from "./errorProcessor.js";

let ErrorNarrator;
let ErrorNarratorBrowser;
let ErrorNarratorNode;

// Check environment and load appropriate implementation
if (typeof window !== "undefined" && typeof document !== "undefined") {
  // Browser environment
  try {
    const { default: BrowserImpl } = await import("./browser.js");
    ErrorNarratorBrowser = BrowserImpl;
    ErrorNarrator = ErrorNarratorBrowser;
  } catch (error) {
    console.error(
      "[ErrorNarrator] Failed to load browser implementation:",
      error
    );
  }
} else if (
  typeof process !== "undefined" &&
  process.versions &&
  process.versions.node
) {
  // Node.js environment
  try {
    const NodeImpl = require("./node.js");
    ErrorNarratorNode = NodeImpl;
    ErrorNarrator = ErrorNarratorNode;
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

// Export everything
export default ErrorNarrator;
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

// // Universal entry point that works in both browser and Node.js environments

// import { Config } from "./config.js";
// import { ErrorProcessor } from "./errorProcessor.js";

// let ErrorNarrator;
// let ErrorNarratorBrowser;
// let ErrorNarratorNode;

// // Dynamic imports for environment-specific implementations
// if (typeof window !== "undefined") {
//   // Browser environment
//   try {
//     ErrorNarratorBrowser =  (await import("./browser.js")).default;
//     ErrorNarrator = ErrorNarratorBrowser;
//   } catch (error) {
//     console.error(
//       "[ErrorNarrator] Failed to load browser implementation:",
//       error
//     );
//   }
// } else {
//   // Node.js environment
//   try {
//     ErrorNarratorNode = require("./node.js");
//     ErrorNarrator = ErrorNarratorNode;
//   } catch (error) {
//     console.error(
//       "[ErrorNarrator] Failed to load Node.js implementation:",
//       error
//     );
//   }
// }

// // Factory function to create ErrorNarrator instances
// function createErrorNarrator(options = {}) {
//   if (!ErrorNarrator) {
//     throw new Error(
//       "ErrorNarrator implementation not available for this environment"
//     );
//   }
//   return new ErrorNarrator(options);
// }

// // Global instance for quick setup
// let globalInstance = null;

// // Quick setup function
// function setupErrorNarrator(options = {}) {
//   if (!globalInstance) {
//     globalInstance = createErrorNarrator(options);
//   }
//   return globalInstance;
// }

// // Convenience methods for global instance
// function speak(message) {
//   if (!globalInstance) {
//     globalInstance = createErrorNarrator();
//   }
//   return globalInstance.speak(message);
// }

// function handleError(error) {
//   if (!globalInstance) {
//     globalInstance = createErrorNarrator();
//   }
//   return globalInstance.handleError(error);
// }

// function enable() {
//   if (!globalInstance) {
//     globalInstance = createErrorNarrator();
//   }
//   return globalInstance.enable();
// }

// function disable() {
//   if (!globalInstance) {
//     globalInstance = createErrorNarrator();
//   }
//   return globalInstance.disable();
// }

// function test(message) {
//   if (!globalInstance) {
//     globalInstance = createErrorNarrator();
//   }
//   return globalInstance.test(message);
// }

// // Export everything
// export default ErrorNarrator;
// export {
//   ErrorNarrator,
//   ErrorNarratorBrowser,
//   ErrorNarratorNode,
//   Config,
//   ErrorProcessor,
//   createErrorNarrator,
//   setupErrorNarrator,
//   speak,
//   handleError,
//   enable,
//   disable,
//   test,
// };
