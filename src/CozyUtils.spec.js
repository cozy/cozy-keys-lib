import {
  getEmail,
  checkHasCiphers,
  checkHasInstalledExtension
} from './CozyUtils'
import { createMockClient } from 'cozy-client/dist/mock'

describe('CozyUtils', () => {
  describe('getEmail', () => {
    it('should leave as is real emails', () => {
      const email = 'eric@example.org'
      expect(getEmail(email)).toBe(email)
    })

    it('should convert instance to email', () => {
      const instance = 'https://my.example.org/hello'
      const email = 'me@my.example.org'
      expect(getEmail(instance)).toBe(email)
    })
  })

  describe('checkHasCiphers', () => {
    describe('when there are ciphers', () => {
      let client

      beforeEach(() => {
        client = createMockClient({
          remote: {
            'com.bitwarden.ciphers': [{ _id: 'cipher1' }, { _id: 'cipher2' }]
          }
        })
      })

      it('should return true', async () => {
        const hasCiphers = await checkHasCiphers(client)

        expect(hasCiphers).toBe(true)
      })
    })

    describe('when there is no cipher', () => {
      let client

      beforeEach(() => {
        client = createMockClient({
          remote: {
            'com.bitwarden.ciphers': []
          }
        })
      })

      it('should return false', async () => {
        const hasCiphers = await checkHasCiphers(client)

        expect(hasCiphers).toBe(false)
      })
    })

    describe('when there is an error while fetching ciphers', () => {
      let client

      beforeEach(() => {
        client = createMockClient({})
        client.query = jest.fn().mockRejectedValue({ message: 'mock error' })
      })

      it('should return false', async () => {
        const hasCiphers = await checkHasCiphers(client)

        expect(hasCiphers).toBe(false)
      })
    })
  })

  describe('checkHasInstalledExtension', () => {
    describe('when the extension has been installed', () => {
      let client

      beforeEach(() => {
        client = createMockClient({})
        client.stackClient.fetchJSON = jest.fn().mockResolvedValue({
          rows: [
            { _id: 'io.cozy.settings.bitwarden', extension_installed: true }
          ]
        })
      })

      it('should return true', async () => {
        const hasInstalledExtension = await checkHasInstalledExtension(client)

        expect(hasInstalledExtension).toBe(true)
      })
    })

    describe('when the extension has not been installed', () => {
      let client

      beforeEach(() => {
        client = createMockClient({})
        client.stackClient.fetchJSON = jest.fn().mockResolvedValue({
          rows: [
            { _id: 'io.cozy.settings.bitwarden', extension_installed: false }
          ]
        })
      })

      it('should return false', async () => {
        const hasInstalledExtension = await checkHasInstalledExtension(client)

        expect(hasInstalledExtension).toBe(false)
      })
    })

    describe('when there is an error while fetching settings', () => {
      let client

      beforeEach(() => {
        client = createMockClient({})
        client.stackClient.fetchJSON = jest
          .fn()
          .mockRejectedValue({ message: 'mock error' })
      })

      it('should return false', async () => {
        const hasInstalledExtension = await checkHasInstalledExtension(client)

        expect(hasInstalledExtension).toBe(false)
      })
    })
  })
})
