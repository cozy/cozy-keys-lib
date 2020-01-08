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
      try {
        const { data } = await cozyClient.query(
          cozyClient.find(CIPHERS_DOCTYPE).where({ shared_with_cozy: true })
        )

        const hasCiphers = data.length > 0

        setHasCiphers(hasCiphers)

        // If there is no cipher in the vault, it means the user never used it,
        // so we don't force them to unlock it for nothing
        if (!hasCiphers && onUnlock) {
          onUnlock()
        }
      } catch (err) {
        /* eslint-disable no-console */
        console.error(`Error while fetching ${CIPHERS_DOCTYPE}:`)
        console.error(err)
        /* eslint-enable no-console */
      } finally {
        setIsCheckingCiphers(false)
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
