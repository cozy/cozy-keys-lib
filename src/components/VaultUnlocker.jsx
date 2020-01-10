import React, { useState, useEffect } from 'react'
import { VaultContext } from './VaultContext'
import UnlockForm from './UnlockForm'
import withLocales from 'cozy-ui/transpiled/react/I18n/withLocales'
import localesEn from '../locales/en.json'
import localesFr from '../locales/fr.json'
import Spinner from 'cozy-ui/transpiled/react/Spinner'
import { withClient } from 'cozy-client'

const locales = {
  en: localesEn,
  fr: localesFr
}

const CIPHERS_DOCTYPE = 'com.bitwarden.ciphers'
const SETTINGS_DOCTYPE = 'io.cozy.settings'

const isForbiddenError = rawError => {
  return rawError.message.match(/code=403/)
}

const checkHasCiphers = async cozyClient => {
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

const checkHasCozyOrg = async cozyClient => {
  try {
    const { rows: docs } = await cozyClient
      .getStackClient()
      .fetchJSON('GET', `/data/${SETTINGS_DOCTYPE}/_normal_docs`)

    const [bitwardenSettings] = docs.filter(
      doc => doc._id === 'io.cozy.settings.bitwarden'
    )

    return bitwardenSettings && bitwardenSettings.organization_id
  } catch (err) {
    /* eslint-disable no-console */
    console.error('Error while fetching bitwarden settings:')
    if (isForbiddenError(err)) {
      console.error(
        `Your app must have the GET permission on the ${SETTINGS_DOCTYPE} doctype.`
      )
    } else {
      console.error(err)
    }
    /* eslint-enable no-console */

    return false
  }
}

const VaultUnlocker = ({
  children,
  onDismiss,
  closable,
  onUnlock,
  client: cozyClient
}) => {
  const [isChecking, setIsChecking] = useState(true)
  const [shouldUnlock, setShouldUnlock] = useState(false)

  const { locked } = React.useContext(VaultContext)

  useEffect(() => {
    const checkShouldUnlock = async () => {
      const hasCiphers = await checkHasCiphers(cozyClient)
      const hasCozyOrg = await checkHasCozyOrg(cozyClient)
      const shouldUnlock = hasCiphers || hasCozyOrg

      setShouldUnlock(shouldUnlock)
      setIsChecking(false)

      // If there is no cipher in the vault, it means the user never used it,
      // so we don't force them to unlock it for nothing
      if (!shouldUnlock && onUnlock) {
        onUnlock()
      }
    }

    checkShouldUnlock()
  }, [])

  if (isChecking) {
    return (
      <div className="u-ta-center">
        <Spinner size="xxlarge" />
      </div>
    )
  }

  return locked && shouldUnlock ? (
    <UnlockForm onDismiss={onDismiss} closable={closable} onUnlock={onUnlock} />
  ) : (
    children
  )
}

export default withLocales(locales)(withClient(VaultUnlocker))
