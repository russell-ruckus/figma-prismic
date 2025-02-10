const path = require("path");

module.exports = {
  mode: "production",
  entry: {
    code: "./src/code.ts",
  },
  output: {
    filename: "code.js",
    path: path.resolve(__dirname, "dist"),
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.html$/,
        use: "raw-loader",
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  // Removed HtmlWebpackPlugin and HtmlInlineScriptPlugin since we don't need a generated index.html anymore.
};
