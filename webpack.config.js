const path = require("path");

module.exports = [
  // Main build (Universal)
  {
    entry: "./src/index.js",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "index.js",
      library: {
        name: "ErrorNarrator",
        type: "umd",
        export: "default",
      },
      globalObject: "typeof self !== 'undefined' ? self : this",
      publicPath: "",
    },
    target: ["web", "es5"],
    mode: process.env.NODE_ENV === "production" ? "production" : "development",
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: [
                [
                  "@babel/preset-env",
                  {
                    targets: {
                      browsers: ["> 1%", "last 2 versions", "not ie <= 8"],
                    },
                    modules: false,
                  },
                ],
                "@babel/preset-react",
              ],
            },
          },
        },
      ],
    },
    externals: {
      say: "say",
      react: "react",
      "react-dom": "react-dom",
    },
    resolve: {
      extensions: [".js", ".jsx"],
      fallback: {
        path: false,
        fs: false,
        child_process: false,
      },
    },
    optimization: {
      usedExports: true,
      sideEffects: false,
    },
  },

  // React integration build (for integration/react path)
  {
    entry: "./integration/react.js",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "integration-react.js",
      library: {
        name: "ErrorNarratorReact",
        type: "umd",
      },
      globalObject: "typeof self !== 'undefined' ? self : this",
      publicPath: "",
    },
    target: "web",
    mode: process.env.NODE_ENV === "production" ? "production" : "development",
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: [
                [
                  "@babel/preset-env",
                  {
                    targets: {
                      browsers: ["> 1%", "last 2 versions", "not ie <= 8"],
                    },
                    modules: false,
                  },
                ],
                "@babel/preset-react",
              ],
            },
          },
        },
      ],
    },
    externals: {
      react: "react",
      "react-dom": "react-dom",
    },
    resolve: {
      extensions: [".js", ".jsx"],
      fallback: {
        path: false,
        fs: false,
        child_process: false,
      },
    },
    optimization: {
      usedExports: true,
      sideEffects: false,
    },
  },

  // Browser-specific build
  {
    entry: "./src/browser.js",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "browser.js",
      library: {
        name: "ErrorNarratorBrowser",
        type: "umd",
        export: "default",
      },
      globalObject: "typeof self !== 'undefined' ? self : this",
      publicPath: "",
    },
    target: "web",
    mode: process.env.NODE_ENV === "production" ? "production" : "development",
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: [
                [
                  "@babel/preset-env",
                  {
                    targets: {
                      browsers: ["> 1%", "last 2 versions", "not ie <= 8"],
                    },
                    modules: false,
                  },
                ],
              ],
            },
          },
        },
      ],
    },
    externals: {
      react: "react",
      "react-dom": "react-dom",
    },
    resolve: {
      extensions: [".js", ".jsx"],
      fallback: {
        path: false,
        fs: false,
        child_process: false,
      },
    },
    optimization: {
      usedExports: true,
      sideEffects: false,
    },
  },

  // Node-specific build
  {
    entry: "./src/node.js",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "node.js",
      library: {
        name: "ErrorNarratorBrowser",
        type: "umd",
        export: "default",
      },
      publicPath: "",
    },
    target: "node",
    mode: process.env.NODE_ENV === "production" ? "production" : "development",
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: [
                [
                  "@babel/preset-env",
                  {
                    targets: {
                      node: "12",
                    },
                    modules: false,
                  },
                ],
              ],
            },
          },
        },
      ],
    },
    externals: {
      say: "say",
    },
  },
];
