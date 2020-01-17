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
                location: '../../../stubs/null.js'
              },
              {
                pattern: '^sweetalert',
                location: './stubs/null.js'
              },
              {
                pattern: 'misc/wordlist$',
                location: '../../../stubs/null.js'
              },
              {
                pattern: '^node-forge$',
                location: '../../../stubs/node-forge.js'
              }
            ]
          }
        ]
      ]
    }
  }
}
