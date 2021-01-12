import React, { useState, useEffect } from 'react'
import { VaultContext } from './VaultContext'
import UnlockForm from './UnlockForm'
import withLocales from 'cozy-ui/transpiled/react/I18n/withLocales'
import localesEn from '../locales/en.json'
import localesFr from '../locales/fr.json'
import Spinner from 'cozy-ui/transpiled/react/Spinner'
import Overlay from 'cozy-ui/transpiled/react/Overlay'
import { useClient } from 'cozy-client'
import { checkHasCiphers, checkHasInstalledExtension } from '../CozyUtils'

const locales = {
  en: localesEn,
  fr: localesFr
}

const VaultUnlocker = ({ children, onDismiss, closable, onUnlock }) => {
  const cozyClient = useClient()
  const [showSpinner, setShowSpinner] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [shouldUnlock, setShouldUnlock] = useState(false)

  const { locked } = React.useContext(VaultContext)

  useEffect(() => {
    let interval = setInterval(() => {
      setShowSpinner(true)
    }, 1000)
    return () => clearInterval(interval)
  }) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const checkShouldUnlock = async () => {
      let shouldUnlock = await checkHasCiphers(cozyClient)

      if (!shouldUnlock) {
        shouldUnlock = await checkHasInstalledExtension(cozyClient)
      }

      setShouldUnlock(shouldUnlock)
      setIsChecking(false)

      // If there is no cipher in the vault, it means the user never used it,
      // so we don't force them to unlock it for nothing
      if (!shouldUnlock && onUnlock) {
        onUnlock()
      }
    }

    checkShouldUnlock()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (isChecking) {
    return (
      <Overlay>
        <div className="u-ta-center u-flex u-flex-column u-flex-grow-1 u-mv-3">
          {showSpinner ? <Spinner size="large" color="white" /> : null}
        </div>
      </Overlay>
    )
  }

  return locked && shouldUnlock ? (
    <UnlockForm onDismiss={onDismiss} closable={closable} onUnlock={onUnlock} />
  ) : (
    children || null
  )
}

export default withLocales(locales)(VaultUnlocker)
