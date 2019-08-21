//const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const path = require('path');

module.exports = {
  entry: './src/CozyUtils.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'cozy-auth.js',
    library: 'CozyAuth',
    libraryTarget: 'window'
  },
  node: false,
  resolve: {
    alias: {
      'big-integer': path.resolve(__dirname, 'src/null.js'),
      'tldjs': path.resolve(__dirname, 'src/null.js'),
      'lunr': path.resolve(__dirname, 'src/null.js'),
      'zxcvbn': path.resolve(__dirname, 'src/null.js'),
      'node-forge': path.resolve(__dirname, 'src/null.js'),
      'url': path.resolve(__dirname, 'src/null.js'),
      'path': path.resolve(__dirname, 'src/null.js'),
      'wordlist': path.resolve(__dirname, 'src/null.js'),
      '../misc/wordlist': path.resolve(__dirname, 'src/null.js'),
      'process': path.resolve(__dirname, 'src/null.js'),
    }
  },
  //plugins: [new BundleAnalyzerPlugin({
  //  openAnalyzer: false,
  //  defaultSizes: 'gzip',
  //  analyzerMode: 'static'
  //})],
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            "presets": [["cozy-app", { "presetEnv": { "modules": false }, "transformRegenerator": false, "react": false }]],
            "plugins": ["@babel/plugin-transform-runtime"]
          }
        }
      }
    ]
  }
};