import MicroEE from 'microee'

import eq from 'lodash/eq'
import get from 'lodash/get'
import orderBy from 'lodash/orderBy'
import groupBy from 'lodash/groupBy'

import { Utils } from './@bitwarden/jslib/misc/utils'

import { ApiService } from './@bitwarden/jslib/services/api.service'
import { AppIdService } from './@bitwarden/jslib/services/appId.service'
import { AuthService } from './@bitwarden/jslib/services/auth.service'
import { CipherService } from './@bitwarden/jslib/services/cipher.service'

import { CollectionService } from './@bitwarden/jslib/services/collection.service'
import { ContainerService } from './@bitwarden/jslib/services/container.service'
import { EnvironmentService } from './@bitwarden/jslib/services/environment.service'
import { FolderService } from './@bitwarden/jslib/services/folder.service'
import { I18nService } from './@bitwarden/jslib/services/i18n.service'
import { ImportService } from './@bitwarden/jslib/services/import.service'
import { NoopMessagingService } from './@bitwarden/jslib/services/noopMessaging.service'
import { PasswordGenerationService } from './@bitwarden/jslib/services/passwordGeneration.service'
import { PolicyService } from './@bitwarden/jslib/services/policy.service'
import { SearchService } from './@bitwarden/jslib/services/search.service'
import { SendService } from './@bitwarden/jslib/services/send.service'
import { SettingsService } from './@bitwarden/jslib/services/settings.service'
import { SyncService } from './@bitwarden/jslib/services/sync.service'
import { TokenService } from './@bitwarden/jslib/services/token.service'
import { UserService } from './@bitwarden/jslib/services/user.service'
import { VaultTimeoutService } from './@bitwarden/jslib/services/vaultTimeout.service'

import { WebCryptoFunctionService } from './@bitwarden/jslib/services/webCryptoFunction.service'

import { CipherType } from './@bitwarden/jslib/enums/cipherType'
import { KdfType } from './@bitwarden/jslib/enums/kdfType'

import { ImportCiphersRequest } from './@bitwarden/jslib/models/request/importCiphersRequest'
import { CipherRequest } from './@bitwarden/jslib/models/request/cipherRequest'
import { CipherString } from './@bitwarden/jslib/models/domain/cipherString'
import { SymmetricCryptoKey } from './@bitwarden/jslib/models/domain/symmetricCryptoKey'

import { KdfRequest } from './@bitwarden/jslib/models/request/kdfRequest'

import WebPlatformUtilsService from './WebPlatformUtilsService'
import HtmlStorageService from './HtmlStorageService'
import MemoryStorageService from './MemoryStorageService'
import { CryptoService } from './services/crypto.service'

import * as CozyUtils from './CozyUtils'
import logger from './logger'

Utils.init()

/**
 * Some password managers (Dashlane for example) can manage things
 * that when imported do not have  the login field. We do not support
 * them at the moment
 */
const isSupportedCipher = cipher => cipher.login

/**
 * Password vault
 *
 * ```
 * const instance = 'https://myuser.mycozy.cloud'
 * vault = WebVaultClient(instance)
 * await vault.unlock(masterPassword)
 * await vault.sync()
 * const all = vault.getAllDecrypted({type: CipherType.Login})
 * ```
 */

/**
 * @typedef {object} VaultData
 * @property {ApiService} apiService
 * @property {EnvironmentService} environmentService
 * @property {AuthService} authService
 * @property {SyncService} syncService
 * @property {CryptoService} cryptoService
 * @property {CipherService} cipherService
 * @property {UserService} userService
 * @property {CollectionService} collectionService
 * @property {PasswordGenerationService} passwordGenerationService
 * @property {ContainerService} containerService
 * @property {VaultTimeoutService} vaultTimeoutService
 * @property {ImportService} importService
 * @property {Utils} utils
 */

class WebVaultClient {
  /**
   * @constructor
   * @param {string} instance_or_email - Cozy instance URL or user email
   * @param {object} options - optional
   * @param {string} options.locale - two letters locale
   * @param {object} options.urls - urls of the bitwarden vault
   * @param {string} options.urls.base - Base URL of the for Bitwarden server
   * @param {string} options.urls.identity - URL of the identity server
   * @param {string} options.urls.api - URL of the api server
   * @param {string} options.urls.events - URL of the events server
   * @param {VaultData} vaultData - optional Vault related services that may be injected
   */
  constructor(
    instance_or_email,
    { urls, locale, unsafeStorage } = {},
    vaultData = undefined
  ) {
    this.instance = instance_or_email
    this.email = CozyUtils.getEmail(instance_or_email)

    if (urls) {
      this.urls = urls
    } else if (CozyUtils.isInstance(instance_or_email)) {
      this.urls = { base: `${instance_or_email}/bitwarden` }
    } else {
      this.urls = {}
    }

    this.locale = locale || 'en'
    this.init({ unsafeStorage }, vaultData)
  }

  createServices(unsafeStorage) {
    const messagingService = new NoopMessagingService()
    const i18nService = new I18nService(this.locale, './locales')
    const platformUtilsService = this.initPlatformUtilsService(
      i18nService,
      messagingService
    )
    const cryptoFunctionService = this.initCryptoFunctionService(
      platformUtilsService
    )
    const storageService = this.initStorageService(platformUtilsService)
    const secureStorageService = this.initSecureStorageService()
    const cryptoService = new CryptoService(
      storageService,
      unsafeStorage ? storageService : secureStorageService,
      cryptoFunctionService
    )
    const tokenService = new TokenService(storageService)
    const appIdService = new AppIdService(storageService)
    const apiService = new ApiService(
      tokenService,
      platformUtilsService,
      async expired => messagingService.send('logout', { expired: expired })
    )
    const userService = new UserService(tokenService, storageService)
    const policyService = new PolicyService(userService, storageService)
    const sendService = new SendService(
      cryptoService,
      userService,
      apiService,
      storageService,
      i18nService,
      cryptoFunctionService
    )
    const settingsService = new SettingsService(userService, storageService)
    let searchService = null
    const cipherService = new CipherService(
      cryptoService,
      userService,
      settingsService,
      apiService,
      storageService,
      i18nService,
      () => searchService
    )
    const folderService = new FolderService(
      cryptoService,
      userService,
      apiService,
      storageService,
      i18nService,
      cipherService
    )
    const collectionService = new CollectionService(
      cryptoService,
      userService,
      storageService,
      i18nService
    )
    searchService = new SearchService(cipherService, platformUtilsService)
    const vaultTimeoutService = new VaultTimeoutService(
      cipherService,
      folderService,
      collectionService,
      cryptoService,
      platformUtilsService,
      storageService,
      messagingService,
      searchService,
      userService,
      null
    )
    const syncService = new SyncService(
      userService,
      apiService,
      settingsService,
      folderService,
      cipherService,
      cryptoService,
      collectionService,
      storageService,
      messagingService,
      policyService,
      sendService,
      async expired => messagingService.send('logout', { expired })
    )
    const passwordGenerationService = new PasswordGenerationService(
      cryptoService,
      storageService,
      policyService
    )
    const containerService = new ContainerService(cryptoService)
    const authService = new AuthService(
      cryptoService,
      apiService,
      userService,
      tokenService,
      appIdService,
      i18nService,
      platformUtilsService,
      messagingService
    )
    const notificationsService = null
    const environmentService = new EnvironmentService(
      apiService,
      storageService,
      notificationsService
    )
    const importService = new ImportService(
      cipherService,
      folderService,
      apiService,
      i18nService,
      collectionService
    )

    return {
      apiService: apiService,
      environmentService: environmentService,
      authService: authService,
      syncService: syncService,
      cryptoService: cryptoService,
      cipherService: cipherService,
      userService: userService,
      collectionService: collectionService,
      passwordGenerationService: passwordGenerationService,
      containerService: containerService,
      vaultTimeoutService: vaultTimeoutService,
      importService: importService,
      utils: Utils
    }
  }

  /*
   * @private
   * Initialize the undelying libraries
   */
  init({ unsafeStorage }, vaultData) {
    vaultData = vaultData || this.createServices(unsafeStorage)

    this.apiService = vaultData.apiService
    this.environmentService = vaultData.environmentService
    this.authService = vaultData.authService
    this.syncService = vaultData.syncService
    this.cryptoService = vaultData.cryptoService
    this.cipherService = vaultData.cipherService
    this.userService = vaultData.userService
    this.collectionService = vaultData.collectionService
    this.passwordGenerationService = vaultData.passwordGenerationService
    this.containerService = vaultData.containerService
    this.vaultTimeoutService = vaultData.vaultTimeoutService
    this.importService = vaultData.importService
    this.Utils = vaultData.utils

    this.attachToGlobal()
    this.initFinished = this.environmentService.setUrls(this.urls)
    this.initFinished.then(() => this.emit('init', this))
  }

  initPlatformUtilsService(i18nService, messagingService) {
    return new WebPlatformUtilsService(i18nService, messagingService)
  }

  initCryptoFunctionService(platformUtilsService) {
    return new WebCryptoFunctionService(window, platformUtilsService)
  }

  initSecureStorageService() {
    return new MemoryStorageService()
  }

  initStorageService(platformUtilsService) {
    return new HtmlStorageService(platformUtilsService)
  }

  /**
   * Register the containerService in globals to be able to decrypt ciphers
   *
   * @private
   */
  attachToGlobal() {
    // Utils.global.bitwardenContainerService is used by the bitwarden jslib
    // to decrypt data. It is important that it is set to the current instance
    // before running any code that involves crypto, especially when there are
    // multiple WebVaultClient instances on the page. There are legitimate use
    // cases for creating multiple client instances over the lifetime of a
    // page. For example, the client can be created by the VaultContext
    // component, and this component could be mounted and unmounted several
    // times by a react app.
    Utils.global.bitwardenContainerService = this.containerService
  }

  /**
   * Is the vault locked?
   * It is locked if not initialized or if manually locked afterwards
   * @return {boolean}
   */
  async isLocked() {
    this.attachToGlobal()
    const isAuthed = await this.userService.isAuthenticated()
    const isLocked = this.vaultTimeoutService.isLocked()
    return !isAuthed || isLocked
  }

  /**
   * Lock the vault, forget the key and master password
   */
  async lock() {
    this.attachToGlobal()
    await this.initFinished
    const lock = await this.vaultTimeoutService.lock()
    this.emit('lock', this)
    return lock
  }

  /**
   * Login to the bitwarden server and fill the master password
   * for future use
   */
  async login(masterPassword) {
    this.attachToGlobal()
    await this.initFinished
    const login = await this.authService.logIn(this.email, masterPassword)
    await this.sync()
    this.emit('login', this)
    return login
  }

  /**
   * Change password, send new hash and keys using the bitwarden API
   * This method is for demo and test
   * It uses routes NOT implemented on cozy stack
   *
   * @param {string} currentMasterPassword - the current master password
   * @param {string} newMasterPassword - the new master password
   * @param {integer} newIterations - (optional) number of kdf iterations
   * @param {KdfType} newKdf - (optional) kdf algorithm, PBKDF2_SHA256 by default
   */
  async changePassword(
    currentMasterPassword,
    newMasterPassword,
    newIterations,
    newKdf
  ) {
    const {
      kdf,
      kdfIterations,
      currentPasswordHash,
      newPasswordHash,
      newEncryptionKey
    } = await this.computeNewHashAndKeys(
      currentMasterPassword,
      newMasterPassword,
      newIterations,
      newKdf
    )
    return this.bitwardenChangePassword(
      currentPasswordHash,
      newPasswordHash,
      newEncryptionKey,
      kdf,
      kdfIterations
    )
  }

  /**
   * Compute new hashes and encrypted keys for a password change
   * Does not change anything to the current instance
   * @param {string} currentMasterPassword - the current master password
   * @param {string} newMasterPassword - the new master password
   * @param {integer} newIterations - (optional) number of kdf iterations
   * @param {KdfType} newKdf - (optional) kdf algorithm, PBKDF2_SHA256 by default
   * @return {object}
   */
  async computeNewHashAndKeys(
    currentMasterPassword,
    newMasterPassword,
    newIterations,
    newKdf
  ) {
    const currentPasswordHash = await this.computeHashedPassword(
      currentMasterPassword
    )

    const kdf = newKdf || (await this.userService.getKdf())
    const kdfIterations =
      newIterations || (await this.userService.getKdfIterations())
    const newMasterKey = await this.computeMasterKey(
      newMasterPassword,
      kdfIterations,
      kdf
    )

    const newPasswordHash = await this.computeHashedPassword(
      newMasterPassword,
      newMasterKey
    )

    const currentEncryptionKey = await this.getEncryptionKey()
    const newEncryptionKey = await this.encryptEncryptionKey(
      currentEncryptionKey,
      newMasterKey
    )

    return {
      kdf,
      kdfIterations,
      currentPasswordHash,
      newPasswordHash,
      newEncryptionKey
    }
  }

  /**
   * Change password and encrypted keys using the Bitwarden APIs
   * @param {string} currentPasswordHash - current master password hash
   * @param {string} newPasswordHash - new master password hash
   * @param {SymmetricCryptoKey} encryptionKey - new encrypted encryption key
   * @param {KdfType} kdfType
   * @param {integer} kdfIterations
   */
  async bitwardenChangePassword(
    currentPasswordHash,
    newPasswordHash,
    encryptionKey,
    kdf,
    kdfIterations
  ) {
    const request = new KdfRequest()
    request.kdf = kdf
    request.kdfIterations = kdfIterations
    request.masterPasswordHash = currentPasswordHash
    request.newMasterPasswordHash = newPasswordHash
    request.key = encryptionKey.encryptedString
    const res = await this.apiService.postAccountKdf(request)
    if (res) this.emit('passwordChange', this)
    return res
  }

  /**
   * Manually compute a master key
   * @param {string} masterPassword
   * @param {integer} iterations - (optional) number of kdf iterations
   * @param {KdfType} kdf - (optional) kdf algorithm, PBKDF2_SHA256 by default
   * @return {string} hashed password for login
   */
  async computeMasterKey(masterPassword, iterations, kdf) {
    return await this.cryptoService.makeKey(
      masterPassword,
      this.email,
      kdf || KdfType.PBKDF2_SHA256,
      iterations
    )
  }

  /**
   * Manually compute a hashed password
   * Usefull for manual login or password change
   * @param {string} masterPassword
   * @param {SymmetricCryptoKey} masterKey - optional master key
   * @return {string} hashed password for login
   */
  async computeHashedPassword(masterPassword, masterKey) {
    return await this.cryptoService.hashPassword(
      masterPassword,
      masterKey || null
    )
  }

  /**
   * Get the Encryption Key
   * @return {SymmetricCryptoKey} the encryption AES key
   */
  async getEncryptionKey() {
    return await this.cryptoService.getEncKey()
  }

  /**
   * Get the Master Key
   * @return {SymmetricCryptoKey} the master key, password derivation
   */
  async getMasterKey() {
    return await this.cryptoService.getKey()
  }

  /**
   * @typedef EncryptionKey
   * @property {SymmetricCryptoKey} key - The encryption key
   * @property {CipherString} encryptedKey - The encrypted key
   *
   * Generate a new encryption key
   * @return {EncryptionKey} the generated key and its encrypted version
   */
  async generateEncryptionKey() {
    const encKey = await this.getEncryptionKey()
    if (!encKey) {
      throw new Error('NO_ENCRYPTION_KEY')
    }
    const [key, encryptedKey] = await this.cryptoService.makeEncKey(encKey)
    return { key, encryptedKey }
  }

  /**
   * Manually encrypt the encryption key
   * Usefull for a password change, with a new master key
   * @param {SymmetricCryptoKey} encryptionKey
   * @param {SymmetricCryptoKey} masterKey - optional
   * @return {CipherString} encrypted encryption key
   */
  async encryptEncryptionKey(encryptionKey, masterKey) {
    const key = masterKey || (await this.getMasterKey())
    const toEncrypt = encryptionKey.key
    const [, encrypted] = await this.cryptoService.buildEncKey(key, toEncrypt)
    return encrypted
  }

  /**
   * Unlock the vault, login if needed
   * This method will not download the vault if not done already.
   * See `sync()` for that
   * @param {string} masterPassword - the master password
   */
  async unlock(masterPassword) {
    await this.initFinished
    const isAuthed = await this.userService.isAuthenticated()
    const kdf = this.cryptoService.kdf
    const kdfIterations = this.cryptoService.kdfIterations
    const storedKeyHash = await this.cryptoService.getKeyHash()
    if (!isAuthed || !kdf || !storedKeyHash) {
      await this.login(masterPassword)
    } else {
      const key = await this.cryptoService.makeKey(
        masterPassword,
        this.email,
        kdf,
        kdfIterations
      )
      const keyHash = await this.cryptoService.hashPassword(
        this.masterPassword,
        key
      )
      if (storedKeyHash == keyHash) {
        await this.cryptoService.setKey(key)
      }
      this.emit('unlock_no_login', this)
    }
    this.sync()
    this.emit('unlock', this)
    return true
  }

  /**
   * Download new data from the bitwarden server
   *
   * This method should be called at least once
   */
  async sync() {
    await this.initFinished
    const sync = await this.syncService.fullSync()
    this.emit('sync', this)
    return sync
  }

  /**
   * Get all (encrypted) data from the local vault
   *
   * @param {object} options - optional
   * @param {integer} options.type - type of data to get, see `CipherType`
   * @return {[Cipher]} all ciphers in the vault, filtered by type if requested
   */
  async getAll({ type } = {}) {
    const all = await this.cipherService.getAll()
    return type ? all.filter(cipher => cipher.type == type) : all
  }

  /**
   * Get all (encrypted) logins from the local vault
   * @return {[Cipher]} all ciphers of type "Login" in the vault
   */
  async getAllLogins() {
    return this.getAll({ type: CipherType.Login })
  }

  /**
   * Get all data from the local vault and decrypt them
   *
   * If provided a type of cipher or an uri, will only return
   * matching ciphers.
   *
   * @param {object} options - optional
   * @param {integer} options.type - type of data to get, see `CipherType`
   * @param {string} options.uri - uri of the remote service
   * @return {[CipherView]} decrypted ciphers, filtered by type if requested
   */
  async getAllDecrypted({ type, uri } = {}) {
    this.attachToGlobal()
    if (uri) {
      const all = await this.cipherService.getAllDecryptedForUrl(uri)
      return type ? all.filter(c => c.type == type) : all
    } else {
      const all = await this.getAll({ type })
      return Promise.all(all.map(cipher => this.decrypt(cipher)))
    }
  }

  /**
   * Get all logins from the local vault and decrypt them
   * @return {[CipherView]} decrypted ciphers of type "Login"
   */
  async getAllDecryptedLogins() {
    return this.getAllDecrypted({ type: CipherType.Login })
  }

  /**
   * Get all decrypted ciphers for a set of match
   * @param {object} match
   * @param {CipherType} match.type - type of cipher
   * @param {string|RegExp} match.name - name of cipher
   * @param {string|RegExp} match.username - a login.username to match
   * @param {string|RegExp} match.uri - an login.uri to match
   * @return {CipherView[]}
   */
  async getAllDecryptedFor({ type, uri, username, name }) {
    const all = await this.getAllDecrypted({ type, uri })
    return all.filter(view => {
      if (username) {
        if (!view.login) return false
        if (!this.weakMatch(view.login.username, username)) return false
      }
      if (name) {
        if (!this.weakMatch(view.name, name)) return false
      }
      return true
    })
  }

  /**
   * Search a cipher, first by id
   * otherwise by a search forwarded to `getAllDecryptedFor`
   * and get the first one in the order asked
   * @param {integer} id - uuid of a cipher
   * @param {object} search - as described in `getAllDecryptedFor`
   * @param {Array|function|string} sort - given to lodash.sortBy
   * @return {Cipher} encrypted cipher
   */
  async getByIdOrSearch(id, search, sort) {
    if (id) {
      const cipher = await this.get(id)
      if (cipher) return cipher
    }
    if (search) {
      const all = await this.getAllDecryptedFor(search)
      const first = orderBy(all, sort)[0]
      const id = get(first, 'id')
      if (id) {
        const searchedCipher = await this.get(id)
        if (searchedCipher) return searchedCipher
      }
    }
    return null
  }

  /**
   * @private
   * test if two parameters match
   * @param {object} source
   * @param {string|number|boolean|RegExp|Array} compare
   * @return boolean
   */
  weakMatch(source, compare) {
    if (compare === null) return true
    if (source === null) return false
    if (compare instanceof Array) {
      return compare.find(c => this.weakMatch(source, c))
    } else if (compare instanceof RegExp) {
      return source.match(compare)
    } else {
      return eq(source, compare)
    }
  }

  /**
   * Get an encrypted cipher by its id
   * @param {string} id - uuid of the cipher
   * @return {Cipher}
   */
  async get(id) {
    return this.cipherService.get(id)
  }

  /**
   * Generate passwords
   * Default options:
   * ```
   * {
   *  length: 14,
   *  ambiguous: false,
   *  number: true,
   *  minNumber: 1,
   *  uppercase: true,
   *  minUppercase: 0,
   *  lowercase: true,
   *  minLowercase: 0,
   *  special: false,
   *  minSpecial: 1,
   * }
   * ```
   * @param {object} options
   * @return {string} a password
   */
  async generatePassword(options = {}) {
    await this.initFinished
    return this.passwordGenerationService.generatePassword(options)
  }

  /**
   * Encrypt a cipher
   * @param {CipherView} - cipher to encrypt
   * @return {Cipher} encrypted cipher
   */
  async encrypt(cipherView) {
    this.attachToGlobal()
    return this.cipherService.encrypt(cipherView)
  }

  /**
   * Decrypt a cipher
   * @param {Cipher} cipher
   * @return {CipherView} decrypted cipher
   */
  async decrypt(cipher) {
    this.attachToGlobal()
    return cipher.decrypt()
  }

  /**
   * Decrypt an encryption key, encrypted with the vault encryption key
   * @param {string} encryptedKey - The string-encoded encrypted key
   * @return {SymmetricCryptoKey} The encryption key
   */
  async decryptEncryptionKey(encryptedKey) {
    const encKey = await this.getEncryptionKey()
    if (!encKey) {
      throw new Error('NO_ENCRYPTION_KEY')
    }
    const cipher = new CipherString(encryptedKey)
    const decryptedBuffer = await this.cryptoService.decryptToBytes(
      cipher,
      encKey
    )
    return new SymmetricCryptoKey(decryptedBuffer)
  }

  /**
   * Encrypt a file
   * @param {ArrayBuffer} file - file to encrypt
   * @param {string} encryptedKey - the encrypted encryption key
   * @return {ArrayBuffer} encrypted file
   */
  async encryptFile(file, encryptedKey) {
    this.attachToGlobal()

    const encryptionKey = await this.decryptEncryptionKey(encryptedKey)
    return this.cryptoService.encryptToBytes(file, encryptionKey)
  }

  /**
   * Decrypt a file
   * @param {ArrayBuffer} encryptedFile - encrypted file
   * @param {string} encryptedKey - the encrypted decryption key
   * @return {ArrayBuffer} decrypted file
   */
  async decryptFile(encryptedFile, encryptedKey) {
    this.attachToGlobal()

    const decryptionKey = await this.decryptEncryptionKey(encryptedKey)
    return this.cryptoService.decryptFromBytes(encryptedFile, decryptionKey)
  }

  /**
   * Save a new or modified (encrypted) cipher to the server
   * @param {Cipher} - cipher to save
   */
  async saveCipher(cipher) {
    return this.cipherService.saveWithServer(cipher)
  }

  /**
   * Saves imported ciphers to the server
   * @param {Cipher} - cipher to save
   */
  async postImportCiphers(encryptedCiphersToSave) {
    const {
      true: existingCiphersToSave = [],
      false: newCiphersToSave = []
    } = groupBy(encryptedCiphersToSave, x => Boolean(x.id))

    if (newCiphersToSave.length > 0) {
      logger.info(`Bulk import of ${newCiphersToSave.length} ciphers`)
      const req = new ImportCiphersRequest()
      newCiphersToSave.forEach(cipher => {
        const cipherReq = new CipherRequest(cipher)
        req.ciphers.push(cipherReq)
      })
      await this.apiService.postImportCiphers(req)
    }

    if (existingCiphersToSave.length > 0) {
      logger.info(`1 by 1 import of ${existingCiphersToSave.length} ciphers`)
      for (let existingCipherToSave of existingCiphersToSave) {
        await this.saveCipher(existingCipherToSave)
      }
    }

    return {
      nbNewCiphers: newCiphersToSave.length,
      nbUpdatedCiphers: existingCiphersToSave.length
    }
  }

  /**
   * Delete a cipher by its id
   * @param {string} id - uuid of the cipher
   */
  async deleteCipher(id) {
    const realId = id.id ? id.id : id
    return this.cipherService.deleteWithServer(realId)
  }

  /**
   * Share a cipher with the cozy org
   * If the organization has multiples collections, share with all collections
   * @param {CipherView} cipherView - cipher to share
   */
  async shareWithCozy(cipherView) {
    this.attachToGlobal()
    const org = await this.getCozyOrg()
    if (cipherView.organizationId != org.id) {
      const cols = await this.getCollectionsForOrg(org)
      const colIds = cols.map(col => col.id)
      return this.cipherService.shareWithServer(cipherView, org.id, colIds)
    } else {
      return undefined
    }
  }

  /**
   * @private
   * Get All collections from an organization
   * @param {string|object} org - organization object or its uuid
   * @return {Collection} collections in this organization
   */
  async getCollectionsForOrg(org) {
    const id = org.id ? org.id : org
    const collections = await this.collectionService.getAll()
    return collections.filter(col => col.organizationId === id)
  }

  /**
   * @private
   * Get the Cozy organization from the vault
   * @return {Organization}
   */
  async getCozyOrg() {
    const orgs = await this.userService.getAllOrganizations()
    return orgs.filter(org => org.name.match(/^cozy\b/i))[0]
  }

  /**
   * Create a new (encrypted) cipher from an object.
   *
   * Handles organisation encrypting automatically: if the decryptedData has
   * an organisationId, the new cipher will be ciphered with the organisation
   * key of the organisation
   *
   * @param {object} decryptedData
   * @param {object} originalCipher
   * @return {Cipher}
   */
  async createOrUpdateCipher(decryptedData, originalCipher = null) {
    this.attachToGlobal()
    const orgId = decryptedData.organizationId
    const key = await (orgId
      ? this.cryptoService.getOrgKey(orgId)
      : this.cryptoService.getEncKey())
    return this.cipherService.encrypt(decryptedData, key, originalCipher)
  }

  /**
   * Create a new (encrypted) cipher from a js object shared with the cozy org
   * @param {object} decryptedData
   * @return {Cipher}
   */
  async createNewCozySharedCipher(decryptedData, originalCipher = null) {
    const org = await this.getCozyOrg()
    const cols = await this.getCollectionsForOrg(org)
    const colIds = cols.map(col => col.id)
    decryptedData.organizationId = org.id
    decryptedData.collectionIds = colIds
    return this.createOrUpdateCipher(decryptedData, originalCipher)
  }

  /**
   * Crude way to check if an import seems to have been done correctly
   *
   * Copy/pasted from ImportService::import
   */
  assertImportedCiphersSeemOK(importedCiphers) {
    const halfway = Math.floor(importedCiphers.length / 2)
    const last = importedCiphers.length - 1

    if (
      this.importService.badData(importedCiphers[0]) &&
      this.importService.badData(importedCiphers[halfway]) &&
      this.importService.badData(importedCiphers[last])
    ) {
      throw new Error('IMPORT_BAD_FILE_CONTENT')
    }
  }

  /**
   * Import ciphers contained in a file in a given format
   *
   * @param {string} fileContent - the raw content of the file being imported
   * @param {string} format - the format of the file (see ImportService for all available formats)
   */
  async import(fileContent, format) {
    const importer = this.importService.getImporter(format, false)

    if (!importer) {
      throw new Error('IMPORT_UNKNOWN_FORMAT')
    }

    const parseResult = await importer.parse(fileContent)

    if (!parseResult.success) {
      throw new Error('IMPORT_FORMAT_ERROR')
    }

    if (parseResult.ciphers.length > 0) {
      this.assertImportedCiphersSeemOK(parseResult.ciphers)
    }

    const supportedCiphers = parseResult.ciphers.filter(cipher =>
      isSupportedCipher(cipher)
    )
    logger.info(`Parsed ${parseResult.ciphers.length}`)
    logger.info(`Importing ${supportedCiphers.length} supported ciphers`)
    const ciphersToSave = await Promise.all(
      supportedCiphers.map(cipher => this.prepareCipherToImport(cipher))
    )

    const postImportRes = await this.postImportCiphers(ciphersToSave)
    return {
      ...postImportRes,
      nbParsedCiphers: parseResult.ciphers.length,
      nbSupportedCiphers: supportedCiphers.length
    }
  }

  async searchExistingCipher(cipher) {
    let encryptedExistingCipher
    // Since we search existing cipher by username, password and URI; and a
    // cipher being imported can have multiple URIs, we have to look for an
    // existing cipher for each URI. The getByIdOrSearch API may be better
    // and accepts an array of strings
    for (const uri of cipher.login.uris) {
      const search = {
        username: cipher.login.username,
        uri: uri._uri,
        type: CipherType.Login
      }

      logger.debug('Searching existing cipher with', search)
      const sort = [
        cipherView =>
          cipherView.login.password === cipher.login.password ? 0 : 1,
        'revisionDate'
      ]

      encryptedExistingCipher = await this.getByIdOrSearch(null, search, sort)
      logger.debug('Found potential matching cipher', encryptedExistingCipher)

      if (encryptedExistingCipher) {
        const decrypted = await this.decrypt(encryptedExistingCipher)
        if (decrypted.login.password == cipher.login.password) {
          logger.debug('Passwords are identical !')
          return encryptedExistingCipher
        } else {
          logger.debug('Passwords are different')
        }
      }
    }
  }

  async mergeCiphers(encryptedExistingCipher, cipher) {
    const decryptedExistingCipher = await this.decrypt(encryptedExistingCipher)

    for (const uri of cipher.login.uris) {
      const hasUri = decryptedExistingCipher.login.uris.find(
        existingUri =>
          existingUri.match === uri.match && existingUri.uri === uri.uri
      )

      if (!hasUri) {
        decryptedExistingCipher.login.uris.push(uri)
      }
    }

    logger.info('Merging ciphers', decryptedExistingCipher, cipher)
    const mergedCipher = await this.createOrUpdateCipher(
      decryptedExistingCipher,
      encryptedExistingCipher
    )
    logger.info('Merge result', mergedCipher)
    return mergedCipher
  }

  /**
   * Tries to find an existing cipher and merges given cipher into it
   *
   * The returned cipher has to be saved
   */
  async prepareCipherToImport(cipher) {
    logger.info('Preparing cipher to import')
    cipher.login.uris = cipher.login.uris || []

    let cipherToSave
    let encryptedExistingCipher = await this.searchExistingCipher(cipher)

    if (encryptedExistingCipher) {
      logger.info('Found existing cipher')
      cipherToSave = await this.mergeCiphers(encryptedExistingCipher, cipher)
    } else {
      logger.info('Creating a new cipher')
      cipherToSave = await this.createOrUpdateCipher(cipher)
    }

    return cipherToSave
  }

  /**
   * Imports a single cipher in the vault
   *
   * @param {CipherView} cipher - the cipher to import
   */
  async importCipher(cipher) {
    const cipherToSave = await this.prepareCipherToImport(cipher)
    await this.saveCipher(cipherToSave)
  }

  getImportOptions() {
    return {
      featured: this.importService.featuredImportOptions,
      regular: this.importService.regularImportOptions
    }
  }
}

MicroEE.mixin(WebVaultClient)

export default WebVaultClient
