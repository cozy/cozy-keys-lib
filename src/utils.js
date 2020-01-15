const CIPHERS_DOCTYPE = 'com.bitwarden.ciphers'
const SETTINGS_DOCTYPE = 'io.cozy.settings'

const isForbiddenError = rawError => {
  return rawError.message.match(/code=403/)
}

export const checkHasCiphers = async cozyClient => {
  try {
    const { data: ciphers } = await cozyClient.query(
      cozyClient.find(CIPHERS_DOCTYPE)
    )

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

export const checkHasInstalledExtension = async cozyClient => {
  try {
    const { rows: docs } = await cozyClient
      .getStackClient()
      .fetchJSON('GET', `/data/${SETTINGS_DOCTYPE}/_normal_docs`)

    const [bitwardenSettings] = docs.filter(
      doc => doc._id === 'io.cozy.settings.bitwarden'
    )

    return bitwardenSettings && bitwardenSettings.extension_installed
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
