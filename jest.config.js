module.exports = {
  moduleFileExtensions: ['js', 'jsx', 'json'],
  setupFilesAfterEnv: ['<rootDir>enzyme.setup.js'],
  testPathIgnorePatterns: ['@bitwarden/jslib', 'transpiled/']
}
