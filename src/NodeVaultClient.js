import WebVaultClient from './WebVaultClient'
import manifest from '../package.json'

import MicroEE from 'microee'

import { Utils } from './@bitwarden/jslib/misc/utils'

import { CliPlatformUtilsService } from './@bitwarden/jslib/cli/services/cliPlatformUtils.service'
import { NodeCryptoFunctionService } from './@bitwarden/jslib/services/nodeCryptoFunction.service'

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
