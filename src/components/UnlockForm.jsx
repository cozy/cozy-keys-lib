import React from 'react'
import PropTypes from 'prop-types'
import Modal, { ModalContent } from 'cozy-ui/transpiled/react/Modal'
import { MainTitle, Text, ErrorMessage } from 'cozy-ui/transpiled/react/Text'
import Button from 'cozy-ui/transpiled/react/Button'
import CloudIcon from '../../assets/icon-cozy-security.svg'
import palette from 'cozy-ui/transpiled/react/palette'
import { translate } from 'cozy-ui/transpiled/react/I18n'
import withBreakpoints from 'cozy-ui/transpiled/react/helpers/withBreakpoints'
import cx from 'classnames'
import { withClient } from 'cozy-client'
import compose from 'lodash/flowRight'
import MuiCozyTheme from 'cozy-ui/transpiled/react/MuiCozyTheme'
import PasswordField from './PasswordField'

import { withVaultClient } from './VaultContext'

const getPassphraseResetUrl = client => {
  const url = new URL('/auth/passphrase_reset', client.getStackClient().uri)

  return url.href
}

const spacingToPadding = {
  m: 3,
  s: 1
}

const UnlockFormContent = ({ spacing, className, children, ...props }) => {
  const padding = spacingToPadding[spacing]

  return (
    <ModalContent
      fixed
      className={cx(
        'u-flex',
        'u-flex-grow-1',
        'u-flex-column',
        'u-flex-items-center',
        'u-bdw-0',
        'u-pt-3',
        `u-pb-${padding}`,
        `u-ph-${padding}`,
        className
      )}
      {...props}
    >
      {children}
    </ModalContent>
  )
}

UnlockFormContent.propTypes = {
  spacing: PropTypes.oneOf(['m', 's'])
}

UnlockFormContent.defaultProps = {
  spacing: 'm'
}

class UnlockForm extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      password: '',
      unlocking: false,
      error: false
    }

    this.unlockVault = this.unlockVault.bind(this)
    this.handleVaultUnlock = this.handleVaultUnlock.bind(this)
  }

  handleVaultUnlock(event) {
    event.preventDefault()
    this.unlockVault()
  }

  async unlockVault() {
    const { vaultClient, onUnlock } = this.props
    this.setState({ unlocking: true, error: null })
    try {
      await vaultClient.unlock(this.state.password)
      onUnlock()
    } catch (error) {
      this.setState({ error })
    } finally {
      this.setState({ unlocking: false })
    }
  }

  getPassphraseResetUrl() {
    return getPassphraseResetUrl(this.props.client)
  }

  render() {
    const {
      t,
      onDismiss,
      closable,
      breakpoints: { isMobile }
    } = this.props
    const { password, error, unlocking } = this.state

    return (
      <MuiCozyTheme variant="inverted">
        <Modal
          mobileFullscreen
          className="u-bg-primaryColor"
          closeBtnColor={palette['white']}
          dismissAction={onDismiss}
          closable={closable}
        >
          <form
            onSubmit={this.handleVaultUnlock}
            className="u-flex u-flex-column u-flex-grow-1"
          >
            <UnlockFormContent spacing={isMobile ? 's' : 'm'}>
              <CloudIcon />
              <MainTitle className="u-primaryContrastTextColor">
                {t('unlock.title')}
              </MainTitle>
              {error ? (
                <ErrorMessage>{t('unlock.error')}</ErrorMessage>
              ) : (
                <Text className="u-primaryContrastTextColor">
                  {t('unlock.subtitle')}
                </Text>
              )}

              <PasswordField
                id="idField"
                label={t('unlock.label')}
                value={password}
                onChange={e =>
                  this.setState({ password: e.currentTarget.value })
                }
                fullWidth
                className="u-mt-2"
              />

              <Text
                tag="a"
                href={this.getPassphraseResetUrl()}
                className="u-link u-primaryContrastTextColor u-mt-1 u-flex-self-start"
              >
                {t('unlock.forgotten-password')}
              </Text>
              <Button
                label={t('unlock.unlock')}
                theme="secondary"
                className={cx('u-primaryColor', {
                  'u-mt-2-half': !isMobile,
                  'u-mt-auto': isMobile
                })}
                busy={unlocking}
                extension="full"
              />
            </UnlockFormContent>
          </form>
        </Modal>
      </MuiCozyTheme>
    )
  }
}

UnlockForm.propTypes = {
  vaultClient: PropTypes.object.isRequired,
  t: PropTypes.func.isRequired,
  onDismiss: PropTypes.func.isRequired,
  closable: PropTypes.bool,
  client: PropTypes.object.isRequired
}

UnlockForm.defaultProps = {
  closable: true
}

export default compose(
  withClient,
  withVaultClient,
  translate(),
  withBreakpoints()
)(UnlockForm)
