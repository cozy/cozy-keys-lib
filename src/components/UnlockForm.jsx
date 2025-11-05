import React, { useState, useCallback } from 'react'
import get from 'lodash/get'
import PropTypes from 'prop-types'

import flag from 'cozy-flags'
import AuthentificationDialog from 'cozy-ui-plus/dist/Dialogs/AuthentificationDialog'

import { useVaultClient } from './VaultContext'
import { useClient } from 'cozy-client'

const canClientAuthWithOIDC = client => {
  return (
    get(client, 'capabilities.can_auth_with_oidc') ||
    flag('vault.force-oidc-display')
  )
}

const UnlockForm = props => {
  const client = useClient()
  const vaultClient = useVaultClient()

  const { onUnlock, onDismiss, closable } = props

  const [isUnlocking, setUnlocking] = useState(false)
  const [error, setError] = useState(null)
  const canAuthWithOIDC = canClientAuthWithOIDC(client)

  const handleUnlock = useCallback(
    async password => {
      setUnlocking(true)
      setError(null)
      try {
        await vaultClient.unlock(password)
        if (onUnlock) {
          onUnlock()
        }
      } catch (e) {
        setError(
          e.response.error === 'invalid password'
            ? 'invalid_password'
            : 'server_error'
        )
      } finally {
        setUnlocking(false)
      }
    },
    [vaultClient, onUnlock]
  )

  return (
    <AuthentificationDialog
      onClose={closable ? onDismiss : null}
      onSubmit={handleUnlock}
      isLoading={isUnlocking}
      isOIDC={canAuthWithOIDC}
      error={error}
    />
  )
}

UnlockForm.propTypes = {
  onDismiss: PropTypes.func.isRequired,
  closable: PropTypes.bool,
  onUnlock: PropTypes.func
}

UnlockForm.defaultProps = {
  closable: true
}

export default UnlockForm
