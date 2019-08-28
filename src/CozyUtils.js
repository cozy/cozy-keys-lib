import StrippedWebPlatformUtilsService from './StrippedWebPlatformUtilsService'

import { CryptoService } from './@bitwarden/jslib/services/crypto.service'
import { WebCryptoFunctionService } from './@bitwarden/jslib/services/webCryptoFunction.service'

/**
 * Get user (fake) email
 * This email is generated with the instance URL
 * @param {string} instance - URL like https://xx.mycozy.cloud
 * @return {string} email
 */
export function getEmail(instance) {
  if (instance.match('@')) {
      return instance
  } else {
    const url = new URL(instance.toLowercase())
    return 'me@' + url.hostname
  }  
}

/**
 * Get the hashed password used for login
 * @param {string} instance_or_email - URL of the cozy instance
 * @param {string} masterPassword - master password
 * @param {integer} kdf
 * @param {integer} kdfIterations
 * @return {string} hashed password as base64 string
 */
export async function getHashedPassword(instance_or_email, masterPassword, kdf, kdfIterations) {
  const email = getEmail(instance_or_email)
  const cryptoService = getLightCryptoService()
  const key = await cryptoService.makeKey(masterPassword, email, kdf, kdfIterations);
  const hashedPassword = await cryptoService.hashPassword(masterPassword, key);
  return hashedPassword
}

/**
 * @private
 * get a light crypto service only usable for login
 * @return {CryptoService}
 */
function getLightCryptoService() {
  const storageService = null
  const secureStorageService = null 
  const platformUtilsService = new StrippedWebPlatformUtilsService()
  const cryptoFunctionService = new WebCryptoFunctionService(
    window,
    platformUtilsService
  )
  const cryptoService = new CryptoService(
    storageService,
    secureStorageService,
    cryptoFunctionService
  )
  return cryptoService
}

export default { getHashedPassword, getEmail }