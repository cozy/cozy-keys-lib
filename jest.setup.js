/* eslint-disable no-console */

const ignoreOnConditions = (originalWarn, ignoreConditions) => {
  return function(...args) {
    const msg = args[0]
    if (ignoreConditions.some(condition => condition(msg))) {
      return
    }
    originalWarn.apply(this, args)
  }
}

const callAndThrow = (fn, errorMessage) => {
  return function() {
    fn.apply(this, arguments)
    throw new Error(errorMessage)
  }
}

const ignoredErrors = {
  'mocked error': {
    reason: 'Mocked error',
    matcher: message => message.includes('mock error')
  }
}

console.error = ignoreOnConditions(
  callAndThrow(
    console.error,
    'console.error should not be called during tests'
  ),
  Object.values(ignoredErrors).map(x => x.matcher)
)
