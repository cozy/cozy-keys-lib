import MicroEE from 'microee'

class MockWebVaultClient {
  constructor() {
    this.locked = true
  }

  isLocked() {
    return this.locked
  }

  unlock() {
    this.locked = false
    this.emit('unlock')
  }

  lock() {
    this.locked = true
    this.emit('lock')
  }
}

MicroEE.mixin(MockWebVaultClient)

export default MockWebVaultClient
