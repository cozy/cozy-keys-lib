import React, { useMemo, useState, useContext } from 'react'
import { useClient } from 'cozy-client'

import { useVaultClient } from './VaultContext'
import { checkShouldUnlock } from './defaults'

const vaultUnlockContext = React.createContext()

export const useVaultUnlockContext = () => {
  return useContext(vaultUnlockContext)
}

/**
 * Provides a way to unlock the vault from the context
 *
 * The context stores whether the vault unlocking form is
 * shown. This is used by the VaultPlaceholder to decide
 * whether it needs to show the unlock form.
 *
 * If the vault has not been setup or if it is already unlocked,
 * the showUnlockForm function in the context value, will
 * call the onUnlock function immediately.
 *
 * @example
 * ```
 * import { VaultUnlockPlaceholder, useVaultUnlockContext } from 'cozy-keys-lib'
 *
 * const Component = ({ onUnlock }) => {
 *   const { showUnlockForm } = useVaultUnlockContext()
 *   return (
 *     <div>
 *       <button onClick={() => showUnlockForm({ onUnlock })} role="button">
 *         show unlock form
 *       </button>
 *     </div>
 *   )
 * }
 *
 * <VaultProvider instance='http://cozy.tools:8080'>
 *   <Component onUnlock={() => alert('vault has been unlocked')} />
 *   <VaultUnlockPlaceholder />
 * </VaultProvider>
 * ```
 */
export const VaultUnlockProvider = ({ children, checkShouldUnlock }) => {
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

      const shouldUnlock = await checkShouldUnlock(vaultClient, client)

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
  }, [
    showingUnlockForm,
    unlockFormProps,
    vaultClient,
    checkShouldUnlock,
    client
  ])

  return (
    <vaultUnlockContext.Provider value={value}>
      {children}
    </vaultUnlockContext.Provider>
  )
}

VaultUnlockProvider.defaultProps = {
  checkShouldUnlock: checkShouldUnlock
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
