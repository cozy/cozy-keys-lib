import StrippedWebPlatformUtilsService from './StrippedWebPlatformUtilsService'
import { Q } from 'cozy-client'
import { CryptoService } from './@bitwarden/jslib/services/crypto.service'
import { WebCryptoFunctionService } from './@bitwarden/jslib/services/webCryptoFunction.service'

const CIPHERS_DOCTYPE = 'com.bitwarden.ciphers'
const SETTINGS_DOCTYPE = 'io.cozy.settings'

const isForbiddenError = rawError => {
  return rawError.message.match(/code=403/)
}

/**
 * Check if the parameter is an instance URL or an email
 * @param {string} instance_or_email - instance url or email
 * @return {boolean}
 */
export function isEmail(instance_or_email) {
  return instance_or_email.match('@')
}

/**
 * Check if the parameter is an instance URL or an email
 * @param {string} instance_or_email - instance url or email
 * @return {boolean}
 * @see isEmail
 */
export function isInstance(instance_or_email) {
  return !isEmail(instance_or_email)
}

/**
 * Get user (fake) email
 * This email is generated with the instance URL
 * @param {string} instance - URL like https://xx.mycozy.cloud
 * @return {string} email
 */
export function getEmail(instance) {
  if (isEmail(instance)) {
    return instance.toString()
  } else {
    const url = new URL(instance.toString().toLowerCase())
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
export async function getHashedPassword(
  instance_or_email,
  masterPassword,
  kdf,
  kdfIterations
) {
  const email = getEmail(instance_or_email)
  const cryptoService = getLightCryptoService()
  const key = await cryptoService.makeKey(
    masterPassword,
    email,
    kdf,
    kdfIterations
  )
  const hashedPassword = await cryptoService.hashPassword(masterPassword, key)
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

/**
 * Check if there are ciphers in the database
 * @param {object} cozyClient - cozy-client instance
 * @return {bool} whether there are ciphers in the database or not
 */
export const checkHasCiphers = async cozyClient => {
  try {
    const { data: ciphers } = await cozyClient.query(Q(CIPHERS_DOCTYPE))

    return ciphers.length > 0
  } catch (err) {
    /* eslint-disable no-console */
    if (isForbiddenError(err)) {
      console.error(
        `Your app must have the GET permission on the ${CIPHERS_DOCTYPE} doctype.`
      )
    } else {
      console.error(err.message)
    }
    /* eslint-enable no-console */

    return false
  }
}

/**
 * Check if the extension is installed, based on the Cozy settings
 * @param {object} cozyClient - cozy-client instance
 * @return {bool} whether the extension is installed or not
 */
export const checkHasInstalledExtension = async cozyClient => {
  try {
    const { rows: docs } = await cozyClient
      .getStackClient()
      .fetchJSON('GET', `/data/${SETTINGS_DOCTYPE}/_normal_docs`)

    const [bitwardenSettings] = docs.filter(
      doc => doc._id === 'io.cozy.settings.bitwarden'
    )
    return bitwardenSettings && !!bitwardenSettings.extension_installed
  } catch (err) {
    /* eslint-disable no-console */
    if (isForbiddenError(err)) {
      console.error(
        `Your app must have the GET permission on the ${SETTINGS_DOCTYPE} doctype.`
      )
    } else {
      console.error(err.message)
    }
    /* eslint-enable no-console */

    return false
  }
}
