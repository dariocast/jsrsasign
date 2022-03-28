const path = require("path")

module.exports = {
  entry: path.resolve(__dirname, "../src/jsrsasign-src.js"),
  output: {
    path: path.resolve(__dirname, "lib"),
    filename: "jsrsasign-test.js",
    library: "$",
    libraryTarget: "umd",
  },
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        use: "babel-loader",
      },
    ],
  },
  mode: "development",
  target: "node",
  optimization: {
    minimize: false,
    concatenateModules: false,
  },
  devtool: "inline-source-map"
}