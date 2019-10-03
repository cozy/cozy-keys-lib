const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin

const path = require('path')

module.exports = {
  entry: './src/WebVaultClient.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'cozy-keys.js',
    library: 'CozyKeys',
    libraryTarget: 'window'
  },
  plugins: [
    new BundleAnalyzerPlugin({
      openAnalyzer: false,
      defaultSizes: 'gzip',
      analyzerMode: 'static'
    })
  ],
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            sourceMaps: 'both',
            presets: [
              [
                'cozy-app',
                {
                  presetEnv: { modules: false },
                  transformRegenerator: false,
                  react: false
                }
              ]
            ],
            plugins: [
              '@babel/plugin-transform-runtime',
              [
                'import-redirect',
                {
                  root: ['./src/stubs'],
                  redirect: {
                    zxcvbn: 'zxcvbn'
                  }
                }
              ]
            ]
          }
        }
      }
    ]
  },
  devtool: 'source-map'
}
