import React, { useState, useCallback, useMemo, useEffect } from 'react'
import cx from 'classnames'
import get from 'lodash/get'
import PropTypes from 'prop-types'

import { useClient } from 'cozy-client'
import flag from 'cozy-flags'
import Typography from 'cozy-ui/transpiled/react/Typography'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import Button from 'cozy-ui/transpiled/react/deprecated/Button'
import Icon from 'cozy-ui/transpiled/react/Icon'
import CozyTheme from 'cozy-ui/transpiled/react/providers/CozyTheme'
import { IllustrationDialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import KeychainIcon from 'cozy-ui/transpiled/react/Icons/Keychain'
import { useWebviewIntent } from 'cozy-intent'

import CloudIcon from './IconCozySecurity'
import PasswordField from './PasswordField'

import { useVaultClient } from './VaultContext'

const getPassphraseResetUrl = client => {
  const url = new URL('/auth/passphrase_reset', client.getStackClient().uri)

  return url.href
}

const canClientAuthWithOIDC = client => {
  return (
    get(client, 'capabilities.can_auth_with_oidc') ||
    flag('vault.force-oidc-display')
  )
}

const UnlockForm = props => {
  const client = useClient()
  const vaultClient = useVaultClient()
  const { isMobile } = useBreakpoints()
  const { t } = useI18n()

  const { onUnlock, onDismiss, closable } = props

  const [unlocking, setUnlocking] = useState(false)
  const [error, setError] = useState(null)
  const [password, setPassword] = useState('')

  const handlePasswordChange = useCallback(ev => {
    setPassword(ev.currentTarget.value)
  })

  const unlockVault = useCallback(async () => {
    setUnlocking(true)
    setError(null)
    try {
      await vaultClient.unlock(password)
      if (onUnlock) {
        onUnlock()
      }
    } catch (error) {
      setError(error)
    } finally {
      setUnlocking(false)
    }
  }, [vaultClient, onUnlock, password])

  const handleVaultUnlock = useCallback(
    ev => {
      ev.preventDefault()
      unlockVault()
    },
    [unlockVault]
  )

  const getPassphraseResetUrlCb = useMemo(() => getPassphraseResetUrl(client), [
    client
  ])

  const canAuthWithOIDC = canClientAuthWithOIDC(client)

  const webviewIntent = useWebviewIntent()

  useEffect(() => {
    webviewIntent &&
      webviewIntent.call(
        'setFlagshipUI',
        {
          bottomTheme: 'light',
          topTheme: 'light'
        },
        'cozy-keys-lib/UnlockForm'
      )

    return () =>
      webviewIntent &&
      webviewIntent.call(
        'setFlagshipUI',
        {
          bottomTheme: 'light',
          topTheme: 'light'
        },
        'cozy-keys-lib/UnlockForm'
      )
  }, [webviewIntent])

  return (
    <CozyTheme variant="inverted">
      <IllustrationDialog
        size="small"
        open={true}
        onClose={closable && onDismiss}
        content={
          <form
            onSubmit={handleVaultUnlock}
            className="u-stack-m u-flex u-flex-column u-flex-items-center"
          >
            {canAuthWithOIDC ? (
              <Icon icon={KeychainIcon} size={64} className="u-mb-half" />
            ) : (
              <CloudIcon className="u-mb-half" size={104} />
            )}
            <Typography variant="h3" gutterBottom>
              {canAuthWithOIDC ? t('unlock.title-oidc') : t('unlock.title')}
            </Typography>
            {error ? (
              <Typography variant="body1" className="u-error">
                {t('unlock.error')}
              </Typography>
            ) : (
              <Typography variant="body1">{t('unlock.subtitle')}</Typography>
            )}

            <PasswordField
              id="idField"
              label={
                canAuthWithOIDC ? t('unlock.label-oidc') : t('unlock.label')
              }
              value={password}
              onChange={handlePasswordChange}
              fullWidth
              className="u-mt-2"
            />

            <Typography
              variant="body1"
              component="a"
              color="primary"
              href={getPassphraseResetUrlCb}
              className="u-link u-mt-1 u-flex-self-start"
            >
              {t('unlock.forgotten-password')}
            </Typography>
          </form>
        }
        actions={
          <Button
            onClick={handleVaultUnlock}
            label={t('unlock.unlock')}
            theme="primary"
            className={cx({
              'u-mt-1': !isMobile,
              'u-mt-auto': isMobile
            })}
            busy={unlocking}
            extension="full"
          />
        }
      />
    </CozyTheme>
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
