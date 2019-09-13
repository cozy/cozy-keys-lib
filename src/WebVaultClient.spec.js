import WebVaultClient from './WebVaultClient'
import { Utils } from './@bitwarden/jslib/misc/utils'

jest.mock('./@bitwarden/jslib/misc/utils', () => {
  return {
    Utils: {
      init: jest.fn(),
      global: {}
    }
  }
})

describe('WebVaultClient', () => {
  describe('global instance', () => {
    it('should set the global container service variable', () => {
      const client = new WebVaultClient('https://me.cozy.wtf')
      expect(Utils.global.bitwardenContainerService).toBe(
        client.containerService
      )
    })

    it('should update the global container service variable when a new instance is created', () => {
      const client1 = new WebVaultClient('https://me.cozy.wtf')
      expect(Utils.global.bitwardenContainerService).toBe(
        client1.containerService
      )
      const client2 = new WebVaultClient('https://myoue.cozy.wtf')
      expect(Utils.global.bitwardenContainerService).toBe(
        client2.containerService
      )
    })

    it('should attach the current instances container service to the global context', () => {
      const client1 = new WebVaultClient('https://me.cozy.wtf')
      const client2 = new WebVaultClient('https://myoue.cozy.wtf')
      expect(Utils.global.bitwardenContainerService).toBe(
        client2.containerService
      )
      client1.attachToGlobal()
      expect(Utils.global.bitwardenContainerService).toBe(
        client1.containerService
      )
    })
  })

  describe('weakMatch', () => {
    let client
    beforeAll(() => {
      client = new WebVaultClient('https://me.cozy.wtf')
    })

    it('should match two identic strings', () => {
      const source = 'Hello'
      const compare = 'Hello'
      expect(client.weakMatch(source, compare)).toBeTruthy()
    })

    it('should not match two different strings', () => {
      const source = 'Hello'
      const compare = 'Bonjour'
      expect(client.weakMatch(source, compare)).toBeFalsy()
    })

    it('should match two identic numbers', () => {
      const source = 345
      const compare = 345
      expect(client.weakMatch(source, compare)).toBeTruthy()
    })

    it('should not match two different numbers', () => {
      const source = 345
      const compare = 999
      expect(client.weakMatch(source, compare)).toBeFalsy()
    })

    xit('should match two booleans', () => {
      const source = true
      const compare = true
      expect(client.weakMatch(source, compare)).toBeTruthy()
    })

    it('should not match different booleans', () => {
      const source = true
      const compare = false
      expect(client.weakMatch(source, compare)).toBeFalsy()
    })

    it('should not match a string and a number', () => {
      const source = '0'
      const compare = 0
      expect(client.weakMatch(source, compare)).toBeFalsy()
    })

    it('should not match a string with a boolean', () => {
      const source = 'Hello'
      const compare = true
      expect(client.weakMatch(source, compare)).toBeFalsy()
    })

    it('should match a string with an identic string inside an array', () => {
      const source = 'Hello'
      const compare = ['Bonjour', 'Hello', 'Ciao']
      expect(client.weakMatch(source, compare)).toBeTruthy()
    })

    it('should not match a string with an array of different strings', () => {
      const source = 'Hello'
      const compare = ['Bye', 'Salut', 'Arrivederci']
      expect(client.weakMatch(source, compare)).toBeFalsy()
    })

    it('should match a string with a matching regexp', () => {
      const source = 'Hello'
      const compare = /Hel(l)?o/
      expect(client.weakMatch(source, compare)).toBeTruthy()
    })

    it('should not match a string with a non-matching regexp', () => {
      const source = 'Hello'
      const compare = /Sal(l)?ut/
      expect(client.weakMatch(source, compare)).toBeFalsy()
    })
  })
})
