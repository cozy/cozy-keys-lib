import WebVaultClient from './WebVaultClient'
import manifest from '../package.json'

import MicroEE from 'microee'

import { Utils } from './@bitwarden/jslib/misc/utils'

import { ApiService } from './@bitwarden/jslib/services/api.service'
import { AppIdService } from './@bitwarden/jslib/services/appId.service'
import { AuthService } from './@bitwarden/jslib/services/auth.service'
import { CipherService } from './@bitwarden/jslib/services/cipher.service'
import { CliPlatformUtilsService } from './@bitwarden/jslib/cli/services/cliPlatformUtils.service'
import { CollectionService } from './@bitwarden/jslib/services/collection.service'
import { ContainerService } from './@bitwarden/jslib/services/container.service'
import { CryptoService } from './@bitwarden/jslib/services/crypto.service'
import { EnvironmentService } from './@bitwarden/jslib/services/environment.service'
import { FolderService } from './@bitwarden/jslib/services/folder.service'
import { I18nService } from './@bitwarden/jslib/services/i18n.service'
import { LockService } from './@bitwarden/jslib/services/lock.service'
import { NodeCryptoFunctionService } from './@bitwarden/jslib/services/nodeCryptoFunction.service'
import { NoopMessagingService } from './@bitwarden/jslib/services/noopMessaging.service'
import { PasswordGenerationService } from './@bitwarden/jslib/services/passwordGeneration.service'
import { SearchService } from './@bitwarden/jslib/services/search.service'
import { SettingsService } from './@bitwarden/jslib/services/settings.service'
import { SyncService } from './@bitwarden/jslib/services/sync.service'
import { TokenService } from './@bitwarden/jslib/services/token.service'
import { UserService } from './@bitwarden/jslib/services/user.service'

import MemoryStorageService from './MemoryStorageService'
import NodeEnvSecureStorageService from './NodeEnvSecureStorageService'

Utils.init()

class NodeVaultClient extends WebVaultClient {
  /*
   * @private
   * Initialize the undelying libraries
   */
  init() {
    const messagingService = new NoopMessagingService()
    const i18nService = new I18nService(this.locale, './locales')
    const platformUtilsService = new CliPlatformUtilsService('node', manifest)
    const cryptoFunctionService = new NodeCryptoFunctionService()
    const storageService = new MemoryStorageService()
    const secureStorageService = new NodeEnvSecureStorageService(
      new MemoryStorageService(),
      () => this.cryptoService
    )
    const cryptoService = new CryptoService(
      storageService,
      secureStorageService,
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
    this.Utils = Utils
  }
}

MicroEE.mixin(NodeVaultClient)

export default NodeVaultClient
