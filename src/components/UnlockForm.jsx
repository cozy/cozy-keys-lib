import React from 'react'
import PropTypes from 'prop-types'
import Modal, {
  ModalContent,
  ModalFooter
} from 'cozy-ui/transpiled/react/modal'
import { MainTitle, Text } from 'cozy-ui/transpiled/react/Text'
import Icon from 'cozy-ui/transpiled/react/Icon'
import Field from 'cozy-ui/transpiled/react/Field'
import Button from 'cozy-ui/transpiled/react/Button'
import CloudIcon from '../../assets/icon-cozy-security.svg'
import palette from 'cozy-ui/transpiled/react/palette'
import { translate } from 'cozy-ui/transpiled/react/I18n'

import { withVaultClient } from './VaultContext'

class UnlockForm extends React.Component {
  state = {
    password: ''
  }

  unlockVault() {
    const { vaultClient } = this.props
    vaultClient.unlock()
  }

  render() {
    const { t } = this.props
    return (
      <Modal
        mobileFullscreen
        className="u-bg-dodgerBlue"
        closeBtnColor={palette['white']}
      >
        <ModalContent
          fixed
          className="u-flex u-flex-column u-flex-items-center u-flex-grow-1 u-bg-dodgerBlue u-bdw-0"
        >
          <div className="u-mt-3">
            <CloudIcon />
          </div>
          <MainTitle className="u-white">{t('unlock.title')}</MainTitle>
          <Text className="u-mb-1-half u-white">{t('unlock.subtitle')}</Text>

          <Field
            id="idField"
            label={t('unlock.label')}
            type="password"
            value={this.state.password}
            onChange={e => this.setState({ password: e.currentTarget.value })}
            fullwidth
            className="u-w-100 u-white"
            secondaryComponent={({ visible }) =>
              visible ? (
                <Icon aria-label={t('unlock.show')} icon="eye-closed" />
              ) : (
                <Icon icon="eye" aria-label={t('unlock.hide')} />
              )
            }
            labelProps={{ className: 'u-white' }}
          />
        </ModalContent>
        <ModalFooter className="u-flex u-flex-justify-end">
          <Button label={t('unlock.abort')} className="u-mr-half u-w-100-t" />
          <Button
            label={t('unlock.unlock')}
            theme="secondary"
            className="u-w-100-t u-dodgerBlue"
            onClick={this.unlockVault.bind(this)}
          />
        </ModalFooter>
      </Modal>
    )
  }
}

export default withVaultClient(translate()(UnlockForm))
