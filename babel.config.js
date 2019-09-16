module.exports = {
  presets: ['cozy-app'],
  ignore: ['*.spec.js', '*.spec.jsx'],
  env: {
    transpilation: {
      presets: [['cozy-app', { lib: true }]],
      plugins: [
        '@babel/plugin-proposal-export-default-from',
        '@babel/plugin-proposal-export-namespace-from',
        'inline-react-svg'
      ]
    }
  }
}
