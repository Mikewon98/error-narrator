// Webpack plugin for error-narrator
// Provides build-time error narration and runtime injection

class ErrorNarratorWebpackPlugin {
  constructor(options = {}) {
    this.options = {
      enabled: process.env.NODE_ENV === "development",
      speakBuildErrors: true,
      speakWarnings: false,
      injectRuntime: true,
      runtimeOptions: {},
      ...options,
    };

    this.narrator = null;
  }

  initializeNarrator() {
    if (!this.narrator) {
      const ErrorNarrator = require("../src/node");
      this.narrator = new ErrorNarrator({
        enabled: this.options.enabled,
        ...this.options.runtimeOptions,
      });
    }
    return this.narrator;
  }

  apply(compiler) {
    if (!this.options.enabled) return;

    const pluginName = "ErrorNarratorWebpackPlugin";

    // Handle compilation errors
    compiler.hooks.done.tap(pluginName, (stats) => {
      if (!this.options.speakBuildErrors) return;

      const narrator = this.initializeNarrator();

      // Handle errors
      if (stats.hasErrors()) {
        stats.compilation.errors.forEach((error) => {
          // Clean up webpack-specific noise from error messages
          const cleanError = this.cleanWebpackError(error);
          narrator.handleError(cleanError);
        });
      }

      // Handle warnings if enabled
      if (this.options.speakWarnings && stats.hasWarnings()) {
        stats.compilation.warnings.forEach((warning) => {
          const cleanWarning = this.cleanWebpackError(warning);
          narrator.handleError(cleanWarning);
        });
      }
    });

    // Inject runtime error narrator into bundles
    if (this.options.injectRuntime) {
      compiler.hooks.emit.tapAsync(pluginName, (compilation, callback) => {
        // Find main entry chunks
        const entryChunks = Array.from(compilation.chunks).filter((chunk) =>
          chunk.isOnlyInitial()
        );

        entryChunks.forEach((chunk) => {
          chunk.files.forEach((filename) => {
            if (filename.endsWith(".js")) {
              const asset = compilation.assets[filename];
              const source = asset.source();

              // Inject error narrator setup at the beginning
              const injectedCode = this.generateInjectionCode();
              const newSource = injectedCode + "\n" + source;

              compilation.assets[filename] = {
                source: () => newSource,
                size: () => newSource.length,
              };
            }
          });
        });

        callback();
      });
    }

    // Handle fatal compilation errors
    compiler.hooks.failed.tap(pluginName, (error) => {
      const narrator = this.initializeNarrator();
      narrator.handleError(error);
    });
  }

  cleanWebpackError(error) {
    let message = error.message || error.toString();

    // Remove webpack-specific paths and noise
    message = message
      .replace(/webpack:\/\/\/.*?!/g, "")
      .replace(/\s+at\s+.*?webpack.*?\n/g, "")
      .replace(/Module build failed.*?:/g, "Build error:")
      .replace(/\n\s*\n/g, "\n")
      .trim();

    // Create a clean error object
    const cleanError = new Error(message);
    cleanError.name = error.name || "WebpackError";

    return cleanError;
  }

  generateInjectionCode() {
    const options = JSON.stringify({
      enabled: this.options.enabled,
      autoSetup: true,
      ...this.options.runtimeOptions,
    });

    return `
// ErrorNarrator Runtime Injection
(function() {
  if (typeof window !== 'undefined') {
    try {
      // Dynamic import for modern browsers
      if (typeof import === 'function') {
        import('error-narrator').then(function(module) {
          var ErrorNarrator = module.default || module;
          window.errorNarrator = new ErrorNarrator(${options});
        }).catch(function(err) {
          console.warn('[ErrorNarrator] Failed to load:', err);
        });
      } else {
        // Fallback for older environments
        console.warn('[ErrorNarrator] Dynamic imports not supported');
      }
    } catch (e) {
      console.warn('[ErrorNarrator] Injection failed:', e);
    }
  }
})();`;
  }

  // Static helper for easy webpack config integration
  static configure(webpackConfig, options = {}) {
    const plugin = new ErrorNarratorWebpackPlugin(options);

    if (!webpackConfig.plugins) {
      webpackConfig.plugins = [];
    }

    webpackConfig.plugins.push(plugin);

    return webpackConfig;
  }
}

// Export for both CommonJS and ES modules
module.exports = ErrorNarratorWebpackPlugin;
module.exports.default = ErrorNarratorWebpackPlugin;

// const path = require("path");

// class ErrorNarratorWebpackPlugin {
//   constructor(options = {}) {
//     this.options = {
//       enabled: process.env.NODE_ENV === "development",
//       voice: null,
//       rate: 1,
//       cooldownMs: 3000,
//       ...options,
//     };
//   }

//   apply(compiler) {
//     if (!this.options.enabled) return;

//     const pluginName = "ErrorNarratorWebpackPlugin";

//     // Hook into compilation errors
//     compiler.hooks.done.tap(pluginName, (stats) => {
//       if (stats.hasErrors()) {
//         const errors = stats.compilation.errors;
//         errors.forEach((error) => {
//           this.speakError(error);
//         });
//       }
//     });

//     // Hook into runtime errors by injecting client code
//     compiler.hooks.compilation.tap(pluginName, (compilation) => {
//       compilation.hooks.htmlWebpackPluginBeforeHtmlProcessing?.tap(
//         pluginName,
//         (data) => {
//           // Inject error narrator script
//           const scriptTag = `
//             <script>
//               (function() {
//                 if (typeof window !== 'undefined') {
//                   const script = document.createElement('script');
//                   script.src = '${this.getClientScriptPath()}';
//                   document.head.appendChild(script);
//                 }
//               })();
//             </script>
//           `;
//           data.html = data.html.replace("</head>", scriptTag + "</head>");
//           return data;
//         }
//       );
//     });
//   }

//   speakError(error) {
//     const message = this.humanizeWebpackError(error);

//     // For Node.js environment during build
//     if (typeof require !== "undefined") {
//       try {
//         const say = require("say");
//         say.speak(`Build error: ${message}`);
//       } catch (e) {
//         console.log(`🗣️  Build Error: ${message}`);
//       }
//     }
//   }

//   humanizeWebpackError(error) {
//     const message = error.message || error.toString();

//     // Common webpack error patterns
//     if (message.includes("Module not found")) {
//       return "Module not found. Check your import paths.";
//     }

//     if (message.includes("Syntax error")) {
//       return "Syntax error detected in your code.";
//     }

//     if (message.includes("Cannot resolve")) {
//       return "Cannot resolve module. Check if the file exists.";
//     }

//     if (message.includes("Unexpected token")) {
//       return "Unexpected token. Check for missing brackets or commas.";
//     }

//     // Clean up and truncate the message
//     return message.replace(/\n/g, " ").replace(/\s+/g, " ").substring(0, 100);
//   }

//   getClientScriptPath() {
//     // Return path to the built browser script
//     return "/node_modules/error-narrator/dist/browser.js";
//   }
// }

// // Client injection script template
// const CLIENT_SCRIPT_TEMPLATE = `
// (function() {
//   if (typeof window === 'undefined') return;

//   const config = ${JSON.stringify(this.options)};

//   // Import the browser voice engine
//   import('error-narrator/dist/browser.js').then(({ BrowserVoiceEngine }) => {
//     const voiceEngine = new BrowserVoiceEngine(config);

//     // Set up error listeners
//     window.addEventListener('error', (event) => {
//       const message = event.error?.message || 'Runtime error occurred';
//       voiceEngine.speak('Runtime error: ' + message.substring(0, 50));
//     });

//     window.addEventListener('unhandledrejection', (event) => {
//       const message = event.reason?.message || 'Promise rejection';
//       voiceEngine.speak('Promise error: ' + message.substring(0, 50));
//     });
//   });
// })();
// `;

// module.exports = ErrorNarratorWebpackPlugin;
