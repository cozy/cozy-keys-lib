import WebVaultClient from './WebVaultClient'
import { Utils } from './@bitwarden/jslib/misc/utils'
import fs from 'fs'
import path from 'path'
import range from 'lodash/range'

jest.spyOn(Utils, 'init').mockImplementation(() => {})

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

  describe('import', () => {
    const client = new WebVaultClient('https://me.cozy.wtf')

    const fakeEncrypt = value => ({
      encryptedString: `encrypted<${value}>`
    })
    jest.spyOn(client, 'createOrUpdateCipher').mockImplementation(cipher =>
      Promise.resolve({
        ...cipher,
        login: {
          username: fakeEncrypt(cipher.login.username),
          password: fakeEncrypt(cipher.login.password),
          uris: cipher.login.uris.map(x => ({
            ...x,
            uri: fakeEncrypt(x.uri)
          }))
        }
      })
    )

    jest
      .spyOn(client, 'decrypt')
      .mockImplementation(cipher => Promise.resolve(cipher))

    jest.spyOn(client, 'saveCipher').mockResolvedValue()
    jest.spyOn(client, 'getByIdOrSearch')

    jest
      .spyOn(client.apiService, 'postImportCiphers')
      .mockImplementation(() => {})

    afterEach(() => {
      client.createOrUpdateCipher.mockClear()
      client.decrypt.mockClear()
      client.saveCipher.mockClear()
      client.getByIdOrSearch.mockReset()
      client.apiService.postImportCiphers.mockReset()
    })

    describe('when the imported cipher already exists', () => {
      const existingCipher = {
        id: 'existing-cipher',
        organizationId: null,
        folderId: null,
        type: 1,
        name: 'alan.com',
        notes: null,
        favorite: false,
        login: {
          uris: [
            {
              match: null,
              uri: 'https://alan.eu/login'
            }
          ],
          username: 'username',
          password: 'password',
          totp: null
        },
        collectionIds: null
      }

      beforeEach(() => {
        client.getByIdOrSearch.mockResolvedValue(existingCipher)
      })

      it("should add imported cipher's uris to existing cipher", async () => {
        const fileContent = fs.readFileSync(
          path.join(__dirname, './tests/exports/bitwarden.json')
        )
        await client.import(fileContent, 'bitwardenjson')
        expect(client.apiService.postImportCiphers).toHaveBeenCalledWith(
          expect.objectContaining({
            ciphers: [
              expect.objectContaining({
                login: expect.objectContaining({
                  uris: [
                    expect.objectContaining({
                      uri: 'encrypted<https://alan.eu/login>'
                    }),
                    expect.objectContaining({
                      uri: 'encrypted<https://alan.com>'
                    })
                  ]
                })
              })
            ]
          })
        )
      })
    })

    describe('when the imported cipher does not already exist', () => {
      beforeEach(() => {
        client.getByIdOrSearch.mockResolvedValue(null)
      })

      const exportedPasswords = [
        {
          filename: './tests/exports/bitwarden.json',
          format: 'bitwardenjson',
          nbCiphers: 1
        },
        {
          filename: './tests/exports/dashlane.json',
          format: 'dashlanejson',
          nbCiphers: 1
        },
        {
          filename: './tests/exports/googlechrome.csv',
          format: 'chromecsv',
          nbCiphers: 1
        },
        {
          filename: './tests/exports/keepass.csv',
          format: 'keepassxcsv',
          nbCiphers: 2
        }
      ]

      afterEach(() => {})

      for (const exportedPassword of exportedPasswords) {
        const { filename, format, nbCiphers } = exportedPassword
        it(`should create a new cipher [format: ${format}]`, async () => {
          const fileContent = fs
            .readFileSync(path.join(__dirname, filename))
            .toString()
          await client.import(fileContent, format)
          expect(client.createOrUpdateCipher).toHaveBeenCalledTimes(nbCiphers)
          expect(client.apiService.postImportCiphers).toHaveBeenCalledWith(
            expect.objectContaining({
              ciphers: range(nbCiphers).map(() => expect.any(Object))
            })
          )
        })
      }
    })

    describe('when given an unknown format', () => {
      it('should throw an error', async () => {
        const fileContent = fs.readFileSync(
          path.join(__dirname, './tests/exports/bitwarden.json')
        )
        await expect(
          client.import(fileContent, 'unknownformat')
        ).rejects.toThrow('IMPORT_UNKNOWN_FORMAT')
      })
    })

    describe('when the data imported is bad', () => {
      beforeEach(() => {
        jest
          .spyOn(client.importService, 'getImporter')
          .mockImplementation(() => ({
            parse: () => ({ success: false })
          }))
      })

      afterEach(() => {
        client.importService.getImporter.mockRestore()
      })

      it('should throw an error', async () => {
        await expect(client.import('{}', 'bitwardenjson')).rejects.toThrow(
          'IMPORT_FORMAT_ERROR'
        )
      })
    })
  })
})
