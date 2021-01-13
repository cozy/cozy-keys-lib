import React, { useState, useCallback, useMemo } from 'react'
import cx from 'classnames'
import PropTypes from 'prop-types'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useClient } from 'cozy-client'
import useBreakpoints from 'cozy-ui/transpiled/react/hooks/useBreakpoints'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import Button from 'cozy-ui/transpiled/react/Button'
import CozyTheme from 'cozy-ui/transpiled/react/CozyTheme'
import { IllustrationDialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import { withStyles } from '@material-ui/core/styles'

import CloudIcon from './IconCozySecurity'
import PasswordField from './PasswordField'

import { useVaultClient } from './VaultContext'

const getPassphraseResetUrl = client => {
  const url = new URL('/auth/passphrase_reset', client.getStackClient().uri)

  return url.href
}

const ExpandedIllustrationDialog = withStyles({
  paper: {
    '&.small': {
      width: '100%',
      height: '100%',
      maxWidth: '100%',
      maxHeight: '100%',
      margin: 0
    }
  },
  root: {
    '& .dialogContentInner': {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      height: '80%',
      width: '100%'
    }
  }
  // eslint-disable-next-line no-unused-vars
})(IllustrationDialog)

const UnlockDialog = ({ useAllAvailableSpace, ...props }) => {
  return useAllAvailableSpace ? (
    <ExpandedIllustrationDialog {...props} />
  ) : (
    <IllustrationDialog {...props} />
  )
}

const UnlockForm = props => {
  const client = useClient()
  const vaultClient = useVaultClient()
  const { isMobile } = useBreakpoints()
  const { t } = useI18n()

  const { onUnlock, onDismiss, closable, useAllAvailableSpace } = props

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

  return (
    <CozyTheme variant="inverted">
      <UnlockDialog
        size="small"
        open={true}
        onClose={closable ? onDismiss : null}
        useAllAvailableSpace={useAllAvailableSpace}
        content={
          <form
            onSubmit={handleVaultUnlock}
            className="u-stack-m u-flex u-flex-column u-flex-items-center"
          >
            <CloudIcon className="u-mb-half" />
            <Typography variant="h3" gutterBottom>
              {t('unlock.title')}
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
              label={t('unlock.label')}
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
