const path = require('path')

module.exports = {
  presets: ['cozy-app'],
  ignore: ['*.spec.js', '*.spec.jsx'],
  env: {
    transpilation: {
      presets: [['cozy-app', { lib: true }]],
      plugins: [
        '@babel/plugin-proposal-export-default-from',
        '@babel/plugin-proposal-export-namespace-from',
        'inline-react-svg',
        [
          'mock-imports',
          {
            redirects: [
              {
                pattern: '^zxcvbn$',
                location: path.resolve(__dirname, 'src/stubs/null.js')
              },
              {
                pattern: '^tldjs$',
                location: path.resolve(__dirname, 'src/stubs/null.js')
              },
              {
                pattern: '^sweetalert',
                location: path.resolve(__dirname, 'src/stubs/null.js')
              }
            ]
          }
        ]
      ]
    }
  }
}
