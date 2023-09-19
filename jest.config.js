module.exports = {
  moduleFileExtensions: ['js', 'jsx', 'json'],
  setupFilesAfterEnv: ['<rootDir>/enzyme.setup.js', '<rootDir>jest.setup.js'],
  testPathIgnorePatterns: ['@bitwarden/jslib', 'transpiled/'],
  transformIgnorePatterns: ['node_modules/(?!(cozy-ui))'],
  watchPathIgnorePatterns: ['node_modules'],
  moduleNameMapper: {
    // Force cozy-client resolving to use harvest's version of cozy-client
    // Can be removed when cozy-client's version in the workspace is > 14.4.0.
    // Since otherwise harvest tries to mock unexisting methods from
    // cozy-client/models/account (getContractSyncStatusFromAccount for ex)
    '^cozy-client$': '<rootDir>/node_modules/cozy-client/dist/index.js',
    '.(png|gif|jpe?g)$': '<rootDir>/jestHelpers/mocks/fileMock.js'
  }
}
