import React, { useMemo, useState, useContext } from 'react'
import { useClient } from 'cozy-client'
import { useVaultClient } from './VaultContext'
import * as CozyUtils from '../CozyUtils'

const vaultUnlockContext = React.createContext()
export const useVaultUnlockContext = () => {
  return useContext(vaultUnlockContext)
}

export const VaultUnlockProvider = ({ children }) => {
  const client = useClient()
  const vaultClient = useVaultClient()
  const [showingUnlockForm, setShowingUnlockForm] = useState(false)
  const [unlockFormProps, setUnlockFormProps] = useState(null)

  const value = useMemo(() => {
    const showUnlockForm = async unlockFormProps => {
      if (!unlockFormProps || !unlockFormProps.onUnlock) {
        throw new Error(
          'onUnlock must be passed in showUnlockForm options. showUnlockForm({ onUnlock: () => alert("Vault has been unlocked") })'
        )
      }
      const onUnlock = () => {
        setShowingUnlockForm(false)
        unlockFormProps.onUnlock && unlockFormProps.onUnlock()
      }
      const onDismiss = () => {
        setShowingUnlockForm(false)
        unlockFormProps.onDismiss && unlockFormProps.onDismiss()
      }

      const shouldUnlock =
        (await CozyUtils.checkHasInstalledExtension(client)) &&
        (await vaultClient.isLocked())
      if (shouldUnlock) {
        setUnlockFormProps({
          ...unlockFormProps,
          onUnlock,
          onDismiss
        })
        setShowingUnlockForm(true)
      } else {
        onUnlock()
      }
    }

    return {
      showingUnlockForm,
      showUnlockForm,
      unlockFormProps,
      vaultClient
    }
  }, [showingUnlockForm, unlockFormProps, vaultClient, client])

  return (
    <vaultUnlockContext.Provider value={value}>
      {children}
    </vaultUnlockContext.Provider>
  )
}

export const withVaultUnlockContext = Component => {
  const Wrapper = props => {
    const vaultUnlockContextValue = useVaultUnlockContext()
    return <Component {...props} {...vaultUnlockContextValue} />
  }
  Wrapper.displayName = `withVaultUnlockContext(${Component.displayName ||
    Component.name})`
  return Wrapper
}
