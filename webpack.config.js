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
      fallback: {
        // For browser compatibility
        path: false,
        fs: false,
        child_process: false,
      },
    },
  },

  // React-specific build
  {
    entry: "./src/react/index.js",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "react.js",
      library: "ErrorNarratorReact",
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
              presets: ["@babel/preset-env", "@babel/preset-react"],
            },
          },
        },
      ],
    },
    externals: {
      react: "react",
    },
    resolve: {
      fallback: {
        path: false,
        fs: false,
        child_process: false,
      },
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
      fallback: {
        path: false,
        fs: false,
        child_process: false,
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
