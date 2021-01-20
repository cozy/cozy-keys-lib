import React from 'react'
import { useVaultUnlockContext } from './vaultUnlockContext'
import VaultUnlocker from './VaultUnlocker'

export const VaultUnlockPlaceholder = ({
  unlockFormProps: unlockFormPropsProp
}) => {
  const { showingUnlockForm, unlockFormProps } = useVaultUnlockContext()
  if (!showingUnlockForm) {
    return null
  }
  return <VaultUnlocker {...unlockFormProps} {...unlockFormPropsProp} />
}

export default VaultUnlockPlaceholder
