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
  initPlatformUtilsService() {
    return new CliPlatformUtilsService('node', manifest)
  }

  initCryptoFunctionService() {
    return new NodeCryptoFunctionService()
  }

  initSecureStorageService() {
    return new NodeEnvSecureStorageService(
      new MemoryStorageService(),
      () => this.cryptoService
    )
  }

  initStorageService() {
    return new MemoryStorageService()
  }
}

MicroEE.mixin(NodeVaultClient)

export default NodeVaultClient
