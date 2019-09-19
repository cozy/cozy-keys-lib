/*
 * This file is a modified version of /services/nodeEnvSecureStorage.service.ts
 * in https://github.com/bitwarden/cli which is licensed with the terms of the
 * Gnu Public License 3.0 (GPL 3.0)
 */

import SymmetricCryptoKey from './SymmetricCryptoKey'

import { Utils } from './@bitwarden/jslib/misc/utils'

export default class NodeEnvSecureStorageService {
  constructor(storageService, cryptoService) {
    this.storageService = storageService
    this.cryptoService = cryptoService
  }

  async get(key) {
    const value = await this.storageService.get(
      this.makeProtectedStorageKey(key)
    )
    if (value == null) {
      return null
    }
    const obj = await this.decrypt(value)
    return obj
  }

  async save(key, obj) {
    if (typeof obj !== 'string') {
      throw new Error('Only string storage is allowed.')
    }
    const protectedObj = await this.encrypt(obj)
    await this.storageService.save(
      this.makeProtectedStorageKey(key),
      protectedObj
    )
  }

  remove(key) {
    return this.storageService.remove(this.makeProtectedStorageKey(key))
  }

  async encrypt(plainValue) {
    const sessionKey = this.getSessionKey()
    if (sessionKey == null) {
      throw new Error('No session key available.')
    }
    const encValue = await this.cryptoService().encryptToBytes(
      Utils.fromB64ToArray(plainValue).buffer,
      sessionKey
    )
    if (encValue == null) {
      throw new Error("Value didn't encrypt.")
    }

    return Utils.fromBufferToB64(encValue)
  }

  async decrypt(encValue) {
    try {
      const sessionKey = this.getSessionKey()
      if (sessionKey == null) {
        return null
      }

      const decValue = await this.cryptoService().decryptFromBytes(
        Utils.fromB64ToArray(encValue).buffer,
        sessionKey
      )
      if (decValue == null) {
        // eslint-disable-next-line no-console
        console.log('Failed to decrypt.')
        return null
      }

      return Utils.fromBufferToB64(decValue)
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('Decrypt error.')
      return null
    }
  }

  getSessionKey() {
    try {
      if (process.env.BW_SESSION != null) {
        const sessionBuffer = Utils.fromB64ToArray(process.env.BW_SESSION)
          .buffer
        if (sessionBuffer != null) {
          const sessionKey = new SymmetricCryptoKey(sessionBuffer)
          if (sessionBuffer != null) {
            return sessionKey
          }
        }
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('Session key is invalid.')
    }

    return null
  }

  makeProtectedStorageKey(key) {
    return '__PROTECTED__' + key
  }
}
