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
    console.error('Error while fetching ciphers:')
    if (isForbiddenError(err)) {
      console.error(
        `Your app must have the GET permission on the ${CIPHERS_DOCTYPE} doctype.`
      )
    } else {
      console.error(err)
    }

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
  const [isCheckingCiphers, setIsCheckingCiphers] = useState(true)
  const [hasCiphers, setHasCiphers] = useState(false)

  const { locked } = React.useContext(VaultContext)

  useEffect(() => {
    const checkCiphers = async () => {
      const hasCiphers = await checkHasCiphers(cozyClient)
      setHasCiphers(hasCiphers)
      setIsCheckingCiphers(false)

      // If there is no cipher in the vault, it means the user never used it,
      // so we don't force them to unlock it for nothing
      if (!hasCiphers && onUnlock) {
        onUnlock()
      }

    }

    checkCiphers()
  }, [])

  if (isCheckingCiphers) {
    return (
      <div className="u-ta-center">
        <Spinner size="xxlarge" />
      </div>
    )
  }

  return locked && hasCiphers ? (
    <UnlockForm onDismiss={onDismiss} closable={closable} onUnlock={onUnlock} />
  ) : (
    children
  )
}

export default withLocales(locales)(withClient(VaultUnlocker))
