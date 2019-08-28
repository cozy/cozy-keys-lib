import React from 'react'
import { VaultContext } from './VaultContext'
import UnlockForm from './UnlockForm'
import withLocales from 'cozy-ui/transpiled/react/I18n/withLocales'
import localesEn from '../locales/en.json'
import localesFr from '../locales/fr.json'

const locales = {
  en: localesEn,
  fr: localesFr
}

const VaultUnlocker = ({ children }) => {
  const { client, locked } = React.useContext(VaultContext)
  return (!locked) ? children : (
    <UnlockForm />
  )
}

export default withLocales(locales)(VaultUnlocker)
