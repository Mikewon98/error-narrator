const path = require("path");

class ErrorNarratorWebpackPlugin {
  constructor(options = {}) {
    this.options = {
      enabled: process.env.NODE_ENV === "development",
      voice: null,
      rate: 1,
      cooldownMs: 3000,
      ...options,
    };
  }

  apply(compiler) {
    if (!this.options.enabled) return;

    const pluginName = "ErrorNarratorWebpackPlugin";

    // Hook into compilation errors
    compiler.hooks.done.tap(pluginName, (stats) => {
      if (stats.hasErrors()) {
        const errors = stats.compilation.errors;
        errors.forEach((error) => {
          this.speakError(error);
        });
      }
    });

    // Hook into runtime errors by injecting client code
    compiler.hooks.compilation.tap(pluginName, (compilation) => {
      compilation.hooks.htmlWebpackPluginBeforeHtmlProcessing?.tap(
        pluginName,
        (data) => {
          // Inject error narrator script
          const scriptTag = `
            <script>
              (function() {
                if (typeof window !== 'undefined') {
                  const script = document.createElement('script');
                  script.src = '${this.getClientScriptPath()}';
                  document.head.appendChild(script);
                }
              })();
            </script>
          `;
          data.html = data.html.replace("</head>", scriptTag + "</head>");
          return data;
        }
      );
    });
  }

  speakError(error) {
    const message = this.humanizeWebpackError(error);

    // For Node.js environment during build
    if (typeof require !== "undefined") {
      try {
        const say = require("say");
        say.speak(`Build error: ${message}`);
      } catch (e) {
        console.log(`🗣️  Build Error: ${message}`);
      }
    }
  }

  humanizeWebpackError(error) {
    const message = error.message || error.toString();

    // Common webpack error patterns
    if (message.includes("Module not found")) {
      return "Module not found. Check your import paths.";
    }

    if (message.includes("Syntax error")) {
      return "Syntax error detected in your code.";
    }

    if (message.includes("Cannot resolve")) {
      return "Cannot resolve module. Check if the file exists.";
    }

    if (message.includes("Unexpected token")) {
      return "Unexpected token. Check for missing brackets or commas.";
    }

    // Clean up and truncate the message
    return message.replace(/\n/g, " ").replace(/\s+/g, " ").substring(0, 100);
  }

  getClientScriptPath() {
    // Return path to the built browser script
    return "/node_modules/error-narrator/dist/browser.js";
  }
}

// Client injection script template
const CLIENT_SCRIPT_TEMPLATE = `
(function() {
  if (typeof window === 'undefined') return;
  
  const config = ${JSON.stringify(this.options)};
  
  // Import the browser voice engine
  import('error-narrator/dist/browser.js').then(({ BrowserVoiceEngine }) => {
    const voiceEngine = new BrowserVoiceEngine(config);
    
    // Set up error listeners
    window.addEventListener('error', (event) => {
      const message = event.error?.message || 'Runtime error occurred';
      voiceEngine.speak('Runtime error: ' + message.substring(0, 50));
    });

    window.addEventListener('unhandledrejection', (event) => {
      const message = event.reason?.message || 'Promise rejection';
      voiceEngine.speak('Promise error: ' + message.substring(0, 50));
    });
  });
})();
`;

module.exports = ErrorNarratorWebpackPlugin;
