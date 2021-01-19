import React, { useContext, useState, useEffect } from 'react'
import PropTypes from 'prop-types'

import Spinner from 'cozy-ui/transpiled/react/Spinner'
import Overlay from 'cozy-ui/transpiled/react/Overlay'
import withLocales from 'cozy-ui/transpiled/react/I18n/withLocales'
import { useClient } from 'cozy-client'

import localesEn from '../locales/en.json'
import localesFr from '../locales/fr.json'

import { VaultContext } from './VaultContext'
import UnlockForm from './UnlockForm'
import { checkShouldUnlock } from './defaults'

const locales = {
  en: localesEn,
  fr: localesFr
}

const VaultUnlocker = ({
  children,
  onDismiss,
  closable,
  onUnlock,
  UnlockForm,
  checkShouldUnlock
}) => {
  const cozyClient = useClient()
  const { locked, client: vaultClient } = useContext(VaultContext)

  const [showSpinner, setShowSpinner] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [shouldUnlock, setShouldUnlock] = useState(false)

  useEffect(() => {
    let interval = setInterval(() => {
      setShowSpinner(true)
    }, 1000)
    return () => clearInterval(interval)
  }) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const doCheckShouldUnlock = async () => {
      const shouldUnlock = await checkShouldUnlock(vaultClient, cozyClient)

      setShouldUnlock(shouldUnlock)
      setIsChecking(false)

      if (!shouldUnlock && onUnlock) {
        onUnlock()
      }
    }

    doCheckShouldUnlock()
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

VaultUnlocker.propTypes = {
  onDismiss: PropTypes.func.isRequired,
  closable: PropTypes.bool,
  onUnlock: PropTypes.func.isRequired
}

VaultUnlocker.defaultProps = {
  UnlockForm,
  checkShouldUnlock: checkShouldUnlock
}

export default withLocales(locales)(VaultUnlocker)
