// Next.js integration for error-narrator
// Provides both client-side and server-side error handling

const path = require("path");

class NextJSErrorNarratorPlugin {
  constructor(options = {}) {
    this.options = {
      enabled: process.env.NODE_ENV === "development",
      clientSide: true,
      serverSide: true,
      ...options,
    };
  }

  // Webpack plugin for Next.js
  apply(compiler) {
    if (!this.options.enabled) return;

    compiler.hooks.done.tap("ErrorNarratorPlugin", (stats) => {
      if (stats.hasErrors()) {
        const ErrorNarrator = require("../src/node");
        const narrator = new ErrorNarrator(this.options);

        stats.compilation.errors.forEach((error) => {
          narrator.handleError(error);
        });
      }
    });
  }

  // Next.js config helper
  static withErrorNarrator(nextConfig = {}, options = {}) {
    const plugin = new NextJSErrorNarratorPlugin(options);

    return {
      ...nextConfig,
      webpack: (config, context) => {
        // Add our plugin
        config.plugins.push(plugin);

        // Add client-side error handling
        if (context.isClient && options.clientSide !== false) {
          config.entry = async () => {
            const entries =
              (await nextConfig.webpack?.(config, context)?.entry) ||
              config.entry;

            // Inject error narrator into client bundle
            if (entries["main.js"]) {
              entries["main.js"] = [
                path.resolve(__dirname, "./client-setup.js"),
                ...entries["main.js"],
              ];
            }

            return entries;
          };
        }

        // Call original webpack config if it exists
        if (typeof nextConfig.webpack === "function") {
          return nextConfig.webpack(config, context);
        }

        return config;
      },
    };
  }
}

// Client-side setup script (referenced above)
const clientSetupScript = `
// Auto-injected ErrorNarrator client setup
if (typeof window !== 'undefined') {
  import('error-narrator').then(({ default: ErrorNarrator }) => {
    const narrator = new ErrorNarrator({
      enabled: process.env.NODE_ENV === 'development',
      autoSetup: true
    });
    
    // Attach to window for debugging
    window.errorNarrator = narrator;
    
    // Hook into Next.js error reporting
    if (window.next && window.next.router) {
      window.next.router.events.on('routeChangeError', (err) => {
        narrator.handleError(err);
      });
    }
  });
}
`;

// Write client setup file
const fs = require("fs");
const clientSetupPath = path.join(__dirname, "client-setup.js");
if (!fs.existsSync(clientSetupPath)) {
  fs.writeFileSync(clientSetupPath, clientSetupScript);
}

module.exports = NextJSErrorNarratorPlugin;

// export function withVoiceErrors(nextConfig = {}) {
//   return {
//     ...nextConfig,
//     webpack: (config, { dev, isServer }) => {
//       if (dev && !isServer) {
//         // Inject error handling into the client bundle
//         config.entry = async () => {
//           const entries = await originalEntry();
//           entries["main.js"].unshift("./error-narrator/client-inject.js");
//           return entries;
//         };
//       }
//       return config;
//     },
//   };
// }
