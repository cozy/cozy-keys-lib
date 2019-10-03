module.exports = {
  presets: ['cozy-app'],
  ignore: ['*.spec.js', '*.spec.jsx', ''],
  env: {
    transpilation: {
      presets: [['cozy-app', { lib: true }]],
      plugins: [
        '@babel/plugin-proposal-export-default-from',
        'inline-react-svg',
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
