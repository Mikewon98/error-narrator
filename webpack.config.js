const path = require("path");

module.exports = [
  // Main build (Universal)
  {
    entry: "./src/index.js",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "index.js",
      library: "ErrorNarrator",
      libraryTarget: "umd",
      globalObject: "typeof self !== 'undefined' ? self : this",
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
      // Don't bundle these - let the consuming project handle them
      say: "say",
      react: "react",
    },
    resolve: {
      extensions: [".js", ".jsx"],
      fallback: {
        path: false,
        fs: false,
        child_process: false,
      },
      alias: {
        // Help webpack resolve the correct modules
        "error-narrator": path.resolve(__dirname, "src"),
      },
    },
  },

  // React integration build (for integration/react path)
  {
    entry: "./integration/react.js",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "integration-react.js",
      library: "ErrorNarratorReact",
      libraryTarget: "umd",
      globalObject: "typeof self !== 'undefined' ? self : this",
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
      alias: {
        // Help webpack resolve the correct modules
        "error-narrator": path.resolve(__dirname, "src"),
      },
    },
  },

  // Webpack integration build
  {
    entry: "./integration/webpack.js",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "integration-webpack.js",
      library: {
        type: "umd",
      },
      globalObject: "this",
    },
    target: "node",
    mode: process.env.NODE_ENV || "production",
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env"],
            },
          },
        },
      ],
    },
  },

  // Browser-specific build
  {
    entry: "./src/browser.js",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "browser.js",
      library: "ErrorNarratorBrowser",
      libraryTarget: "umd",
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
              presets: ["@babel/preset-env"],
            },
          },
        },
      ],
    },
    resolve: {
      extensions: [".js", ".jsx"],
      fallback: {
        path: false,
        fs: false,
        child_process: false,
      },
      alias: {
        // Help webpack resolve the correct modules
        "error-narrator": path.resolve(__dirname, "src"),
      },
    },
  },

  // Node-specific build
  {
    entry: "./src/node.js",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "node.js",
      library: "ErrorNarratorNode",
      libraryTarget: "commonjs2",
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
