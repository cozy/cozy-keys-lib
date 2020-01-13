const CIPHERS_DOCTYPE = 'com.bitwarden.ciphers'

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
    console.error('Error while fetching ciphers:')
    if (isForbiddenError(err)) {
      console.error(
        `Your app must have the GET permission on the ${CIPHERS_DOCTYPE} doctype.`
      )
    } else {
      console.error(err)
    }
    /* eslint-enable no-console */

    return false
  }
}
