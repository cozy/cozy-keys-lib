module.exports = {
  moduleFileExtensions: ['js', 'jsx', 'json'],
  setupFilesAfterEnv: ['<rootDir>enzyme.setup.js', '<rootDir>jest.setup.js'],
  testPathIgnorePatterns: ['@bitwarden/jslib', 'transpiled/'],
  watchPathIgnorePatterns: ['node_modules']
}
