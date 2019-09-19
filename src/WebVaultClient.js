import MicroEE from 'microee'

import eq from 'lodash/eq'
import get from 'lodash/get'
import orderBy from 'lodash/orderBy'

import { Utils } from './@bitwarden/jslib/misc/utils'

import { ApiService } from './@bitwarden/jslib/services/api.service'
import { AppIdService } from './@bitwarden/jslib/services/appId.service'
import { AuthService } from './@bitwarden/jslib/services/auth.service'
import { CipherService } from './@bitwarden/jslib/services/cipher.service'
import { CollectionService } from './@bitwarden/jslib/services/collection.service'
import { ContainerService } from './@bitwarden/jslib/services/container.service'
import { CryptoService } from './@bitwarden/jslib/services/crypto.service'
import { EnvironmentService } from './@bitwarden/jslib/services/environment.service'
import { FolderService } from './@bitwarden/jslib/services/folder.service'
import { I18nService } from './@bitwarden/jslib/services/i18n.service'
import { LockService } from './@bitwarden/jslib/services/lock.service'
import { NoopMessagingService } from './@bitwarden/jslib/services/noopMessaging.service'
import { PasswordGenerationService } from './@bitwarden/jslib/services/passwordGeneration.service'
import { SearchService } from './@bitwarden/jslib/services/search.service'
import { SettingsService } from './@bitwarden/jslib/services/settings.service'
import { SyncService } from './@bitwarden/jslib/services/sync.service'
import { TokenService } from './@bitwarden/jslib/services/token.service'
import { UserService } from './@bitwarden/jslib/services/user.service'
import { WebCryptoFunctionService } from './@bitwarden/jslib/services/webCryptoFunction.service'

import { CipherType } from './@bitwarden/jslib/enums/cipherType'

import WebPlatformUtilsService from './WebPlatformUtilsService'
import HtmlStorageService from './HtmlStorageService'
import MemoryStorageService from './MemoryStorageService'

import * as CozyUtils from './CozyUtils'

Utils.init()

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
   */
  constructor(instance_or_email, { urls, locale, unsafeStorage } = {}) {
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
    this.init({ unsafeStorage })
  }

  /*
   * @private
   * Initialize the undelying libraries
   */
  init({ unsafeStorage }) {
    const messagingService = new NoopMessagingService()
    const i18nService = new I18nService(this.locale, './locales')
    const platformUtilsService = new WebPlatformUtilsService(
      i18nService,
      messagingService
    )
    const cryptoFunctionService = new WebCryptoFunctionService(
      window,
      platformUtilsService
    )
    const storageService = new HtmlStorageService(platformUtilsService)
    const secureStorageService = new MemoryStorageService()
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
    const lockService = new LockService(
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
      async expired => messagingService.send('logout', { expired })
    )
    const passwordGenerationService = new PasswordGenerationService(
      cryptoService,
      storageService
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
    this.environmentService = environmentService
    this.authService = authService
    this.syncService = syncService
    this.cryptoService = cryptoService
    this.cipherService = cipherService
    this.userService = userService
    this.collectionService = collectionService
    this.passwordGenerationService = passwordGenerationService
    this.containerService = containerService
    this.lockService = lockService
    this.attachToGlobal()
    this.initFinished = this.environmentService.setUrls(this.urls)
    this.initFinished.then(() => this.emit('init', this))
  }

  /**
   * Register the containerService in globals to be able to decrypt ciphers
   *
   * @private
   */
  attachToGlobal() {
    // Utils.global.bitwardenContainerService is used by the bitwarden jslib to decrypt data. It is important that it is set to the current instance before running any code that involves crypto, especially when there are multiple WebVaultCLient instances on the page.
    // There are legitimate use cases for creating multiple client instances over the lifetime of a page. For example, the client can be created by the VaultContext component, and this component could be mounted and unmounted several times by a react app.
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
    const isLocked = this.lockService.isLocked()
    return !isAuthed || isLocked
  }

  /**
   * Lock the vault, forget the key and master password
   */
  async lock() {
    this.attachToGlobal()
    await this.initFinished
    const lock = await this.lockService.lock()
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
   * Decrypt a cipher
   * @param {Cipher} cipher
   * @return {CipherView} decrypted cipher
   */
  async decrypt(cipher) {
    this.attachToGlobal()
    return cipher.decrypt()
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
   * Save a new or modified (encrypted) cipher to the server
   * @param {Cipher} - cipher to save
   */
  async saveCipher(cipher) {
    return this.cipherService.saveWithServer(cipher)
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
    const cols = await this.getCollectionsForOrg(org)
    const colIds = cols.map(col => col.id)
    return this.cipherService.shareWithServer(cipherView, org.id, colIds)
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
   * Create a new (encrypted) cipher from a js object
   * @param {object} decryptedData
   * @return {Cipher}
   */
  async createNewCipher(decryptedData, originalCipher = null) {
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
    return this.createNewCipher(decryptedData, originalCipher)
  }
}

MicroEE.mixin(WebVaultClient)

export default WebVaultClient
